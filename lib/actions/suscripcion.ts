"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import {
  crearSuscripcionPreapproval,
  cancelarPreapproval,
  obtenerDetallePreapproval,
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

/**
 * Sincroniza el estado de la suscripción al volver del checkout de Mercado Pago.
 *
 * Se ejecuta al cargar `/suscripcion?status=success` o con `preapproval_id`,
 * garantizando la activación inmediata tanto en producción como en entornos locales/demo.
 */
export async function sincronizarSuscripcionRetornoAction(
  preapprovalIdParam?: string
): Promise<{ ok: boolean; activada?: boolean }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { ok: false };

  try {
    const tallerId = sesion.perfil.taller_id;
    const admin = crearClienteAdmin();

    const { data: taller } = await admin
      .from("taller")
      .select("mp_preapproval_id, estado_suscripcion")
      .eq("id", tallerId)
      .single();

    const preapprovalId = preapprovalIdParam || taller?.mp_preapproval_id;
    if (!preapprovalId) return { ok: true, activada: false };

    const detalle = await obtenerDetallePreapproval(preapprovalId);
    if (!detalle) return { ok: true, activada: false };

    if (detalle.status === "authorized") {
      const fechaFin = detalle.next_payment_date
        ? new Date(detalle.next_payment_date).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await admin
        .from("taller")
        .update({
          estado_suscripcion: "activa",
          suscripcion_fin: fechaFin,
          mp_preapproval_id: detalle.id,
          mp_subscription_status: detalle.status,
          mp_payer_id: detalle.payer_id ? String(detalle.payer_id) : null,
        })
        .eq("id", tallerId);

      await admin.from("taller_suscripcion_evento").insert({
        taller_id: tallerId,
        tipo: "retorno_checkout_sincronizado",
        mp_id: detalle.id,
        estado: detalle.status,
        monto: detalle.auto_recurring?.transaction_amount || null,
        payload: JSON.parse(JSON.stringify(detalle)),
      });

      revalidatePath("/suscripcion");
      revalidatePath("/", "layout");
      return { ok: true, activada: true };
    }

    return { ok: true, activada: false };
  } catch (error) {
    console.error("[sincronizarSuscripcionRetornoAction]", error);
    return { ok: false };
  }
}
