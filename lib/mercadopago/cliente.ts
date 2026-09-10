import crypto from "node:crypto";

/**
 * Cliente de integración con la API oficial de Mercado Pago para Suscripciones Recurrentes (Preapproval).
 *
 * Utiliza fetch nativo sin dependencias pesadas para compatibilidad con Edge / Node en Next.js.
 */

const MP_BASE_URL = "https://api.mercadopago.com";

export interface CrearSuscripcionParams {
  tallerId: string;
  emailDueno: string;
  nombreTaller: string;
  montoARS?: number;
  planId?: string;
  nombrePlan?: string;
  backUrl?: string;
}

export interface ResultadoPreapproval {
  id: string;
  init_point: string;
  status: string;
}

export interface DetallePreapproval {
  id: string;
  payer_id?: number | string;
  payer_email?: string;
  status: "pending" | "authorized" | "paused" | "cancelled";
  reason?: string;
  external_reference?: string;
  next_payment_date?: string;
  date_created?: string;
  last_modified?: string;
  auto_recurring?: {
    frequency: number;
    frequency_type: string;
    transaction_amount: number;
    currency_id: string;
  };
}

export interface DetallePago {
  id: number | string;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  date_approved?: string;
  payer?: { email?: string; id?: string };
}

/**
 * Limpia espacios y comillas envolventes accidentales en variables de entorno.
 */
function limpiarEnv(valor?: string): string {
  if (!valor) return "";
  return valor.trim().replace(/^["']|["']$/g, "").trim();
}

/**
 * Obtiene el access token de Mercado Pago configurado en las variables de entorno.
 */
function obtenerAccessToken(): string {
  const token = limpiarEnv(
    process.env.MERCADOPAGO_ACCESS_TOKEN ||
    process.env.MERCADO_PAGO_ACCESS_TOKEN ||
    process.env.MP_ACCESS_TOKEN
  );
  if (!token) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN (o MP_ACCESS_TOKEN) no está configurado. Configurá tus credenciales de Mercado Pago en .env.local o ejecuta `mpcli login`."
    );
  }
  return token;
}

/**
 * Obtiene el monto mensual configurado para la suscripción en ARS (default: $29.900 ARS).
 */
