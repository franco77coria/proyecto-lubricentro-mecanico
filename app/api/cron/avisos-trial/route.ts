import { NextResponse, type NextRequest } from "next/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { obtenerContactoDuenoTaller } from "@/lib/email/taller-contacto";
import { notificarAvisoTrial, notificarTrialVencido } from "@/lib/email/avisos";

export const dynamic = "force-dynamic";

/**
 * Endpoint de ejecución automática (cron job diario).
 *
 * Funcionalidades:
 * 1. Avisa a los talleres que les quedan 48 horas (2 días) de prueba gratuita.
 * 2. Detecta cuentas con prueba finalizada (now > trial_fin), actualiza su estado a 'vencida' y envía el correo de fin de prueba.
 * 3. Garantiza idempotencia verificando eventos previos en 'taller_suscripcion_evento'.
 */
async function procesarAvisosTrial(request: NextRequest) {
  // 1. Validar autorización por secreto si está configurado
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[Cron Avisos Trial] Intento no autorizado bloqueado.");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const admin = crearClienteAdmin();
    const ahora = Date.now();

    // Obtener todos los talleres en prueba o recién vencidos
    const { data: talleres, error } = await admin
      .from("taller")
      .select("id, nombre, trial_fin, estado_suscripcion")
      .in("estado_suscripcion", ["trial", "vencida"]);

    if (error) {
      console.error("[Cron Avisos Trial] Error consultando talleres:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let avisosEnviados = 0;
    let vencidosEnviados = 0;
    let estadosActualizados = 0;

    for (const taller of talleres || []) {
      if (!taller.trial_fin) continue;

      const fechaFinMs = new Date(taller.trial_fin).getTime();
      const msRestantes = fechaFinMs - ahora;
      const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));

      // Caso A: El período de prueba ya finalizó (msRestantes <= 0)
      if (msRestantes <= 0) {
        // Si aún figuraba en trial, actualizar a vencida
        if (taller.estado_suscripcion === "trial") {
          await admin
            .from("taller")
            .update({ estado_suscripcion: "vencida" })
            .eq("id", taller.id);
          estadosActualizados++;
        }

        // Verificar si ya se envió el aviso de trial vencido
        const { data: eventoPrevio } = await admin
          .from("taller_suscripcion_evento")
          .select("id")
          .eq("taller_id", taller.id)
          .eq("tipo", "email_trial_vencido")
          .maybeSingle();

        if (!eventoPrevio) {
          const contacto = await obtenerContactoDuenoTaller(admin, taller.id);
          if (contacto) {
            const envio = await notificarTrialVencido(
              contacto.email,
              contacto.nombreUsuario,
              contacto.nombreTaller
            );

            if (envio.ok) {
              await admin.from("taller_suscripcion_evento").insert({
                taller_id: taller.id,
                tipo: "email_trial_vencido",
                estado: "enviado",
                payload: {
                  trial_fin: taller.trial_fin,
                  fecha_envio: new Date().toISOString(),
                },
              });
              vencidosEnviados++;
            }
          }
        }
        continue;
      }

      // Caso B: Quedan 2 días o menos (48 horas) y aún está en trial
      if (diasRestantes <= 2 && taller.estado_suscripcion === "trial") {
        // Verificar si ya se envió el aviso de 48h
        const { data: eventoPrevio } = await admin
          .from("taller_suscripcion_evento")
          .select("id")
          .eq("taller_id", taller.id)
          .eq("tipo", "email_aviso_trial_48h")
          .maybeSingle();

        if (!eventoPrevio) {
          const contacto = await obtenerContactoDuenoTaller(admin, taller.id);
          if (contacto) {
            const envio = await notificarAvisoTrial(
              contacto.email,
              contacto.nombreUsuario,
              contacto.nombreTaller,
              Math.max(1, diasRestantes)
            );

            if (envio.ok) {
              await admin.from("taller_suscripcion_evento").insert({
                taller_id: taller.id,
                tipo: "email_aviso_trial_48h",
                estado: "enviado",
                payload: {
                  dias_restantes: diasRestantes,
                  trial_fin: taller.trial_fin,
                  fecha_envio: new Date().toISOString(),
                },
              });
              avisosEnviados++;
            }
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      totalRevisados: talleres?.length || 0,
      estadosActualizados,
      avisos48hEnviados: avisosEnviados,
      vencidosEnviados,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Cron Avisos Trial] Excepción:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return procesarAvisosTrial(request);
}

export async function POST(request: NextRequest) {
  return procesarAvisosTrial(request);
}
