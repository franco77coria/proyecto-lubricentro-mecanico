"use server";

import { z } from "zod";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { obtenerSesion } from "@/lib/supabase/server";
import { cancelarPreapproval } from "@/lib/mercadopago/cliente";
import { generarCodigoTramite } from "@/lib/legales-utils";

export { generarCodigoTramite };

export interface ResultadoSolicitudLegal {
  ok?: boolean;
  error?: string;
  codigoTramite?: string;
  fecha?: string;
  mensaje?: string;
  canceloMP?: boolean;
}

const bajaSchema = z.object({
  email: z.string().trim().email("Ingresá un correo electrónico válido."),
  nombre: z.string().trim().min(3, "Ingresá tu nombre completo o razón social."),
  telefono: z.string().trim().optional(),
  motivo: z.string().trim().min(1, "Seleccioná un motivo de baja."),
  detalle: z.string().trim().max(1000).optional(),
});

const arrepentimientoSchema = z.object({
  email: z.string().trim().email("Ingresá un correo electrónico válido."),
  nombre: z.string().trim().min(3, "Ingresá tu nombre completo o razón social."),
  telefono: z.string().trim().optional(),
  motivo: z.string().trim().max(1000).optional(),
});

const arcoSchema = z.object({
  email: z.string().trim().email("Ingresá un correo electrónico válido."),
  nombre: z.string().trim().min(3, "Ingresá tu nombre y apellido completo."),
  tipoDerecho: z.enum(["acceso", "rectificacion", "supresion", "oposicion"], {
    message: "Seleccioná el tipo de derecho ARCO que deseás ejercer.",
  }),
  detalle: z.string().trim().min(10, "Por favor explicá en detalle el alcance de tu solicitud."),
});

/**
 * Procesa el Botón de Baja conforme a la Ley 24.240 y Resoluciones 271/2020 y 316/2020 de la Secretaría de Comercio Interior.
 * Otorga constancia de trámite en tiempo real y cancela la suscripción en Mercado Pago si el usuario está autenticado.
 */
export async function solicitarBajaAction(
  _prevState: unknown,
  formData: FormData
): Promise<ResultadoSolicitudLegal> {
  try {
    const raw = {
      email: formData.get("email"),
      nombre: formData.get("nombre"),
      telefono: formData.get("telefono") || undefined,
      motivo: formData.get("motivo"),
      detalle: formData.get("detalle") || undefined,
    };

    const parsed = bajaSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Datos incompletos o inválidos." };
    }

    const { email, nombre, telefono, motivo, detalle } = parsed.data;
    const codigoTramite = generarCodigoTramite("BAJA");
    const ahora = new Date().toISOString();

    const sesion = await obtenerSesion();
    const admin = crearClienteAdmin();

    let tallerId: string | null = null;
    let canceloMP = false;

    // Si el usuario está autenticado en la plataforma y es dueño
    if (sesion?.perfil) {
      tallerId = sesion.perfil.taller_id;

      const { data: taller } = await admin
        .from("taller")
        .select("id, mp_preapproval_id, estado_suscripcion")
        .eq("id", tallerId)
        .maybeSingle();

      if (taller?.mp_preapproval_id) {
        try {
          await cancelarPreapproval(taller.mp_preapproval_id);
          canceloMP = true;
        } catch (mpErr) {
          console.error("Error al cancelar débito en MP durante baja:", mpErr);
        }
      }

      // Marcar estado del taller como cancelado
      await admin
        .from("taller")
        .update({
          estado_suscripcion: "cancelado",
          mp_subscription_status: "cancelled",
        })
        .eq("id", tallerId);
    } else {
      // Si no está autenticado, buscamos si hay un taller asociado al email del titular
      const { data: tallerCoincidente } = await admin
        .from("taller")
        .select("id, mp_preapproval_id")
        .ilike("email", email)
        .maybeSingle();

      if (tallerCoincidente) {
        tallerId = tallerCoincidente.id;
        if (tallerCoincidente.mp_preapproval_id) {
          try {
            await cancelarPreapproval(tallerCoincidente.mp_preapproval_id);
            canceloMP = true;
          } catch (err) {
            console.error("Error cancelando MP por coincidencia de email:", err);
          }
        }
        await admin
          .from("taller")
          .update({
            estado_suscripcion: "cancelado",
            mp_subscription_status: "cancelled",
          })
          .eq("id", tallerId);
      }
    }

    // Registrar en tabla legal auditable
    const { error: dbError } = await admin.from("solicitud_legal").insert({
      tipo: "baja",
      codigo_tramite: codigoTramite,
      taller_id: tallerId,
      email,
      nombre,
      telefono: telefono ?? null,
      motivo: `${motivo}${detalle ? ` — Detalle: ${detalle}` : ""}`,
      estado: "registrada",
      metadata: {
        canceloMP,
        origen: sesion?.perfil ? "autenticado" : "publico",
        fechaRegistro: ahora,
      },
    });

    if (dbError) {
      console.error("Error guardando solicitud_legal:", dbError);
      return { error: "No se pudo registrar la solicitud. Por favor intentá nuevamente." };
    }

    return {
      ok: true,
      codigoTramite,
      fecha: new Date().toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      canceloMP,
      mensaje:
        "Tu solicitud de baja fue procesada y registrada exitosamente conforme al Art. 10 ter de la Ley 24.240.",
    };
  } catch (err) {
    console.error("Error inesperado en solicitarBajaAction:", err);
    return { error: "Ocurrió un error inesperado al procesar la baja." };
  }
}

