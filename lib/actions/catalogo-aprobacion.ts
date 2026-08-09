"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export type NivelCatalogo = "marca" | "modelo" | "motorizacion";

export interface PendienteCatalogo {
  nivel: NivelCatalogo;
  id: string;
  nombre: string;
  /** La marca, o "marca modelo", según el nivel. */
  contexto: string | null;
  creadoEn: string;
}

/**
 * Lo que este taller cargó con OTROS y todavía nadie revisó.
 *
 * Solo lo propio: el catálogo es global y aprobar lo que propuso otro taller
 * sería decidir por él (ver 0029).
 */
export async function listarPendientesCatalogo(): Promise<PendienteCatalogo[]> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return [];

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.rpc("catalogo_pendiente");
    if (error) {
      console.error("[listarPendientesCatalogo]", error.code);
      return [];
    }
    return (data ?? []).map((p) => ({
      nivel: p.nivel as NivelCatalogo,
      id: p.id,
      nombre: p.nombre,
      contexto: p.contexto,
      creadoEn: p.creado_en,
    }));
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

export async function resolverPendiente(
  nivel: NivelCatalogo,
  id: string,
  estado: "aprobado" | "rechazado",
  fusionarEn?: string,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };
  if (sesion.perfil.rol !== "dueno") return { error: "Solo el dueño aprueba el catálogo." };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.rpc("resolver_catalogo", {
      p_nivel: nivel,
      p_id: id,
      p_estado: estado,
      p_fusionar_en: fusionarEn ?? undefined,
    });

    if (error) {
      console.error("[resolverPendiente]", error.code, error.message);
      // La función levanta `no_data_found` cuando el ítem no es de este taller
      // o ya estaba resuelto: mejor decirlo que mostrar un error genérico.
      if (error.message?.includes("no está pendiente")) {
        return { error: "Ese ítem ya fue resuelto o no lo cargó este taller." };
      }
      return { error: "No se pudo resolver el ítem." };
    }

    revalidatePath("/config");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar." };
  }
}