export function obtenerPrecioPlanMensual(): number {
  const envVal = limpiarEnv(
    process.env.MP_PRECIO_PLAN_MENSUAL ||
    process.env.MP_AMOUNT ||
    process.env.MERCADOPAGO_PRECIO_PLAN
  );
  if (envVal) {
    const parsed = Number(envVal);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 29900;
}

/**
 * Crea una preferencia de suscripción recurrente mensual (Preapproval) en Mercado Pago.
 */
export async function crearSuscripcionPreapproval(
  params: CrearSuscripcionParams
): Promise<ResultadoPreapproval> {
  const token = obtenerAccessToken();
  const monto = params.montoARS ?? obtenerPrecioPlanMensual();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let backUrl = params.backUrl || `${appUrl}/suscripcion?status=success`;

  // Mercado Pago exige HTTPS en back_url.
  if (!backUrl.startsWith("https://")) {
    const ruta = backUrl.startsWith("http://")
      ? backUrl.replace(/^http:\/\/[^/]+/, "")
      : "/suscripcion?status=success";
    backUrl = `https://tallerpro.app${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
  }

  const nombrePlan = params.nombrePlan || "Taller Pro";
  const planId = params.planId || "pro";
  const extRef = `${params.tallerId}:${planId}`;

  const body = {
    payer_email: params.emailDueno.trim().toLowerCase(),
    back_url: backUrl,
    reason: `Suscripción Mensual ${nombrePlan} — ${params.nombreTaller}`,
    external_reference: extRef,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: monto,
      currency_id: "ARS",
    },
    status: "pending",
  };

  const res = await fetch(`${MP_BASE_URL}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[MercadoPago Preapproval Error]", res.status, errorBody);
    throw new Error(`Error al crear suscripción en Mercado Pago: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { id: string; init_point: string; status: string };
  return {
    id: data.id,
    init_point: data.init_point,
    status: data.status,
  };
}

/**
 * Crea una preferencia de Checkout Pro para el pago de 1 mes puntual.
 *
 * Permite que el dueño del taller pague con:
 * - Dinero en cuenta de Mercado Pago
 * - Mercado Crédito (cuotas)
 * - Tarjetas de débito y crédito
 */
export async function crearPreferenciaCheckoutPro(
  params: CrearSuscripcionParams
): Promise<ResultadoPreapproval> {
  const token = obtenerAccessToken();
  const monto = params.montoARS ?? obtenerPrecioPlanMensual();
  const nombrePlan = params.nombrePlan || "Plan Taller Pro";
  const planId = params.planId || "pro";
  const extRef = `${params.tallerId}:${planId}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let backUrl = params.backUrl || `${appUrl}/suscripcion?status=success`;

  if (!backUrl.startsWith("https://")) {
    const ruta = backUrl.startsWith("http://")
      ? backUrl.replace(/^http:\/\/[^/]+/, "")
      : "/suscripcion?status=success";
    backUrl = `https://tallerpro.app${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
  }

  const res = await fetch(`${MP_BASE_URL}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          id: `plan-${planId}-mes`,
          title: `${nombrePlan} (1 Mes) — ${params.nombreTaller}`,
          description: `Acceso mensual al ${nombrePlan} para lubricentro y taller mecánico`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: monto,
        },
      ],
      payer: {
        email: params.emailDueno.trim().toLowerCase(),
      },
      external_reference: extRef,
      back_urls: {
        success: backUrl,
        failure: backUrl.replace("status=success", "status=failure"),
        pending: backUrl.replace("status=success", "status=pending"),
      },
      auto_return: "approved",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[MercadoPago Preference Error]", res.status, errText);
    throw new Error(`Error creando preferencia de pago en Mercado Pago: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { id: string; init_point: string };
  return {
    id: data.id,
    init_point: data.init_point,
    status: "pending",
  };
}

/**
 * Consulta un pago puntual por ID en la API de Mercado Pago.
 */
export async function obtenerDetallePago(paymentId: string | number): Promise<DetallePago | null> {
  const token = obtenerAccessToken();

  const res = await fetch(`${MP_BASE_URL}/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    const errText = await res.text();
    console.error("[MercadoPago Obtener Pago Error]", res.status, errText);
    throw new Error(`Error consultando pago en Mercado Pago: HTTP ${res.status}`);
  }

  return (await res.json()) as DetallePago;
}

/**
 * Consulta el estado actual de una suscripción Preapproval en Mercado Pago.
 */
export async function obtenerDetallePreapproval(preapprovalId: string): Promise<DetallePreapproval | null> {
  const token = obtenerAccessToken();

  const res = await fetch(`${MP_BASE_URL}/preapproval/${preapprovalId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    const errText = await res.text();
    console.error("[MercadoPago Obtener Preapproval Error]", res.status, errText);
    throw new Error(`Error al consultar suscripción en Mercado Pago: HTTP ${res.status}`);
  }

  return (await res.json()) as DetallePreapproval;
}

/**
 * Pausa o cancela una suscripción Preapproval en Mercado Pago.
 */
export async function cancelarPreapproval(preapprovalId: string): Promise<boolean> {
  const token = obtenerAccessToken();

  const res = await fetch(`${MP_BASE_URL}/preapproval/${preapprovalId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "cancelled" }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[MercadoPago Cancelar Preapproval Error]", res.status, errText);
    return false;
  }

  return true;
}

/**
 * Valida la firma criptográfica HMAC SHA-256 enviada por Mercado Pago en el webhook.
 *
 * Formato del header x-signature:
 * ts=1710000000,v1=abcdef0123456789...
 */
export function validarFirmaWebhookMP(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null
): boolean {
  const secret =
    process.env.MERCADOPAGO_WEBHOOK_SECRET ||
    process.env.MERCADO_PAGO_WEBHOOK_SECRET ||
    process.env.MP_WEBHOOK_SECRET;
  // Si no se configuró secret en desarrollo/staging, se permite la invocación para pruebas controladas
  if (!secret) return true;
  if (!xSignature || !dataId) return false;

  try {
    const partes = xSignature.split(",");
    let ts = "";
    let v1 = "";

    for (const p of partes) {
      const [clave, valor] = p.split("=");
      if (clave.trim() === "ts") ts = valor.trim();
      if (clave.trim() === "v1") v1 = valor.trim();
    }

    if (!ts || !v1) return false;

    // Plantilla de manifiesto según documentación oficial de Mercado Pago
    const manifest = `id:${dataId};request-id:${xRequestId || ""};ts:${ts};`;
    const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

    const bufHmac = Buffer.from(hmac);
    const bufV1 = Buffer.from(v1);
    if (bufHmac.length !== bufV1.length) return false;

    return crypto.timingSafeEqual(bufHmac, bufV1);
  } catch (err) {
    console.error("[validarFirmaWebhookMP] Error:", err);
    return false;
  }
}
