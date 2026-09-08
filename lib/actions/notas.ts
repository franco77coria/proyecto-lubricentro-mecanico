"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export type TipoNota = "anomalia" | "descargo" | "recomendado";

export interface ResultadoNota {
  error?: string;
  ok?: boolean;
}

const notaSchema = z.object({
  otId: z.string().uuid(),
  tipo: z.enum(["anomalia", "descargo", "recomendado"]),
  texto: z.string().trim().min(3, { message: "Escribí un poco más de detalle" }).max(400),
  precioEstimado: z.number().min(0).max(100000000).optional(),
});

/**
 * Agrega una nota a la orden.
 *
 * Los tres tipos son deliberadamente distintos y no un campo de texto libre:
 *   anomalia   — lo que dijo el cliente, en sus palabras
 *   descargo   — lo que encontró el taller
 *   recomendado— lo detectado que el cliente NO autorizó, con su precio
 *
 * Mezclarlos haría imposible saber después quién dijo qué, que es justamente
 * lo que se necesita cuando hay una discusión.
 */
export async function agregarNota(datos: {
  otId: string;
  tipo: TipoNota;
  texto: string;
  precioEstimado?: number;
}): Promise<ResultadoNota> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  const parseado = notaSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  try {
    const supabase = await crearClienteServidor();

    const { data: ultima } = await supabase
      .from("ot_nota")
      .select("orden")
      .eq("ot_id", parseado.data.otId)
      .eq("tipo", parseado.data.tipo)
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("ot_nota").insert({
      taller_id: sesion.perfil.taller_id,
      ot_id: parseado.data.otId,
      tipo: parseado.data.tipo,
      texto: parseado.data.texto,
      // El precio solo tiene sentido en lo recomendado: es un presupuesto.
      precio_estimado:
        parseado.data.tipo === "recomendado" && parseado.data.precioEstimado
          ? parseado.data.precioEstimado
          : null,
      orden: (ultima?.orden ?? -1) + 1,
    });

    if (error) {
      console.error("[agregarNota]", error.code);
      return { error: "No se pudo guardar" };
    }

    revalidatePath(`/ot/${parseado.data.otId}`);
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

export async function quitarNota(notaId: string, otId: string): Promise<ResultadoNota> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  try {
    const supabase = await crearClienteServidor();
    const { data: borrados, error } = await supabase
      .from("ot_nota")
      .delete()
      .eq("id", notaId)
      .eq("ot_id", otId)
      .eq("taller_id", sesion.perfil.taller_id)
      .select("id");

    if (error || !borrados || borrados.length === 0) {
      return { error: "No se pudo borrar o la nota no pertenece a esta orden" };
    }

    revalidatePath(`/ot/${otId}`);
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

/**
 * Decide si una nota se publica en el portal del cliente.
 *
 * `visible_cliente` existía en la base desde 0030 y el portal ya la filtraba,
 * pero no había forma de tocarla: como el default es `true`, TODO lo que
 * escribía el taller salía publicado y no había manera de dejar una nota
 * interna. El default se mantiene —el portal vacío no le sirve a nadie y la
 * transparencia es el punto de la feature— pero ahora se puede apagar por nota.
 */
export async function cambiarVisibilidadNota(
  notaId: string,
  otId: string,
  visible: boolean,
): Promise<ResultadoNota> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("ot_nota")
      .update({ visible_cliente: visible })
      .eq("id", notaId)
      // RLS ya acota al taller, pero el filtro explícito evita depender de eso
      // para una escritura: un UPDATE que no matchea devuelve éxito silencioso.
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[cambiarVisibilidadNota]", error.code);
      return { error: "No se pudo cambiar la visibilidad" };
    }

    revalidatePath(`/ot/${otId}`);
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}
