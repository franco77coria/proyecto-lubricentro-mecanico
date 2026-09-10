/**
 * Lógica de dominio para suscripciones SaaS y período de prueba gratuito de 7 días.
 *
 * Reglas:
 * 1. Al crear el taller, tiene 7 días de prueba (trial_fin = creado_en + 7 días).
 * 2. Si now() <= trial_fin, el taller tiene acceso completo (enTrial = true).
 * 3. Si now() > trial_fin y estado_suscripcion !== 'activa', el taller está vencido y requiere suscripción.
 * 4. Si estado_suscripcion === 'activa', el taller tiene acceso permanente (mientras la suscripción en Mercado Pago esté autorizada).
 */

export interface InfoSuscripcionTaller {
  estado_suscripcion?: string | null;
  trial_fin?: string | null;
  suscripcion_fin?: string | null;
  mp_subscription_status?: string | null;
}

export interface EstadoSuscripcionCalculado {
  tieneAcceso: boolean;
  enTrial: boolean;
  trialVencido: boolean;
  diasRestantesTrial: number;
  horasRestantesTrial: number;
  estado: "trial" | "activa" | "vencida" | "cancelada";
  etiquetaEstado: string;
}

export function calcularEstadoSuscripcion(taller: InfoSuscripcionTaller | null | undefined): EstadoSuscripcionCalculado {
  if (!taller) {
    return {
      tieneAcceso: false,
      enTrial: false,
      trialVencido: true,
      diasRestantesTrial: 0,
      horasRestantesTrial: 0,
      estado: "vencida",
      etiquetaEstado: "Vencida",
    };
  }

  const ahora = Date.now();
  const fechaTrialFin = taller.trial_fin ? new Date(taller.trial_fin).getTime() : 0;
  const enTrialVigente = fechaTrialFin > ahora;
  const msRestantes = Math.max(0, fechaTrialFin - ahora);
  const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));
  const horasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60));

  // 1. Si la suscripción fue pagada y está activa vía Mercado Pago
  if (taller.estado_suscripcion === "activa") {
    // Si tiene fecha de fin explícita, verificar que no haya expirado
    const fechaFin = taller.suscripcion_fin ? new Date(taller.suscripcion_fin).getTime() : Infinity;
    const pagadaVigente = fechaFin > ahora;

    if (pagadaVigente) {
      return {
        tieneAcceso: true,
        enTrial: false,
        trialVencido: false,
        diasRestantesTrial: 0,
        horasRestantesTrial: 0,
        estado: "activa",
        etiquetaEstado: "Activa",
      };
    }
  }

  // 2. Si está en período de prueba gratuito (7 días)
  if (enTrialVigente) {
    return {
      tieneAcceso: true,
      enTrial: true,
      trialVencido: false,
      diasRestantesTrial: diasRestantes,
      horasRestantesTrial: horasRestantes,
      estado: "trial",
      etiquetaEstado: `Prueba (${diasRestantes}d)`,
    };
  }

  // 3. Si el estado explícito es cancelado
  if (taller.estado_suscripcion === "cancelada" || taller.mp_subscription_status === "cancelled") {
    return {
      tieneAcceso: false,
      enTrial: false,
      trialVencido: true,
      diasRestantesTrial: 0,
      horasRestantesTrial: 0,
      estado: "cancelada",
      etiquetaEstado: "Cancelada",
    };
  }

  // 4. Período de prueba vencido sin suscripción activa
  return {
    tieneAcceso: false,
    enTrial: false,
    trialVencido: true,
    diasRestantesTrial: 0,
    horasRestantesTrial: 0,
    estado: "vencida",
    etiquetaEstado: "Trial Vencido",
  };
}
