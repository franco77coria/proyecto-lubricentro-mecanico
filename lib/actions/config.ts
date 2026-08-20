"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { normalizarTelefono } from "@/lib/telefono";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface ResultadoConfig {
  error?: string;
  ok?: boolean;
}

const tallerSchema = z.object({
  nombre: z.string().trim().min(2, { message: "El nombre es obligatorio" }).max(80),
  cuit: z.string().trim().max(15).optional(),
  direccion: z.string().trim().max(120).optional(),
  telefono: z.string().trim().max(30).optional(),
});

/**
 * Datos del taller.
 *
 * No es solo decoración: son los que salen en el encabezado del PDF que se le
 * entrega al cliente, así que un taller sin dirección ni teléfono entrega un
 * comprobante sin forma de contactarlo.
 */
export async function actualizarTaller(
  _previo: ResultadoConfig,
  formData: FormData,
): Promise<ResultadoConfig> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };
  if (sesion.perfil.rol !== "dueno") return { error: "Solo el dueño puede cambiar estos datos" };

  const parseado = tallerSchema.safeParse({
    nombre: formData.get("nombre"),
    cuit: formData.get("cuit"),
    direccion: formData.get("direccion"),
    telefono: formData.get("telefono"),
  });
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("taller")
      .update({
        nombre: parseado.data.nombre,
        cuit: parseado.data.cuit || null,
        direccion: parseado.data.direccion || null,
        // Se guarda en E.164 para que el link de WhatsApp arme bien.
        telefono: parseado.data.telefono ? normalizarTelefono(parseado.data.telefono, false) : null,
      })
      .eq("id", sesion.perfil.taller_id);

    if (error) {
      console.error("[actualizarTaller]", error.code);
      return { error: "No se pudieron guardar los datos" };
    }

    revalidatePath("/config");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

const idiomaMonedaSchema = z.object({
  idioma: z.enum(["es", "en", "pt"]).optional(),
  moneda: z.enum(["ARS", "USD", "BRL", "MXN", "EUR", "CLP", "COP"]).optional(),
});

/**
 * Idioma y moneda del taller.
 *
 * Antes esto solo se guardaba en localStorage, así que era una preferencia de
 * dispositivo: el mismo taller se veía en un idioma en la compu del mostrador
 * y en otro en el celular de la fosa. Y las cotizaciones salían en la moneda
 * del aparato que las armó, que en un taller de Brasil eran pesos argentinos.
 *
 * Lo cambia el dueño: es un ajuste del negocio, no una preferencia personal.
 * La pantalla lo mostraba editable para todos.
 */
export async function guardarIdiomaMoneda(datos: unknown): Promise<ResultadoConfig> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };
  if (sesion.perfil.rol !== "dueno") {
    return { error: "El idioma y la moneda los define el dueño del taller" };
  }

  const parseado = idiomaMonedaSchema.safeParse(datos);
  if (!parseado.success) return { error: "Idioma o moneda no reconocidos" };

  const cambios: { idioma?: string; moneda?: string } = {};
  if (parseado.data.idioma) cambios.idioma = parseado.data.idioma;
  if (parseado.data.moneda) cambios.moneda = parseado.data.moneda;
  if (Object.keys(cambios).length === 0) return { ok: true };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("taller")
      .update(cambios)
      .eq("id", sesion.perfil.taller_id);

    if (error) {
      console.error("[guardarIdiomaMoneda]", error.code);
      return { error: "No se pudo guardar la configuración regional" };
    }

    // Toca todas las pantallas: los precios y las fechas se formatean con esto.
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

/**
 * Agrega un ítem al checklist.
 *
 * El orden se calcula al final para que el ítem nuevo no se meta en el medio
 * de una lista que el taller ya tiene ordenada como la usa.
 */
export async function agregarItemChecklist(
  plantillaId: string,
  etiqueta: string,
  categoria?: string,
): Promise<ResultadoConfig> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  const limpia = etiqueta.trim();
  if (limpia.length < 2) return { error: "El nombre del ítem es muy corto" };
  if (limpia.length > 60) return { error: "El nombre del ítem es muy largo" };

  try {
    const supabase = await crearClienteServidor();

    const { data: ultimo } = await supabase
      .from("checklist_plantilla_item")
      .select("orden")
      .eq("plantilla_id", plantillaId)
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("checklist_plantilla_item").insert({
      taller_id: sesion.perfil.taller_id,
      plantilla_id: plantillaId,
      etiqueta: limpia,
      categoria: categoria?.trim() || null,
      orden: (ultimo?.orden ?? 0) + 1,
    });

    if (error) {
      console.error("[agregarItemChecklist]", error.code);
      return { error: "No se pudo agregar el ítem" };
    }

    revalidatePath("/config");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

/**
 * Saca un ítem del checklist.
 *
 * Se desactiva en lugar de borrarse: las órdenes viejas guardan la etiqueta
 * como snapshot, pero mantener la fila deja el historial coherente y permite
 * volver a activarlo sin perder nada.
 */
export async function quitarItemChecklist(itemId: string): Promise<ResultadoConfig> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("checklist_plantilla_item")
      .update({ activo: false })
      .eq("id", itemId);

    if (error) return { error: "No se pudo quitar el ítem" };

    revalidatePath("/config");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}
