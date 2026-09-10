"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";
import {
  crearSuscripcionPreapproval,
  cancelarPreapproval,
  obtenerPrecioPlanMensual,
} from "@/lib/mercadopago/cliente";
import { calcularEstadoSuscripcion, type EstadoSuscripcionCalculado } from "@/lib/suscripcion";

export interface ResultadoIniciarSuscripcion {
  ok?: boolean;
  initPoint?: string;
  error?: string;
}

export interface ResultadoEstadoSuscripcion {
  estadoCalculado: EstadoSuscripcionCalculado;
  precioARS: number;
  esDueno: boolean;
  nombreTaller: string;
  suscripcionFin?: string | null;
  error?: string;
}

/**
 * Inicia el proceso de suscripción mensual con Mercado Pago.
 *
 * Exclusivo para el dueño del taller. Genera el enlace de Preapproval
 * y lo devuelve al cliente para redirigir al checkout seguro de Mercado Pago.
 */
export async function iniciarSuscripcionAction(): Promise<ResultadoIniciarSuscripcion> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida. Volvé a ingresar." };
  if (sesion.perfil.rol !== "dueno") {
    return { error: "Solo el dueño del taller puede gestionar o activar la suscripción." };
  }

  try {
    const supabase = await crearClienteServidor();
    const tallerId = sesion.perfil.taller_id;

    const { data: taller } = await supabase
      .from("taller")
      .select("id, nombre")
      .eq("id", tallerId)
      .single();

    if (!taller) return { error: "No se encontró la información del taller." };

    const emailDueno = sesion.user.email || "taller@ejemplo.com";
    const monto = obtenerPrecioPlanMensual();

    // Crear la preferencia de suscripción recurrente en Mercado Pago
    const resultado = await crearSuscripcionPreapproval({
      tallerId,
      emailDueno,
      nombreTaller: taller.nombre,
      montoARS: monto,
    });

    // Guardar el ID de preapproval en el taller como referencia pendiente
    await supabase
      .from("taller")
      .update({
        mp_preapproval_id: resultado.id,
        mp_subscription_status: resultado.status || "pending",
      })
      .eq("id", tallerId);

    return {
      ok: true,
      initPoint: resultado.init_point,
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[iniciarSuscripcionAction]", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo conectar con Mercado Pago. Verificá las credenciales del servidor.",
    };
  }
}

/**
 * Obtiene el estado detallado de la suscripción y días de prueba para la interfaz de usuario.
 */
export async function obtenerEstadoSuscripcionAction(): Promise<ResultadoEstadoSuscripcion | null> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return null;

  try {
    const supabase = await crearClienteServidor();
    const { data: taller } = await supabase
      .from("taller")
      .select("nombre, estado_suscripcion, trial_fin, suscripcion_fin, mp_subscription_status")
      .eq("id", sesion.perfil.taller_id)
      .single();

    if (!taller) return null;

    const estadoCalculado = calcularEstadoSuscripcion(taller);
    const precioARS = obtenerPrecioPlanMensual();
    const esDueno = sesion.perfil.rol === "dueno";

    return {
      estadoCalculado,
      precioARS,
      esDueno,
      nombreTaller: taller.nombre,
      suscripcionFin: taller.suscripcion_fin,
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[obtenerEstadoSuscripcionAction]", error);
    return null;
  }
}

/**
 * Cancela la suscripción activa en Mercado Pago.
 */
export async function cancelarSuscripcionAction(): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };
  if (sesion.perfil.rol !== "dueno") {
    return { error: "Solo el dueño puede cancelar la suscripción." };
  }

  try {
    const supabase = await crearClienteServidor();
    const tallerId = sesion.perfil.taller_id;

    const { data: taller } = await supabase
      .from("taller")
      .select("mp_preapproval_id")
      .eq("id", tallerId)
      .single();

    if (taller?.mp_preapproval_id) {
      await cancelarPreapproval(taller.mp_preapproval_id);
    }

    await supabase
      .from("taller")
      .update({
        estado_suscripcion: "cancelada",
        mp_subscription_status: "cancelled",
      })
      .eq("id", tallerId);

    revalidatePath("/suscripcion");
    revalidatePath("/config");
    revalidatePath("/", "layout");

    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[cancelarSuscripcionAction]", error);
    return { error: "No se pudo cancelar la suscripción." };
  }
}
