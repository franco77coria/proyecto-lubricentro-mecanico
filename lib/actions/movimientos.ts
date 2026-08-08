"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface ResultadoMovimiento {
  error?: string;
  stockNuevo?: number;
}

const ingresoSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: z.coerce.number().positive({ message: "La cantidad tiene que ser mayor a cero" }).max(100000),
  costoUnitario: z.coerce.number().min(0).max(100000000),
  comprobante: z.string().trim().max(40).optional(),
});

/**
 * Ingreso de mercadería.
 *
 * Faltaba por completo: el stock solo podía bajar (al cargar repuestos en una
 * orden) y la única forma de que subiera era el stock inicial al dar de alta
 * el producto. Sin esto el inventario se vacía en dos semanas y no hay manera
 * de reponerlo.
 *
 * El costo se guarda en el movimiento y no en el producto: es el que se usa
 * para el margen de las órdenes que consuman esta partida, y tiene que quedar
 * congelado aunque el precio cambie mañana.
 */
export async function ingresarStock(datos: {
  productoId: string;
  cantidad: number;
  costoUnitario: number;
  comprobante?: string;
}): Promise<ResultadoMovimiento> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };
  if (sesion.perfil.rol === "mecanico") return { error: "No tenés permiso para mover stock" };

  const parseado = ingresoSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.from("movimiento_stock").insert({
      taller_id: sesion.perfil.taller_id,
      producto_id: parseado.data.productoId,
      tipo: "compra",
      cantidad: parseado.data.cantidad,
      costo_unitario: parseado.data.costoUnitario,
      motivo: parseado.data.comprobante?.trim()
        ? `Compra ${parseado.data.comprobante.trim()}`
        : "Ingreso de mercadería",
    });

    if (error) {
      console.error("[ingresarStock]", error.code);
      return { error: "No se pudo registrar el ingreso" };
    }

    const { data: prod } = await supabase
      .from("producto")
      .select("stock")
      .eq("id", parseado.data.productoId)
      .single();

    revalidatePath("/stock");
    revalidatePath("/tablero");
    return { stockNuevo: Number(prod?.stock ?? 0) };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

const ajusteSchema = z.object({
  productoId: z.string().uuid(),
  stockReal: z.coerce.number().min(0).max(100000),
  motivo: z.string().trim().max(80).optional(),
});

/**
 * Ajuste por conteo físico.
 *
 * Se pide el stock REAL contado, no la diferencia: en el depósito uno cuenta
 * lo que hay, no calcula cuánto falta. La diferencia la saca el sistema.
 *
 * Queda registrado como un movimiento más, con su motivo, así el faltante
 * aparece en el historial en lugar de que el número cambie sin explicación.
 */
export async function ajustarStock(datos: {
  productoId: string;
  stockReal: number;
  motivo?: string;
}): Promise<ResultadoMovimiento> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };
  if (sesion.perfil.rol === "mecanico") return { error: "No tenés permiso para mover stock" };

  const parseado = ajusteSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  try {
    const supabase = await crearClienteServidor();

    const { data: prod } = await supabase
      .from("producto")
      .select("stock")
      .eq("id", parseado.data.productoId)
      .maybeSingle();

    if (!prod) return { error: "El producto no existe" };

    const diferencia = parseado.data.stockReal - Number(prod.stock);
    if (diferencia === 0) return { stockNuevo: Number(prod.stock) };

    const { error } = await supabase.from("movimiento_stock").insert({
      taller_id: sesion.perfil.taller_id,
      producto_id: parseado.data.productoId,
      tipo: "ajuste",
      cantidad: diferencia,
      costo_unitario: 0,
      motivo:
        parseado.data.motivo?.trim() ||
        (diferencia > 0 ? "Ajuste por conteo (sobrante)" : "Ajuste por conteo (faltante)"),
    });

    if (error) {
      console.error("[ajustarStock]", error.code);
      return { error: "No se pudo registrar el ajuste" };
    }

    revalidatePath("/stock");
    return { stockNuevo: parseado.data.stockReal };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

export interface MovimientoHistorial {
  id: string;
  tipo: string;
  cantidad: number;
  motivo: string | null;
  creado_en: string;
}

/** Últimos movimientos de un producto, para explicar por qué el stock es el
 *  que es. Un número suelto sin historial no se puede auditar. */
export async function historialProducto(productoId: string): Promise<MovimientoHistorial[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("movimiento_stock")
    .select("id, tipo, cantidad, motivo, creado_en")
    .eq("producto_id", productoId)
    .order("creado_en", { ascending: false })
    .limit(20);

  return (data ?? []).map((m) => ({ ...m, cantidad: Number(m.cantidad) }));
}
