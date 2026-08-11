"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

// Esquema de validación para el presupuesto completo
const presupuestoSchema = z.object({
  vehiculoId: z.string().uuid(),
  clienteId: z.string().uuid().optional().nullable(),
  observaciones: z.string().optional(),
  anomalias: z.array(z.string()).optional(),
  descargos: z.array(z.string()).optional(),
  items: z.array(
    z.object({
      tipo: z.enum(["mano_obra", "repuesto", "servicio", "insumo", "tercero"]),
      descripcion: z.string().min(1),
      cantidad: z.number().min(0.1),
      precioUnitario: z.number().min(0),
      productoId: z.string().uuid().optional().nullable(),
    })
  ).optional(),
});

export type DatosPresupuesto = z.infer<typeof presupuestoSchema>;

export async function crearPresupuestoCompleto(datos: DatosPresupuesto): Promise<{ otId?: string; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida. Volvé a ingresar." };

  const parseado = presupuestoSchema.safeParse(datos);
  if (!parseado.success) return { error: "Datos inválidos para crear presupuesto." };

  const { vehiculoId, clienteId, observaciones, anomalias, descargos, items } = parseado.data;
  const tallerId = sesion.perfil.taller_id;

  try {
    const supabase = await crearClienteServidor();

    // 1. Insertar OT en estado 'presupuesto'
    const { data: ot, error } = await supabase
      .from("orden_trabajo")
      .insert({
        taller_id: tallerId,
        numero: "",
        vehiculo_id: vehiculoId,
        cliente_id: clienteId || null,
        tipo: "mecanica", // default para presupuestos rápidos
        km_ingreso: null,
        observaciones: observaciones || null,
        creado_por: sesion.user.id,
        estado: "presupuesto",
      })
      .select("id")
      .single();

    if (error || !ot) {
      console.error("[crearPresupuestoCompleto]", error?.message);
      return { error: "No se pudo crear el presupuesto base." };
    }

    // 2. Insertar anomalías (lo que dice el cliente) y descargos (lo que dice el taller)
    const notasAInsertar = [];
    if (anomalias?.length) {
      notasAInsertar.push(
        ...anomalias.map((t, i) => ({
          taller_id: tallerId,
          ot_id: ot.id,
          tipo: "anomalia" as const,
          texto: t,
          orden: i + 1,
          creado_por: sesion.user.id,
        }))
      );
    }
    if (descargos?.length) {
      notasAInsertar.push(
        ...descargos.map((t, i) => ({
          taller_id: tallerId,
          ot_id: ot.id,
          tipo: "descargo" as const,
          texto: t,
          orden: i + 1,
          creado_por: sesion.user.id,
        }))
      );
    }
    if (notasAInsertar.length > 0) {
      await supabase.from("ot_nota").insert(notasAInsertar);
    }

    // 3. Insertar items
    if (items?.length) {
      // Necesitamos resolver los costos para cada producto
      const itemsAInsertar = await Promise.all(items.map(async (item) => {
        let costoUnitario = 0;
        if (item.productoId) {
          const { data: costo } = await supabase.rpc("costo_actual_producto", { p_producto: item.productoId });
          costoUnitario = Number(costo ?? 0);
        }
        return {
          taller_id: tallerId,
          ot_id: ot.id,
          tipo: item.tipo,
          descripcion: item.descripcion,
          producto_id: item.productoId || null,
          cantidad: item.cantidad,
          costo_unitario: costoUnitario,
          precio_unitario: item.precioUnitario,
          creado_por: sesion.user.id,
        };
      }));

      // Inserción en lote, si uno falla (ej. stock), puede fallar todo el batch, lo cual está bien.
      const { error: errorItems } = await supabase.from("ot_item").insert(itemsAInsertar);
      if (errorItems) {
        if (errorItems.message?.includes("stock") || errorItems.code === "P0001") {
          return { error: "Stock insuficiente para alguno de los repuestos seleccionados." };
        }
        console.error("[crearPresupuestoCompleto/items]", errorItems.message);
        return { error: "No se pudieron guardar los ítems del presupuesto." };
      }
    }

    revalidatePath("/tablero");
    revalidatePath("/ot");
    return { otId: ot.id };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "Error de servidor al crear presupuesto." };
  }
}

export async function listarPresupuestos() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return [];

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("orden_trabajo")
    .select(`
      id,
      creado_en,
      vehiculo:vehiculo_id (patente, motorizacion:motorizacion_id(modelo:modelo_id(nombre, marca:marca_id(nombre)))),
      cliente:cliente_id (nombre, telefono),
      items:ot_item(precio_unitario, cantidad)
    `)
    .eq("taller_id", sesion.perfil.taller_id)
    .eq("estado", "presupuesto")
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("[listarPresupuestos]", error);
    return [];
  }
  
  return data || [];
}

export async function obtenerPresupuesto(id: string) {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return null;

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("orden_trabajo")
    .select(`
      *,
      vehiculo:vehiculo_id (patente, motorizacion:motorizacion_id(modelo:modelo_id(nombre, marca:marca_id(nombre)))),
      cliente:cliente_id (nombre, telefono),
      items:ot_item(*),
      checklists:ot_checklist(*),
      anomalias:ot_anomalia(*)
    `)
    .eq("id", id)
    .eq("taller_id", sesion.perfil.taller_id)
    .single();

  if (error) {
    console.error("[obtenerPresupuesto]", error);
    return null;
  }
  
  return data;
}
