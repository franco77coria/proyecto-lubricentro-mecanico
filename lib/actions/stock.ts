"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { productoSchema, type DatosProducto } from "@/lib/schemas/producto";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export async function crearProducto(datos: DatosProducto): Promise<{ productoId?: string; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  const parseado = productoSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  const d = parseado.data;
  const tallerId = sesion.perfil.taller_id;

  try {
    const supabase = await crearClienteServidor();

    const { data: prod, error } = await supabase
      .from("producto")
      .insert({
        taller_id: tallerId,
        sku: d.sku || null,
        codigo_barras: d.codigoBarras || null,
        nombre: d.nombre,
        marca: d.marca || null,
        categoria: d.categoria || null,
        unidad: d.unidad,
        stock_min: d.stockMin,
        precio_venta: d.precioVenta,
      })
      .select("id")
      .single();

    if (error || !prod) {
      // Escanear el bidón de un producto que ya está cargado es lo más normal
      // del mundo. Decirlo así evita que el mostrador cree un duplicado.
      if (error?.code === "23505") {
        return {
          error: error.message.includes("codigo_barras")
            ? "Ese código de barras ya está en otro producto. Buscalo en la lista."
            : "Ese SKU ya está usado por otro producto.",
        };
      }
      console.error("[crearProducto]", error?.code);
      return { error: "No se pudo crear el producto." };
    }

    // Registrar el stock inicial como movimiento de inventario si > 0
    if (d.stockInicial > 0) {
      await supabase.from("movimiento_stock").insert({
        taller_id: tallerId,
        producto_id: prod.id,
        tipo: "ajuste",
        cantidad: d.stockInicial,
        costo_unitario: d.costoUnitario,
        usuario_id: sesion.user.id,
      });
    }

    revalidatePath("/stock");
    return { productoId: prod.id };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function registrarMovimientoStock(
  productoId: string,
  tipo: "compra" | "consumo" | "ajuste" | "devolucion",
  cantidad: number,
  costoUnitario: number = 0,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  if (cantidad === 0) return { error: "La cantidad debe ser distinta de cero." };

  try {
    const supabase = await crearClienteServidor();

    const { error } = await supabase.from("movimiento_stock").insert({
      taller_id: sesion.perfil.taller_id,
      producto_id: productoId,
      tipo,
      cantidad,
      costo_unitario: costoUnitario,
      usuario_id: sesion.user.id,
    });

    if (error) {
      console.error("[registrarMovimientoStock]", error.code);
      return { error: "No se pudo registrar el movimiento de stock." };
    }

    revalidatePath("/stock");
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo conectar." };
  }
}

export async function editarProducto(
  productoId: string,
  datos: {
    nombre?: string;
    marca?: string;
    categoria?: string;
    precioVenta?: number;
    stockMin?: number;
    sku?: string;
    codigoBarras?: string;
  },
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  try {
    const supabase = (await crearClienteServidor()) as any;

    const updatePayload: Record<string, unknown> = {};
    if (datos.nombre !== undefined) updatePayload.nombre = datos.nombre;
    if (datos.marca !== undefined) updatePayload.marca = datos.marca || null;
    if (datos.categoria !== undefined) updatePayload.categoria = datos.categoria || null;
    if (datos.precioVenta !== undefined) updatePayload.precio_venta = datos.precioVenta;
    if (datos.stockMin !== undefined) updatePayload.stock_min = datos.stockMin;
    if (datos.sku !== undefined) updatePayload.sku = datos.sku || null;
    if (datos.codigoBarras !== undefined) updatePayload.codigo_barras = datos.codigoBarras || null;

    if (Object.keys(updatePayload).length === 0) {
      return { error: "No se enviaron campos para actualizar." };
    }

    const { error } = await supabase
      .from("producto")
      .update(updatePayload)
      .eq("id", productoId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      if (error.code === "23505") {
        return { error: "Ya existe otro producto con ese SKU o código de barras." };
      }
      console.error("[editarProducto]", error);
      return { error: "No se pudo actualizar el producto." };
    }

    revalidatePath("/stock");
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function eliminarProducto(productoId: string): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  try {
    const supabase = await crearClienteServidor();

    const { error } = await supabase
      .from("producto")
      .delete()
      .eq("id", productoId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      // Foreign key violation — the product is referenced by an OT item or stock movement
      if (error.code === "23503") {
        return { error: "Este producto tiene movimientos o está en una orden. No se puede eliminar, solo desactivar." };
      }
      console.error("[eliminarProducto]", error);
      return { error: "No se pudo eliminar el producto." };
    }

    revalidatePath("/stock");
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo conectar con el servidor." };
  }
}