/**
 * Procesa el Botón de Arrepentimiento conforme a la Resolución 424/2020 de la Secretaría de Comercio Interior.
 * Permite revocar la contratación dentro del plazo de 10 días corridos otorgando constancia inmediata.
 */
export async function solicitarArrepentimientoAction(
  _prevState: unknown,
  formData: FormData
): Promise<ResultadoSolicitudLegal> {
  try {
    const raw = {
      email: formData.get("email"),
      nombre: formData.get("nombre"),
      telefono: formData.get("telefono") || undefined,
      motivo: formData.get("motivo") || undefined,
    };

    const parsed = arrepentimientoSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Datos incompletos o inválidos." };
    }

    const { email, nombre, telefono, motivo } = parsed.data;
    const codigoTramite = generarCodigoTramite("ARREP");
    const ahora = new Date().toISOString();

    const sesion = await obtenerSesion();
    const admin = crearClienteAdmin();

    let tallerId: string | null = null;
    let canceloMP = false;

    if (sesion?.perfil) {
      tallerId = sesion.perfil.taller_id;
      const { data: taller } = await admin
        .from("taller")
        .select("id, mp_preapproval_id")
        .eq("id", tallerId)
        .maybeSingle();

      if (taller?.mp_preapproval_id) {
        try {
          await cancelarPreapproval(taller.mp_preapproval_id);
          canceloMP = true;
        } catch (mpErr) {
          console.error("Error cancelando preapproval en arrepentimiento:", mpErr);
        }
      }

      await admin
        .from("taller")
        .update({
          estado_suscripcion: "cancelado",
          mp_subscription_status: "cancelled",
        })
        .eq("id", tallerId);
    }

    const { error: dbError } = await admin.from("solicitud_legal").insert({
      tipo: "arrepentimiento",
      codigo_tramite: codigoTramite,
      taller_id: tallerId,
      email,
      nombre,
      telefono: telefono ?? null,
      motivo: motivo ?? "Revocación dentro del plazo de 10 días (Res. 424/2020)",
      estado: "registrada",
      metadata: {
        canceloMP,
        normativa: "Resolución 424/2020 SCI - Ley 24.240",
        fechaRegistro: ahora,
      },
    });

    if (dbError) {
      console.error("Error registrando arrepentimiento:", dbError);
      return { error: "No se pudo registrar la revocación. Intentá de nuevo." };
    }

    return {
      ok: true,
      codigoTramite,
      fecha: new Date().toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      canceloMP,
      mensaje:
        "Se emitió la constancia de arrepentimiento conforme al Art. 2° de la Resolución 424/2020.",
    };
  } catch (err) {
    console.error("Error en solicitarArrepentimientoAction:", err);
    return { error: "Ocurrió un error inesperado al procesar la revocación." };
  }
}

/**
 * Procesa solicitudes de ejercicio de Derechos ARCO conforme a la Ley 25.326 de Protección de Datos Personales.
 */
export async function solicitarDerechoArcoAction(
  _prevState: unknown,
  formData: FormData
): Promise<ResultadoSolicitudLegal> {
  try {
    const raw = {
      email: formData.get("email"),
      nombre: formData.get("nombre"),
      tipoDerecho: formData.get("tipoDerecho"),
      detalle: formData.get("detalle"),
    };

    const parsed = arcoSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Datos incompletos o inválidos." };
    }

    const { email, nombre, tipoDerecho, detalle } = parsed.data;
    const codigoTramite = generarCodigoTramite("ARCO");
    const ahora = new Date().toISOString();

    const sesion = await obtenerSesion();
    const admin = crearClienteAdmin();

    const { error: dbError } = await admin.from("solicitud_legal").insert({
      tipo: "derecho_arco",
      codigo_tramite: codigoTramite,
      taller_id: sesion?.perfil?.taller_id ?? null,
      email,
      nombre,
      motivo: `Derecho ARCO: ${tipoDerecho.toUpperCase()} — ${detalle}`,
      estado: "registrada",
      metadata: {
        tipoDerecho,
        normativa: "Ley N° 25.326 de Protección de Datos Personales",
        fechaRegistro: ahora,
      },
    });

    if (dbError) {
      console.error("Error registrando solicitud ARCO:", dbError);
      return { error: "No se pudo registrar la solicitud ARCO." };
    }

    return {
      ok: true,
      codigoTramite,
      fecha: new Date().toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      mensaje:
        "Tu solicitud de ejercicio de derechos ARCO fue recibida y será atendida dentro de los plazos legales establecidos por la Ley 25.326.",
    };
  } catch (err) {
    console.error("Error en solicitarDerechoArcoAction:", err);
    return { error: "Ocurrió un error inesperado al procesar la solicitud ARCO." };
  }
}
