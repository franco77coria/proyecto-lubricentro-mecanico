"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface ResultadoEquipo {
  error?: string;
  ok?: boolean;
  token?: string;
}

const invitacionSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Revisá el email" }),
  rol: z.enum(["dueno", "mostrador", "mecanico"]),
});

/** Una semana: suficiente para que el empleado la use, y corto para que un
 *  link olvidado en un chat no siga sirviendo dentro de seis meses. */
const DIAS_VIGENCIA = 7;

/**
 * Invita a alguien al taller.
 *
 * El token se genera con `randomBytes` y no con `Math.random()`: es la
 * credencial que le da acceso a los datos del taller a quien la tenga, y un
 * generador predecible la haría adivinable.
 */
export async function invitarAlTaller(datos: unknown): Promise<ResultadoEquipo> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };
  if (sesion.perfil.rol !== "dueno") return { error: "Solo el dueño puede invitar" };

  const parseado = invitacionSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  try {
    const supabase = await crearClienteServidor();
    const token = randomBytes(24).toString("base64url");
    const expira = new Date(Date.now() + DIAS_VIGENCIA * 24 * 3600 * 1000);

    const { error } = await supabase.from("invitacion").insert({
      taller_id: sesion.perfil.taller_id,
      email: parseado.data.email,
      rol: parseado.data.rol,
      token,
      expira_en: expira.toISOString(),
    });

    if (error) {
      console.error("[invitarAlTaller]", error.code);
      return { error: "No se pudo crear la invitación" };
    }

    revalidatePath("/config");
    return { ok: true, token };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

export async function cancelarInvitacion(id: string): Promise<ResultadoEquipo> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil || sesion.perfil.rol !== "dueno") return { error: "Sin permiso" };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.from("invitacion").delete().eq("id", id);
    if (error) return { error: "No se pudo cancelar" };

    revalidatePath("/config");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

/**
 * Cambia el rol de un miembro o lo desactiva.
 *
 * Un taller no puede quedarse sin dueño: si fuera posible, nadie podría volver
 * a tocar la configuración ni ver los reportes, y haría falta intervención
 * manual en la base para recuperarlo.
 */
export async function cambiarRolMiembro(
  userId: string,
  rol: "dueno" | "mostrador" | "mecanico",
  activo = true,
): Promise<ResultadoEquipo> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };
  if (sesion.perfil.rol !== "dueno") return { error: "Solo el dueño puede cambiar roles" };

  try {
    const supabase = await crearClienteServidor();

    const dejaDeSerDueno = userId === sesion.user.id && (rol !== "dueno" || !activo);
    if (dejaDeSerDueno) {
      const { count } = await supabase
        .from("perfil")
        .select("user_id", { count: "exact", head: true })
        .eq("taller_id", sesion.perfil.taller_id)
        .eq("rol", "dueno")
        .eq("activo", true);

      if ((count ?? 0) <= 1) {
        return { error: "Sos el único dueño: nombrá otro antes de cambiar tu rol" };
      }
    }

    const { error } = await supabase.from("perfil").update({ rol, activo }).eq("user_id", userId);
    if (error) {
      console.error("[cambiarRolMiembro]", error.code);
      return { error: "No se pudo actualizar" };
    }

    revalidatePath("/config");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}
