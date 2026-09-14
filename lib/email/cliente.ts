import { Resend } from "resend";

let resendInstancia: Resend | null = null;

export function obtenerClienteResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendInstancia) {
    resendInstancia = new Resend(apiKey);
  }
  return resendInstancia;
}

export interface OpcionesEnvioEmail {
  para: string | string[];
  asunto: string;
  html: string;
  de?: string;
  responderA?: string;
}

export interface ResultadoEnvioEmail {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Envía un correo electrónico transaccional a través de Resend.
 * En entornos de desarrollo o sin RESEND_API_KEY configurada,
 * simula el envío registrándolo en consola sin fallar la ejecución.
 */
export async function enviarEmail({
  para,
  asunto,
  html,
  de,
  responderA,
}: OpcionesEnvioEmail): Promise<ResultadoEnvioEmail> {
  const apiKey = process.env.RESEND_API_KEY;
  const remitente =
    de ||
    process.env.RESEND_FROM_EMAIL ||
    "Fierros <notificaciones@fierros.app>";

  const destinatarios = Array.isArray(para) ? para : [para];

  if (!apiKey) {
    console.warn(
      `[Email Resend] RESEND_API_KEY no configurada. Simulando envío:
  - Destinatarios: ${destinatarios.join(", ")}
  - Remitente: ${remitente}
  - Asunto: "${asunto}"`
    );
    return { ok: true, id: `simulado_${Date.now()}` };
  }

  try {
    const resend = obtenerClienteResend()!;
    const { data, error } = await resend.emails.send({
      from: remitente,
      to: destinatarios,
      subject: asunto,
      html,
      replyTo: responderA || "soporte@fierros.app",
    });

    if (error) {
      console.error("[Email Resend] Error al enviar email:", error);
      return { ok: false, error: error.message };
    }

    console.log(
      `[Email Resend] Email enviado exitosamente a ${destinatarios.join(", ")} | ID: ${data?.id}`
    );
    return { ok: true, id: data?.id };
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    console.error("[Email Resend] Excepción en envío:", mensaje);
    return { ok: false, error: mensaje };
  }
}
