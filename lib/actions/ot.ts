"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import {
  DatosCrearOT,
  DatosItemOT,
  EstadoOT,
  crearOTSchema,
  itemOTSchema,
} from "@/lib/schemas/ot";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export async function crearOrdenTrabajo(datos: DatosCrearOT): Promise<{ otId?: string; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida. Volvé a ingresar." };

  const parseado = crearOTSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  const { vehiculoId, clienteId, tipo, kmIngreso, observaciones, anomalias, cedulaPayload } =
    parseado.data;
  const tallerId = sesion.perfil.taller_id;

  try {
    const supabase = await crearClienteServidor();

    // 1. Insertar la OT (el trigger asignar_numero_ot reescribirá el número si se pasa '')
    const { data: ot, error } = await supabase
      .from("orden_trabajo")
      .insert({
        taller_id: tallerId,
        numero: "",
        vehiculo_id: vehiculoId,
        cliente_id: clienteId || null,
        tipo,
        km_ingreso: kmIngreso,
        observaciones: observaciones || null,
        creado_por: sesion.user.id,
        estado: "presupuesto",
      })
      .select("id, numero")
      .single();

    if (error || !ot) {
      console.error("[crearOrdenTrabajo]", error?.code, error?.message);
      return { error: "No se pudo crear la Orden de Trabajo." };
    }

    // 2. Insertar anomalías si fueron especificadas
    if (anomalias && anomalias.length > 0) {
      const notas = anomalias.map((texto, i) => ({
        taller_id: tallerId,
        ot_id: ot.id,
        tipo: "anomalia" as const,
        texto,
        orden: i + 1,
        creado_por: sesion.user.id,
      }));
      await supabase.from("ot_nota").insert(notas);
    }

    // 3. Recepción. La tabla existía desde 0006 y nunca se escribía, así que el
    //    km de ingreso y lo leído de la cédula no quedaban en ningún lado.
    //    Va sin cortar el alta si falla: la OT ya está creada y perder el
    //    trabajo hecho por un dato accesorio sería peor.
    const { error: errorRecepcion } = await supabase.from("ot_recepcion").insert({
      ot_id: ot.id,
      taller_id: tallerId,
      km: kmIngreso || null,
      cedula_payload: cedulaPayload || null,
      recibido_por: sesion.user.id,
    });
    if (errorRecepcion) console.error("[crearOrdenTrabajo/recepcion]", errorRecepcion.code);

    // 4. Traer la plantilla activa del taller para armar el checklist de la OT
    const { data: plantilla } = await supabase
      .from("checklist_plantilla")
      .select("id")
      .eq("taller_id", tallerId)
      .eq("activa", true)
      .maybeSingle();

    if (plantilla) {
      const { data: itemsPlantilla } = await supabase
        .from("checklist_plantilla_item")
        .select("id, etiqueta, orden")
        .eq("plantilla_id", plantilla.id)
        .eq("activo", true)
        .order("orden", { ascending: true });

      if (itemsPlantilla && itemsPlantilla.length > 0) {
        const checklistOt = itemsPlantilla.map((item) => ({
          taller_id: tallerId,
          ot_id: ot.id,
          item_id: item.id,
          etiqueta_snapshot: item.etiqueta,
          orden: item.orden,
        }));
        await supabase.from("ot_checklist").insert(checklistOt);
      }
    }

    revalidatePath("/tablero");
    revalidatePath("/ot");
    return { otId: ot.id };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function cambiarEstadoOT(otId: string, nuevoEstado: EstadoOT): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  const dbEstadoMap: Record<EstadoOT, "presupuesto" | "aprobado" | "recibido" | "en_trabajo" | "esperando_repuesto" | "listo" | "entregado" | "cerrado" | "anulado"> = {
    Presupuesto: "presupuesto",
    Aprobado: "aprobado",
    Recibido: "recibido",
    "En trabajo": "en_trabajo",
    "Esperando repuesto": "esperando_repuesto",
    "Listo para entregar": "listo",
    Entregado: "entregado",
    Cerrado: "cerrado",
    Anulado: "anulado",
  };

  const dbEstado = dbEstadoMap[nuevoEstado];
  if (!dbEstado) return { error: "Estado inválido" };

  try {
    const supabase = await crearClienteServidor();

    const { error } = await supabase
      .from("orden_trabajo")
      .update({
        estado: dbEstado,
        fecha_entrega: dbEstado === "entregado" || dbEstado === "cerrado" ? new Date().toISOString() : null,
      })
      .eq("id", otId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[cambiarEstadoOT]", error.code, error.message);
      return { error: "No se pudo actualizar el estado de la OT." };
    }

    revalidatePath(`/ot/${otId}`);
    revalidatePath("/tablero");
    revalidatePath("/kanban");
    revalidatePath("/seguimiento");
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function actualizarItemChecklist(
  otChecklistId: string,
  estado: "ok" | "observado" | "critico" | "no_aplica" | null,
  nota?: string | null,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  try {
    const supabase = await crearClienteServidor();

    const { error } = await supabase
      .from("ot_checklist")
      .update({
        estado: estado || null,
        nota: nota || null,
        actualizado_por: sesion.user.id,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", otChecklistId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[actualizarItemChecklist]", error.code);
      return { error: "No se pudo actualizar el ítem." };
    }

    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function agregarItemOT(otId: string, item: DatosItemOT): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  const parseado = itemOTSchema.safeParse(item);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  const d = parseado.data;

  try {
    const supabase = await crearClienteServidor();

    // El costo sale del ledger, no del cliente. Es la diferencia entre un
    // reporte de rentabilidad real y uno donde el margen es igual al precio de
    // venta porque el costo llegaba siempre en 0.
    //
    // Va por RPC porque `movimiento_stock.costo_unitario` tiene el SELECT
    // revocado para `authenticated` (0007), y el Server Action corre con ese
    // mismo rol: por la tabla no lo puede leer ni él.
    let costoUnitario = 0;
    if (d.productoId) {
      const { data: costo, error: errorCosto } = await supabase.rpc("costo_actual_producto", {
        p_producto: d.productoId,
      });
      if (errorCosto) {
        // Sin costo el ítem se carga igual: perder la línea del presupuesto por
        // no poder calcular un margen sería peor.
        console.error("[agregarItemOT/costo]", errorCosto.code);
      } else {
        costoUnitario = Number(costo ?? 0);
      }
    }

    const { error } = await supabase.from("ot_item").insert({
      taller_id: sesion.perfil.taller_id,
      ot_id: otId,
      tipo: d.tipo,
      descripcion: d.descripcion,
      producto_id: d.productoId || null,
      cantidad: d.cantidad,
      costo_unitario: costoUnitario,
      precio_unitario: d.precioUnitario,
      creado_por: sesion.user.id,
    });

    if (error) {
      // El trigger del ledger (0005) rechaza dejar el stock en negativo.
      if (error.message?.includes("stock") || error.code === "P0001") {
        return {
          error:
            "No hay stock suficiente de ese producto. Cargá la compra primero o ajustá la cantidad.",
        };
      }
      console.error("[agregarItemOT]", error.code);
      return { error: "No se pudo agregar el ítem." };
    }

    revalidatePath(`/ot/${otId}`);
    // Cargar un repuesto mueve el inventario: si no se revalida, el stock se
    // sigue viendo con el saldo de antes.
    if (d.productoId) revalidatePath("/stock");
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function eliminarItemOT(otId: string, itemId: string): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  try {
    const supabase = await crearClienteServidor();

    const { error } = await supabase
      .from("ot_item")
      .delete()
      .eq("id", itemId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[eliminarItemOT]", error.code);
      return { error: "No se pudo eliminar el ítem." };
    }

    revalidatePath(`/ot/${otId}`);
    // Borrar un repuesto devuelve el stock (cascada de `ot_item_id` en 0014).
    revalidatePath(`/ot/${otId}`);
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function asignarMecanicoOT(
  otId: string,
  mecanicoId: string | null,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("orden_trabajo")
      .update({ asignado_a: mecanicoId || null })
      .eq("id", otId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[asignarMecanicoOT]", error);
      return { error: "No se pudo asignar el mecánico." };
    }

    revalidatePath(`/ot/${otId}`);
    revalidatePath("/tablero");
    revalidatePath("/kanban");
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo conectar con el servidor." };
  }
}
