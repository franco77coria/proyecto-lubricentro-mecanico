"use server";

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

const pulsoSchema = z.object({
  ruta: z.string().max(200),
  segundosActivos: z.number().int().min(1).max(300),
});

export async function registrarPulsoActividad(datos: { ruta: string; segundosActivos: number }): Promise<{ ok: boolean }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { ok: false };

  const parseado = pulsoSchema.safeParse(datos);
  if (!parseado.success) return { ok: false };

  const { ruta, segundosActivos } = parseado.data;
  const tallerId = sesion.perfil.taller_id;
  const userId = sesion.user.id;
  const hoyStr = new Date().toISOString().slice(0, 10);

  try {
    const supabase = await crearClienteServidor();
    const onlineHasta = new Date(Date.now() + 120 * 1000).toISOString();

    // 1. Obtener fila de hoy
    const { data: actual } = await supabase
      .from("registro_actividad_usuario")
      .select("id, segundos_activos, pantallas_visitadas")
      .eq("taller_id", tallerId)
      .eq("user_id", userId)
      .eq("fecha", hoyStr)
      .maybeSingle();

    if (actual) {
      const pantallas = new Set(actual.pantallas_visitadas || []);
      pantallas.add(ruta);

      await supabase
        .from("registro_actividad_usuario")
        .update({
          segundos_activos: actual.segundos_activos + segundosActivos,
          ultima_actividad: new Date().toISOString(),
          online_hasta: onlineHasta,
          pantallas_visitadas: Array.from(pantallas),
          actualizado_en: new Date().toISOString(),
        })
        .eq("id", actual.id);
    } else {
      await supabase.from("registro_actividad_usuario").insert({
        taller_id: tallerId,
        user_id: userId,
        fecha: hoyStr,
        segundos_activos: segundosActivos,
        ultima_actividad: new Date().toISOString(),
        online_hasta: onlineHasta,
        pantallas_visitadas: [ruta],
      });
    }

    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false };
  }
}
