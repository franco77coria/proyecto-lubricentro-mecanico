import { NextResponse, type NextRequest } from "next/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import {
  obtenerDetallePreapproval,
  validarFirmaWebhookMP,
} from "@/lib/mercadopago/cliente";

/**
 * Webhook receptor de notificaciones de Mercado Pago para Suscripciones SaaS (Preapproval).
 *
 * Escucha eventos automáticos cuando un dueño de taller autoriza, renueva,
 * pausa o cancela su suscripción mensual.
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let body: Record<string, unknown> = {};

    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      // Mercado Pago a veces envía datos sólo por query params
    }

    const type = (body.type || body.action || searchParams.get("type") || searchParams.get("topic")) as string | null;
    const dataObj = (body.data as { id?: string } | undefined) || {};
    const dataId = (dataObj.id || searchParams.get("data.id") || searchParams.get("id")) as string | null;

    // 1. Validar firma criptográfica del webhook
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");
    const firmaValida = validarFirmaWebhookMP(xSignature, xRequestId, dataId);

    if (!firmaValida) {
      console.warn("[Webhook MercadoPago] Firma inválida rechazada");
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    // Si no hay ID de recurso o no es un evento de suscripción/preapproval
    if (!dataId) {
      return NextResponse.json({ ok: true, mensaje: "Sin ID de recurso" }, { status: 200 });
    }

    // 2. Procesar eventos de preapproval / suscripción
    if (
      type === "subscription_preapproval" ||
      type === "preapproval" ||
      type === "created" ||
      type === "updated"
    ) {
      const preapproval = await obtenerDetallePreapproval(dataId);
      if (!preapproval) {
        return NextResponse.json({ ok: true, mensaje: "Recurso no encontrado en MP" }, { status: 200 });
      }

      const tallerId = preapproval.external_reference;
      if (!tallerId) {
        console.warn("[Webhook MercadoPago] Preapproval sin external_reference (tallerId):", dataId);
        return NextResponse.json({ ok: true, mensaje: "Sin taller_id asociado" }, { status: 200 });
      }

      const admin = crearClienteAdmin();

      // Mapear estado de Mercado Pago a nuestro dominio
      let nuevoEstadoSuscripcion = "trial";
      let suscripcionFin: string | null = null;

      if (preapproval.status === "authorized") {
        nuevoEstadoSuscripcion = "activa";
        // Si MP informa próxima fecha de cobro, la usamos como vigencia
        if (preapproval.next_payment_date) {
          suscripcionFin = preapproval.next_payment_date;
        } else {
          // Por defecto 35 días (período mensual + gracia de 5 días)
          suscripcionFin = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString();
        }
      } else if (preapproval.status === "cancelled") {
        nuevoEstadoSuscripcion = "cancelada";
      } else if (preapproval.status === "paused") {
        nuevoEstadoSuscripcion = "vencida";
      }

      // Actualizar taller
      const updateData: {
        estado_suscripcion: string;
        mp_subscription_status: string;
        mp_preapproval_id: string;
        mp_payer_id?: string | null;
        suscripcion_fin?: string | null;
      } = {
        estado_suscripcion: nuevoEstadoSuscripcion,
        mp_subscription_status: preapproval.status,
        mp_preapproval_id: preapproval.id,
      };

      if (preapproval.payer_id) {
        updateData.mp_payer_id = String(preapproval.payer_id);
      }
      if (suscripcionFin) {
        updateData.suscripcion_fin = suscripcionFin;
      }

      const { error: errUpdate } = await admin
        .from("taller")
        .update(updateData)
        .eq("id", tallerId);

      if (errUpdate) {
        console.error("[Webhook MercadoPago] Error actualizando taller:", errUpdate);
      }

      // Registrar evento de auditoría
      await admin.from("taller_suscripcion_evento").insert({
        taller_id: tallerId,
        mp_id: preapproval.id,
        tipo: type || "subscription_preapproval",
        estado: preapproval.status,
        monto: preapproval.auto_recurring?.transaction_amount || null,
        payload: JSON.parse(JSON.stringify(preapproval)),
      });

      console.log(`[Webhook MercadoPago] Taller ${tallerId} actualizado a estado: ${nuevoEstadoSuscripcion} (${preapproval.status})`);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[Webhook MercadoPago Exception]", error);
    // Devolver 200 para evitar reintentos infinitos de MP ante fallas internas no recuperables
    return NextResponse.json({ error: "Falla interna de procesamiento" }, { status: 200 });
  }
}
