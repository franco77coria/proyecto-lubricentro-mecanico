import { enviarEmail, type ResultadoEnvioEmail } from "./cliente";
import {
  renderEmailBienvenida,
  renderEmailAvisoTrial,
  renderEmailTrialVencido,
  renderEmailPagoExitoso,
  renderEmailPagoFallido,
} from "./plantillas";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://fierros.app";

/**
 * Notificación 1: Bienvenida al taller y comienzo de los 7 días de prueba.
 */
export async function notificarBienvenidaTrial(
  email: string,
  nombreUsuario: string,
  nombreTaller: string
): Promise<ResultadoEnvioEmail> {
  const { asunto, html } = renderEmailBienvenida({
    nombreUsuario,
    nombreTaller,
    appUrl: APP_URL,
  });

  return enviarEmail({
    para: email,
    asunto,
    html,
  });
}

/**
 * Notificación 2: Recordatorio de que quedan X días (ej. 2 días / 48 horas) de prueba.
 */
export async function notificarAvisoTrial(
  email: string,
  nombreUsuario: string,
  nombreTaller: string,
  diasRestantes: number
): Promise<ResultadoEnvioEmail> {
  const { asunto, html } = renderEmailAvisoTrial({
    nombreUsuario,
    nombreTaller,
    diasRestantes,
    appUrl: APP_URL,
  });

  return enviarEmail({
    para: email,
    asunto,
    html,
  });
}

/**
 * Notificación 3: Aviso de período de prueba gratuito finalizado.
 */
export async function notificarTrialVencido(
  email: string,
  nombreUsuario: string,
  nombreTaller: string
): Promise<ResultadoEnvioEmail> {
  const { asunto, html } = renderEmailTrialVencido({
    nombreUsuario,
    nombreTaller,
    appUrl: APP_URL,
  });

  return enviarEmail({
    para: email,
    asunto,
    html,
  });
}

/**
 * Notificación 4: Cobro de suscripción acreditado con éxito.
 */
export async function notificarPagoExitoso(
  email: string,
  nombreUsuario: string,
  nombreTaller: string,
  planNombre: string,
  montoARS: number,
  fechaVigencia?: string | null,
  idOperacion?: string | null
): Promise<ResultadoEnvioEmail> {
  const { asunto, html } = renderEmailPagoExitoso({
    nombreUsuario,
    nombreTaller,
    planNombre,
    montoARS,
    fechaVigencia,
    idOperacion,
    appUrl: APP_URL,
  });

  return enviarEmail({
    para: email,
    asunto,
    html,
  });
}

/**
 * Notificación 5: Cobro fallido o tarjeta rechazada en Mercado Pago.
 */
export async function notificarPagoFallido(
  email: string,
  nombreUsuario: string,
  nombreTaller: string,
  motivo?: string | null
): Promise<ResultadoEnvioEmail> {
  const { asunto, html } = renderEmailPagoFallido({
    nombreUsuario,
    nombreTaller,
    motivo,
    appUrl: APP_URL,
  });

  return enviarEmail({
    para: email,
    asunto,
    html,
  });
}
