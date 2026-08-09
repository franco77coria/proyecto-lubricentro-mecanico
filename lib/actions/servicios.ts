"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { servicioSchema, type DatosServicio } from "@/lib/schemas/servicio";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface ServicioListado {
  id: string;
  nombre: string;
  precioManoObra: number;
  minutosEstimados: number | null;
}

/**
 * `tiempo_estimado` es un `interval` en Postgres y PostgREST lo devuelve como
 * texto ("01:30:00" o "90 minutes"), no como número. Se normaliza acá para que
 * la UI trabaje con minutos y no con string parsing repartido en cada pantalla.
 */
function aMinutos(intervalo: string | null): number | null {
  if (!intervalo) return null;
  const hms = intervalo.match(/^(\d+):(\d{2}):(\d{2})/);
  if (hms) return Number(hms[1]) * 60 + Number(hms[2]);
  const sueltos = intervalo.match(/(\d+)\s*min/i);
  if (sueltos) return Number(sueltos[1]);
  const horas = intervalo.match(/(\d+)\s*hour/i);
  if (horas) return Number(horas[1]) * 60;
  return null;
}

export async function listarServicios(): Promise<ServicioListado[]> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return [];

  try {
    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("servicio")
      .select("id, nombre, precio_mano_obra, tiempo_estimado")
      .eq("taller_id", sesion.perfil.taller_id)
      .eq("activo", true)
      .order("nombre", { ascending: true });

    return (data ?? []).map((s) => ({
      id: s.id,
      nombre: s.nombre,
      precioManoObra: Number(s.precio_mano_obra ?? 0),
      minutosEstimados: aMinutos(s.tiempo_estimado),
    }));
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

export async function crearServicio(datos: DatosServicio): Promise<{ id?: string; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };
  if (sesion.perfil.rol !== "dueno") return { error: "Solo el dueño edita los precios." };

  const parseado = servicioSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };
  const d = parseado.data;

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
      .from("servicio")
      .insert({
        taller_id: sesion.perfil.taller_id,
        nombre: d.nombre,
        precio_mano_obra: d.precioManoObra,
        tiempo_estimado:
          d.minutosEstimados === "" || !d.minutosEstimados
            ? null
            : `${d.minutosEstimados} minutes`,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[crearServicio]", error.code);
      return { error: "No se pudo guardar el trabajo." };
    }

    revalidatePath("/config");
    return { id: data.id };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar." };
  }
}

export async function actualizarPrecioServicio(
  servicioId: string,
  precioManoObra: number,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };
  if (sesion.perfil.rol !== "dueno") return { error: "Solo el dueño edita los precios." };

  if (!Number.isFinite(precioManoObra) || precioManoObra < 0) {
    return { error: "Precio inválido" };
  }

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("servicio")
      .update({ precio_mano_obra: precioManoObra })
      .eq("id", servicioId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[actualizarPrecioServicio]", error.code);
      return { error: "No se pudo actualizar el precio." };
    }

    revalidatePath("/config");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar." };
  }
}

/**
 * Se archiva, no se borra.
 *
 * Las órdenes viejas guardan la descripción y el precio como texto propio, así
 * que borrar la fila no las rompería — pero sí perdería el historial de qué
 * trabajos ofrece el taller y a qué precio los tuvo.
 */
export async function archivarServicio(servicioId: string): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };
  if (sesion.perfil.rol !== "dueno") return { error: "Solo el dueño edita el catálogo." };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("servicio")
      .update({ activo: false })
      .eq("id", servicioId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[archivarServicio]", error.code);
      return { error: "No se pudo archivar el trabajo." };
    }

    revalidatePath("/config");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar." };
  }
}
