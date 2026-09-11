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

    // 1. Obtener código estandarizado OT-AAAAMMDD-TXX-0000
    const { data: numeroGenerado } = await supabase.rpc("siguiente_numero_documento", {
      p_taller: tallerId,
      p_prefijo: "OT",
    });

    // 2. Insertar la OT
    const { data: ot, error } = await supabase
      .from("orden_trabajo")
      .insert({
        taller_id: tallerId,
        numero: numeroGenerado || "",
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
        .eq("taller_id", tallerId)
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

    // Verificar que la orden de trabajo pertenezca al taller
    const { data: otExiste } = await supabase
      .from("orden_trabajo")
      .select("id")
      .eq("id", otId)
      .eq("taller_id", sesion.perfil.taller_id)
      .maybeSingle();

    if (!otExiste) return { error: "Orden de trabajo no encontrada en este taller." };

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

export async function actualizarItemOT(
  otId: string,
  itemId: string,
  item: DatosItemOT,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  const parseado = itemOTSchema.safeParse(item);
  if (!parseado.success) return { error: parseado.error.issues[0].message };
  const d = parseado.data;

  try {
    const supabase = await crearClienteServidor();

    // El costo es un snapshot: se congela cuando el ítem se registra y el
    // trigger `ot_item_costo_bu` lo protege. Recalcularlo en cada edición
    // hacía que guardar un ítem cuyo producto cambió de precio fallara con
    // "No se pudo actualizar el ítem" y sin explicación.
    //
    // El único caso en que el costo SÍ tiene que moverse es cuando cambió el
    // repuesto: el renglón pasó a ser otra cosa. Para saberlo hay que mirar
    // qué producto tenía antes.
    const { data: previo } = await supabase
      .from("ot_item")
      .select("producto_id")
      .eq("id", itemId)
      .eq("taller_id", sesion.perfil.taller_id)
      .maybeSingle();

    if (!previo) return { error: "No se encontró el ítem." };

    const nuevoProductoId = d.productoId || null;
    const cambioElProducto = previo.producto_id !== nuevoProductoId;

    // El tipo se declara entero con el costo opcional en vez de armarlo con un
    // spread condicional: con un spread, TypeScript infiere un union y deja de
    // validar la fila contra la tabla.
    const campos: {
      tipo: typeof d.tipo;
      descripcion: string;
      cantidad: number;
      precio_unitario: number;
      producto_id: string | null;
      costo_unitario?: number;
    } = {
      tipo: d.tipo,
      descripcion: d.descripcion.trim(),
      cantidad: d.cantidad,
      precio_unitario: d.precioUnitario,
      producto_id: nuevoProductoId,
    };

    if (cambioElProducto) {
      let costoUnitario = 0;
      if (nuevoProductoId) {
        const { data: costo } = await supabase.rpc("costo_actual_producto", {
          p_producto: nuevoProductoId,
        });
        costoUnitario = Number(costo ?? 0);
      }
      campos.costo_unitario = costoUnitario;
    }

    const { data: actualizado, error } = await supabase
      .from("ot_item")
      .update(campos)
      .eq("id", itemId)
      .eq("taller_id", sesion.perfil.taller_id)
      .select("id");

    if (error) {
      if (error.message?.includes("stock") || error.code === "P0001") {
        return { error: "Stock insuficiente para ajustar la cantidad solicitada." };
      }
      return { error: "No se pudo actualizar el ítem." };
    }

    if (!actualizado || actualizado.length === 0) {
      return { error: "No se encontró el ítem en este taller." };
    }

    revalidatePath(`/ot/${otId}`);
    revalidatePath(`/presupuestos/${otId}`);
    if (d.productoId) revalidatePath("/stock");
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "Error de servidor al actualizar el ítem." };
  }
}

export async function eliminarItemOT(otId: string, itemId: string): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  try {
    const supabase = await crearClienteServidor();

    const { data: eliminados, error } = await supabase
      .from("ot_item")
      .delete()
      .eq("id", itemId)
      .eq("ot_id", otId)
      .eq("taller_id", sesion.perfil.taller_id)
      .select("id");

    if (error) {
      console.error("[eliminarItemOT]", error.code);
      return { error: "No se pudo eliminar el ítem." };
    }

    if (!eliminados || eliminados.length === 0) {
      return { error: "No se encontró el ítem en esta orden." };
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

/**
 * Siembra el checklist estándar de la OT si todavía no tiene ningún ítem.
 * Se llama desde el cliente cuando la página de OT detecta 0 ítems en el
 * checklist: así el taller ve los 11 puntos desde la primera apertura sin
 * necesidad de configurar nada.
 */
export async function asegurarChecklistOT(otId: string): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  const tallerId = sesion.perfil.taller_id;

  try {
    const supabase = await crearClienteServidor();

    // Verificar si ya tiene ítems
    const { count } = await supabase
      .from("ot_checklist")
      .select("id", { count: "exact", head: true })
      .eq("ot_id", otId)
      .eq("taller_id", tallerId);

    if ((count ?? 0) > 0) return { ok: true }; // Ya tiene, nada que hacer

    // Traer plantilla activa del taller
    const { data: plantilla } = await supabase
      .from("checklist_plantilla")
      .select("id")
      .eq("taller_id", tallerId)
      .eq("activa", true)
      .maybeSingle();

    if (!plantilla) {
      // Si no hay plantilla, crear items genéricos directamente
      const ITEMS_DEFECTO = [
        { etiqueta: "Aceite de motor", orden: 1 },
        { etiqueta: "Filtro de aceite", orden: 2 },
        { etiqueta: "Filtro de aire", orden: 3 },
        { etiqueta: "Filtro habitáculo", orden: 4 },
        { etiqueta: "Filtro de nafta / combustible", orden: 5 },
        { etiqueta: "Grados de refrigerante / Grados de frío", orden: 6 },
        { etiqueta: "Líquido de frenos / Freno hidráulico", orden: 7 },
        { etiqueta: "Dirección hidráulica", orden: 8 },
        { etiqueta: "Tren delantero y suspensión", orden: 9 },
        { etiqueta: "Tren trasero", orden: 10 },
        { etiqueta: "Neumáticos y presión", orden: 11 },
        { etiqueta: "Luces y batería", orden: 12 },
        { etiqueta: "Otros", orden: 13 },
      ];

      await supabase.from("ot_checklist").insert(
        ITEMS_DEFECTO.map((item) => ({
          taller_id: tallerId,
          ot_id: otId,
          etiqueta_snapshot: item.etiqueta,
          orden: item.orden,
        })),
      );

      revalidatePath(`/ot/${otId}`);
      return { ok: true };
    }

    // Hay plantilla — traer sus ítems
    const { data: itemsPlantilla } = await supabase
      .from("checklist_plantilla_item")
      .select("id, etiqueta, orden")
      .eq("plantilla_id", plantilla.id)
      .eq("taller_id", tallerId)
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (!itemsPlantilla || itemsPlantilla.length === 0) return { ok: true };

    await supabase.from("ot_checklist").insert(
      itemsPlantilla.map((item) => ({
        taller_id: tallerId,
        ot_id: otId,
        item_id: item.id,
        etiqueta_snapshot: item.etiqueta,
        orden: item.orden,
      })),
    );

    revalidatePath(`/ot/${otId}`);
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo inicializar el checklist." };
  }
}

export async function agregarItemChecklistOT(
  otId: string,
  etiqueta: string,
): Promise<{ ok?: boolean; error?: string; item?: { id: string; etiqueta_snapshot: string; estado: "ok" | "observado" | "critico" | "no_aplica" | null; nota?: string | null } }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  const texto = etiqueta.trim();
  if (!texto) return { error: "El nombre del ítem es requerido." };

  try {
    const supabase = await crearClienteServidor();
    const tallerId = sesion.perfil.taller_id;

    const { data: ultimos } = await supabase
      .from("ot_checklist")
      .select("orden")
      .eq("ot_id", otId)
      .eq("taller_id", tallerId)
      .order("orden", { ascending: false })
      .limit(1);

    const proximoOrden = ((ultimos?.[0]?.orden as number) ?? 0) + 1;

    const { data: nuevo, error } = await supabase
      .from("ot_checklist")
      .insert({
        taller_id: tallerId,
        ot_id: otId,
        etiqueta_snapshot: texto,
        orden: proximoOrden,
        estado: null,
      })
      .select("id, etiqueta_snapshot, estado, nota")
      .single();

    if (error || !nuevo) {
      console.error("[agregarItemChecklistOT]", error);
      return { error: "No se pudo agregar el ítem al checklist." };
    }

    revalidatePath(`/ot/${otId}`);
    return {
      ok: true,
      item: {
        id: nuevo.id,
        etiqueta_snapshot: nuevo.etiqueta_snapshot,
        estado: nuevo.estado as "ok" | "observado" | "critico" | "no_aplica" | null,
        nota: nuevo.nota,
      },
    };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "Error de servidor al agregar ítem." };
  }
}

export async function eliminarItemChecklistOT(
  otChecklistId: string,
  otId: string,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("ot_checklist")
      .delete()
      .eq("id", otChecklistId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[eliminarItemChecklistOT]", error);
      return { error: "No se pudo eliminar el ítem del checklist." };
    }

    revalidatePath(`/ot/${otId}`);
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "Error de servidor al eliminar ítem." };
  }
}
