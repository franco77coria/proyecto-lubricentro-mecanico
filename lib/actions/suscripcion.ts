"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import {
  crearSuscripcionPreapproval,
  crearPreferenciaCheckoutPro,
  cancelarPreapproval,
  obtenerDetallePreapproval,
  obtenerDetallePago,
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
 * Inicia el proceso de suscripción o pago puntual con Mercado Pago.
 *
 * Exclusivo para el dueño del taller:
 * - modo 'un_mes': Genera preferencia de Checkout Pro (permite Dinero en Cuenta, Mercado Crédito, Débito y Crédito).
 * - modo 'recurrente': Genera suscripción mensual por débito automático.
 */
export async function iniciarSuscripcionAction(
  modo: "recurrente" | "un_mes" = "recurrente"
): Promise<ResultadoIniciarSuscripcion> {
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

    // Si es pago de 1 mes puntual, usamos Checkout Pro (como en Cuánto Sale)
    const resultado =
      modo === "un_mes"
        ? await crearPreferenciaCheckoutPro({
            tallerId,
            emailDueno,
            nombreTaller: taller.nombre,
            montoARS: monto,
          })
        : await crearSuscripcionPreapproval({
            tallerId,
            emailDueno,
            nombreTaller: taller.nombre,
            montoARS: monto,
          });

    // Guardar el ID de referencia en el taller
    const admin = crearClienteAdmin();
    await admin
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
export interface SincronizarRetornoParams {
  preapprovalId?: string;
  paymentId?: string;
  status?: string;
}

/**
 * Sincroniza el estado de la suscripción al volver del checkout de Mercado Pago.
 *
 * Soporta tanto el retorno de Checkout Pro (payment_id aprobado) como
 * el de Preapproval (preapproval_id autorizado).
 */
export async function sincronizarSuscripcionRetornoAction(
  params?: SincronizarRetornoParams
): Promise<{ ok: boolean; activada?: boolean }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { ok: false };

  try {
    const tallerId = sesion.perfil.taller_id;
    const admin = crearClienteAdmin();

    const { data: taller } = await admin
      .from("taller")
      .select("mp_preapproval_id, estado_suscripcion, suscripcion_fin")
      .eq("id", tallerId)
      .single();

    // 1. Caso Checkout Pro (pago puntual de 1 mes)
    if (params?.paymentId) {
      const pago = await obtenerDetallePago(params.paymentId);
      if (pago && pago.status === "approved") {
        const actualFin = taller?.suscripcion_fin ? new Date(taller.suscripcion_fin).getTime() : 0;
        const baseTime = actualFin > Date.now() ? actualFin : Date.now();
        const fechaFin = new Date(baseTime + 30 * 24 * 60 * 60 * 1000).toISOString();

        await admin
          .from("taller")
          .update({
            estado_suscripcion: "activa",
            suscripcion_fin: fechaFin,
            mp_subscription_status: "approved",
            mp_payer_id: pago.payer?.id ? String(pago.payer.id) : null,
          })
          .eq("id", tallerId);

        await admin.from("taller_suscripcion_evento").insert({
          taller_id: tallerId,
          tipo: "pago_puntual_checkout_pro",
          mp_id: String(pago.id),
          estado: pago.status,
          monto: pago.transaction_amount || null,
          payload: JSON.parse(JSON.stringify(pago)),
        });

        revalidatePath("/suscripcion");
        revalidatePath("/", "layout");
        return { ok: true, activada: true };
      }
    }

    // 2. Caso Preapproval (suscripción mensual por débito automático)
    const preapprovalId = params?.preapprovalId || taller?.mp_preapproval_id;
    if (preapprovalId) {
      const detalle = await obtenerDetallePreapproval(preapprovalId);
      if (detalle && detalle.status === "authorized") {
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
    }

    return { ok: true, activada: false };
  } catch (error) {
    console.error("[sincronizarSuscripcionRetornoAction]", error);
    return { ok: false };
  }
}
