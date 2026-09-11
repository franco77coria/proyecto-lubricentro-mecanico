import { NextResponse, type NextRequest } from "next/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import {
  obtenerDetallePreapproval,
  obtenerDetallePago,
  cancelarPreapproval,
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
    const resultadoFirma = validarFirmaWebhookMP(xSignature, xRequestId, dataId);

    if (!resultadoFirma.ok) {
      if (resultadoFirma.motivo === "sin_secret_en_produccion") {
        console.error("[Webhook MercadoPago] MERCADOPAGO_WEBHOOK_SECRET no está configurado en producción — rechazando todo");
        return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
      }
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

      const [tallerId, refPlanId] = (preapproval.external_reference || "").split(":");
      if (!tallerId) {
        console.warn("[Webhook MercadoPago] Preapproval sin external_reference (tallerId):", dataId);
        return NextResponse.json({ ok: true, mensaje: "Sin taller_id asociado" }, { status: 200 });
      }

      const admin = crearClienteAdmin();

      // Si es una autorización de suscripción, verificar si el taller tenía otro débito previo para cancelarlo (upgrade/downgrade de plan)
      if (preapproval.status === "authorized") {
        const { data: tallerPrevio } = await admin
          .from("taller")
          .select("mp_preapproval_id")
          .eq("id", tallerId)
          .single();

        if (
          tallerPrevio?.mp_preapproval_id &&
          tallerPrevio.mp_preapproval_id !== preapproval.id
        ) {
          try {
            console.log(
              `[Webhook MercadoPago] Cancelando preapproval anterior ${tallerPrevio.mp_preapproval_id} para taller ${tallerId} por cambio de plan`
            );
            await cancelarPreapproval(tallerPrevio.mp_preapproval_id);
          } catch (errCancel) {
            console.warn(
              `[Webhook MercadoPago] Error cancelando preapproval anterior ${tallerPrevio.mp_preapproval_id}:`,
              errCancel
            );
          }
        }
      }

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
        plan?: string;
      } = {
        estado_suscripcion: nuevoEstadoSuscripcion,
        mp_subscription_status: preapproval.status,
        mp_preapproval_id: preapproval.id,
      };

      if (refPlanId === "inicial" || refPlanId === "pro" || refPlanId === "premium") {
        updateData.plan = refPlanId;
      }

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

    // 3. Procesar eventos de pago puntual (Checkout Pro — como en Cuánto Sale)
    if (type === "payment") {
      const pago = await obtenerDetallePago(dataId);
      if (pago && pago.status === "approved" && pago.external_reference) {
        const [tallerId, refPlanId] = (pago.external_reference || "").split(":");
        const admin = crearClienteAdmin();

        // Reclamar el evento ANTES de aplicar ningún efecto. Mercado Pago
        // reintrega webhooks "al menos una vez" por contrato: un reintento
        // normal (no un bug) hacía que este mismo pago sumara 30 días de
        // vigencia más de una vez. El unique (mp_id, tipo) de la migración
        // 0050 es lo que hace que el segundo insert falle — el chequeo acá
        // es solo para no seguir de largo cuando eso pasa.
        const { error: errClaim } = await admin.from("taller_suscripcion_evento").insert({
          taller_id: tallerId,
          mp_id: String(pago.id),
          tipo: "payment_approved",
          estado: pago.status,
          monto: pago.transaction_amount || null,
          payload: JSON.parse(JSON.stringify(pago)),
        });

        if (errClaim) {
          if (errClaim.code === "23505") {
            console.log(`[Webhook MercadoPago] Pago ${pago.id} ya había sido procesado, se ignora el reintento`);
          } else {
            console.error("[Webhook MercadoPago] Error registrando evento de pago:", errClaim);
          }
          return NextResponse.json({ ok: true }, { status: 200 });
        }

        const { data: taller } = await admin
          .from("taller")
          .select("suscripcion_fin")
          .eq("id", tallerId)
          .single();

        const actualFin = taller?.suscripcion_fin ? new Date(taller.suscripcion_fin).getTime() : 0;
        const baseTime = actualFin > Date.now() ? actualFin : Date.now();
        const nuevaFin = new Date(baseTime + 30 * 24 * 60 * 60 * 1000).toISOString();

        const updateDataPago: {
          estado_suscripcion: string;
          suscripcion_fin: string;
          mp_subscription_status: string;
          mp_payer_id?: string | null;
          plan?: string;
        } = {
          estado_suscripcion: "activa",
          suscripcion_fin: nuevaFin,
          mp_subscription_status: "approved",
          mp_payer_id: pago.payer?.id ? String(pago.payer.id) : null,
        };

        if (refPlanId === "inicial" || refPlanId === "pro" || refPlanId === "premium") {
          updateDataPago.plan = refPlanId;
        }

        await admin
          .from("taller")
          .update(updateDataPago)
          .eq("id", tallerId);

        console.log(`[Webhook MercadoPago] Pago aprobado registrado para taller ${tallerId}, nueva vigencia: ${nuevaFin}`);
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[Webhook MercadoPago Exception]", error);
    // Devolver 200 para evitar reintentos infinitos de MP ante fallas internas no recuperables
    return NextResponse.json({ error: "Falla interna de procesamiento" }, { status: 200 });
  }
}
