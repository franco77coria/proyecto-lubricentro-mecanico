"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const productoSchema = z.object({
  sku: z.string().trim().max(40).optional(),
  nombre: z.string().trim().min(1, { message: "El nombre es obligatorio" }).max(100),
  marca: z.string().trim().max(50).optional(),
  categoria: z.string().trim().max(50).optional(),
  unidad: z.string().trim().default("unid"),
  stockMin: z.coerce.number().int().min(0).default(0),
  precioVenta: z.coerce.number().min(0).default(0),
  costoUnitario: z.coerce.number().min(0).default(0),
  stockInicial: z.coerce.number().min(0).default(0),
});

export type DatosProducto = z.infer<typeof productoSchema>;

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
