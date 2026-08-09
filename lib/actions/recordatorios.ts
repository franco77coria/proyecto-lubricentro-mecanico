"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface RecordatorioAContactar {
  id: string;
  patente: string;
  descripcion: string;
  kmObjetivo: number | null;
  kmActual: number | null;
  fechaObjetivo: string | null;
  /** Por qué está en la lista: se pasó de km o se le viene la fecha. */
  vencePor: "km" | "fecha";
  clienteNombre: string | null;
  telefono: string | null;
}

export async function listarRecordatorios(diasAntes = 15): Promise<RecordatorioAContactar[]> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return [];

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.rpc("recordatorios_a_contactar", {
      p_dias_antes: diasAntes,
    });

    if (error) {
      console.error("[listarRecordatorios]", error.code);
      return [];
    }

    return (data ?? []).map((r) => ({
      id: r.id,
      patente: r.patente,
      descripcion: r.descripcion ?? "Sin modelo",
      kmObjetivo: r.km_objetivo,
      kmActual: r.km_actual,
      fechaObjetivo: r.fecha_objetivo,
      vencePor: r.vence_por === "km" ? "km" : "fecha",
      clienteNombre: r.cliente_nombre,
      telefono: r.telefono,
    }));
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

/**
 * Queda anotado que ya se le escribió.
 *
 * No se marca `cumplido`: eso lo hace el trigger cuando el auto vuelve de
 * verdad (0028). Distinguir "le avisé" de "vino" es lo que después permite
 * saber cuántos avisos se convierten en trabajo.
 */
export async function marcarContactado(recordatorioId: string): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("recordatorio")
      .update({ estado: "contactado", contactado_en: new Date().toISOString() })
      .eq("id", recordatorioId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[marcarContactado]", error.code);
      return { error: "No se pudo marcar el aviso." };
    }
    revalidatePath("/avisos");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar." };
  }
}

export async function descartarRecordatorio(
  recordatorioId: string,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("recordatorio")
      .update({ estado: "descartado" })
      .eq("id", recordatorioId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[descartarRecordatorio]", error.code);
      return { error: "No se pudo descartar el aviso." };
    }
    revalidatePath("/avisos");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar." };
  }
}
