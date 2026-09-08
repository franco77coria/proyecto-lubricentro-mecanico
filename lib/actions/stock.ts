"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import {
  productoSchema,
  editarProductoSchema,
  type DatosProducto,
  type DatosEditarProducto,
} from "@/lib/schemas/producto";
import type { Database } from "@/lib/supabase/database.types";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export async function crearProducto(datos: DatosProducto): Promise<{ productoId?: string; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };
  if (sesion.perfil.rol === "mecanico") {
    return { error: "Solo mostrador o dueño pueden crear productos." };
  }

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
  if (sesion.perfil.rol === "mecanico") {
    return { error: "Los movimientos manuales de stock están reservados a mostrador y dueño." };
  }

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
  datos: DatosEditarProducto,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };
  if (sesion.perfil.rol === "mecanico") {
    return { error: "Solo mostrador o dueño pueden editar productos." };
  }

  const validado = editarProductoSchema.safeParse(datos);
  if (!validado.success) {
    return { error: validado.error.issues[0].message };
  }

  const d = validado.data;

  try {
    const supabase = await crearClienteServidor();

    const updatePayload: Database["public"]["Tables"]["producto"]["Update"] = {};
    if (d.nombre !== undefined) updatePayload.nombre = d.nombre;
    if (d.marca !== undefined) updatePayload.marca = d.marca || null;
    if (d.categoria !== undefined) updatePayload.categoria = d.categoria || null;
    if (d.precioVenta !== undefined) updatePayload.precio_venta = d.precioVenta;
    if (d.stockMin !== undefined) updatePayload.stock_min = d.stockMin;
    if (d.sku !== undefined) updatePayload.sku = d.sku || null;
    if (d.codigoBarras !== undefined) updatePayload.codigo_barras = d.codigoBarras || null;

    if (Object.keys(updatePayload).length === 0) {
      return { error: "No se enviaron campos para actualizar." };
    }

    const { data: updated, error } = await supabase
      .from("producto")
      .update(updatePayload)
      .eq("id", productoId)
      .eq("taller_id", sesion.perfil.taller_id)
      .select("id");

    if (error) {
      if (error.code === "23505") {
        return { error: "Ya existe otro producto con ese SKU o código de barras." };
      }
      console.error("[editarProducto]", error);
      return { error: "No se pudo actualizar el producto." };
    }

    if (!updated || updated.length === 0) {
      return { error: "Producto no encontrado en este taller." };
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
  if (sesion.perfil.rol === "mecanico") {
    return { error: "Solo mostrador o dueño pueden eliminar productos." };
  }

  try {
    const supabase = await crearClienteServidor();

    const { data: deleted, error } = await supabase
      .from("producto")
      .delete()
      .eq("id", productoId)
      .eq("taller_id", sesion.perfil.taller_id)
      .select("id");

    if (error) {
      // Foreign key violation — the product is referenced by an OT item or stock movement
      if (error.code === "23503") {
        return { error: "Este producto tiene movimientos o está en una orden. No se puede eliminar, solo desactivar." };
      }
      console.error("[eliminarProducto]", error);
      return { error: "No se pudo eliminar el producto." };
    }

    if (!deleted || deleted.length === 0) {
      return { error: "Producto no encontrado en este taller." };
    }

    revalidatePath("/stock");
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo conectar con el servidor." };
  }
}
