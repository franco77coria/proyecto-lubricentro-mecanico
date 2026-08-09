"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import {
  compraSchema,
  proveedorSchema,
  type DatosCompra,
  type DatosProveedor,
} from "@/lib/schemas/compra";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface ProveedorListado {
  id: string;
  nombre: string;
  telefono: string | null;
}

export async function listarProveedores(): Promise<ProveedorListado[]> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return [];

  try {
    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("proveedor")
      .select("id, nombre, telefono")
      .eq("taller_id", sesion.perfil.taller_id)
      .eq("activo", true)
      .order("nombre", { ascending: true });
    return data ?? [];
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

export async function crearProveedor(datos: DatosProveedor): Promise<{ id?: string; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  const parseado = proveedorSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };
  const d = parseado.data;

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
      .from("proveedor")
      .insert({
        taller_id: sesion.perfil.taller_id,
        nombre: d.nombre,
        telefono: d.telefono || null,
        email: d.email || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[crearProveedor]", error.code);
      return { error: "No se pudo guardar el proveedor." };
    }
    revalidatePath("/compras");
    return { id: data.id };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar." };
  }
}

/**
 * Carga el remito completo.
 *
 * El stock y el total NO se tocan acá: los mantienen los triggers de 0027. Si
 * esta función sumara el total por su cuenta, el número podría diferir del que
 * ve cualquier otra consulta.
 *
 * La cabecera y los ítems van en dos pasos porque `compra_item` necesita el id
 * de la compra. Si falla el segundo, se borra la cabecera: una compra sin ítems
 * es basura que después nadie sabe si era un error o un remito a medio cargar.
 */
export async function crearCompra(datos: DatosCompra): Promise<{ id?: string; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };
  if (sesion.perfil.rol === "mecanico") {
    return { error: "Las compras las carga el mostrador o el dueño." };
  }

  const parseado = compraSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };
  const d = parseado.data;
  const tallerId = sesion.perfil.taller_id;

  try {
    const supabase = await crearClienteServidor();

    const { data: compra, error } = await supabase
      .from("compra")
      .insert({
        taller_id: tallerId,
        proveedor_id: d.proveedorId || null,
        comprobante: d.comprobante || null,
        fecha: d.fecha,
        notas: d.notas || null,
        creado_por: sesion.user.id,
      })
      .select("id")
      .single();

    if (error || !compra) {
      console.error("[crearCompra]", error?.code);
      return { error: "No se pudo crear la compra." };
    }

    const { error: errorItems } = await supabase.from("compra_item").insert(
      d.items.map((it) => ({
        taller_id: tallerId,
        compra_id: compra.id,
        producto_id: it.productoId,
        cantidad: it.cantidad,
        costo_unitario: it.costoUnitario,
      })),
    );

    if (errorItems) {
      console.error("[crearCompra/items]", errorItems.code);
      await supabase.from("compra").delete().eq("id", compra.id).eq("taller_id", tallerId);
      return { error: "No se pudieron cargar los ítems del remito. No se guardó nada." };
    }

    revalidatePath("/compras");
    // El stock cambió por el trigger: sin esto el inventario se sigue viendo
    // con el saldo de antes.
    revalidatePath("/stock");
    return { id: compra.id };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar." };
  }
}
