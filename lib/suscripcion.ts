/**
 * Lógica de dominio para suscripciones SaaS y período de prueba gratuito de 7 días.
 *
 * Reglas:
 * 1. Al crear el taller, tiene 7 días de prueba (trial_fin = creado_en + 7 días).
 * 2. Si now() <= trial_fin, el taller tiene acceso completo (enTrial = true).
 * 3. Si now() > trial_fin y estado_suscripcion !== 'activa', el taller está vencido y requiere suscripción.
 * 4. Si estado_suscripcion === 'activa', el taller tiene acceso permanente (mientras la suscripción en Mercado Pago esté autorizada).
 */

export type PlanId = "inicial" | "pro" | "premium";

export interface PlanConfig {
  id: PlanId;
  nombre: string;
  subtitulo: string;
  precioARS: number;
  destacado?: boolean;
  limiteMecanicos: number | "ilimitado";
  caracteristicas: string[];
}

export const PLANES_DISPONIBLES: Record<PlanId, PlanConfig> = {
  inicial: {
    id: "inicial",
    nombre: "Plan Inicial",
    subtitulo: "Ideal para lubricentros chicos o talleres unipersonales",
    precioARS: 29900,
    destacado: false,
    limiteMecanicos: 2,
    caracteristicas: [
      "Hasta 2 mecánicos / usuarios",
      "Órdenes de trabajo (OT) ilimitadas",
      "Peritaje de recepción con checklist digital",
      "Historial de clientes y vehículos por patente",
      "Avisos automáticos de service por WhatsApp",
      "Control de caja diaria y medios de pago",
      "Portal de seguimiento online para clientes",
    ],
  },
  pro: {
    id: "pro",
    nombre: "Plan Pro",
    subtitulo: "El más elegido para talleres mecánicos y lubricentros en crecimiento",
    precioARS: 44900,
    destacado: true,
    limiteMecanicos: 5,
    caracteristicas: [
      "Todo lo del Plan Inicial",
      "Hasta 5 mecánicos con roles y permisos",
      "Control de stock de repuestos y equivalencias",
      "Libro mayor inmutable y alertas de faltantes",
      "Turnero web integrado para citas y recepción",
      "Peritaje fotográfico asistido con IA",
      "Tablero Kanban en vivo para el taller",
      "Reportes de rentabilidad y mano de obra",
    ],
  },
  premium: {
    id: "premium",
    nombre: "Plan Premium",
    subtitulo: "Para talleres de alto volumen, lubricentros grandes y atención de flotas",
    precioARS: 69900,
    destacado: false,
    limiteMecanicos: "ilimitado",
    caracteristicas: [
      "Todo lo del Plan Pro",
      "Usuarios y mecánicos ilimitados",
      "Escaneo y OCR de Cédula Verde con IA ilimitado",
      "Módulo de flotas comerciales y cuentas corrientes",
      "Exportación avanzada a Excel y reportes contables",
      "Soporte prioritario 24/7 por WhatsApp directo",
      "Onboarding personalizado y asistencia en inventario",
    ],
  },
};

export function obtenerConfigPlan(planId?: string | null): PlanConfig {
  if (planId && planId in PLANES_DISPONIBLES) {
    return PLANES_DISPONIBLES[planId as PlanId];
  }
  return PLANES_DISPONIBLES.pro;
}

export function obtenerPrecioPlan(planId: PlanId): number {
  return PLANES_DISPONIBLES[planId]?.precioARS ?? 44900;
}

export interface InfoSuscripcionTaller {
  plan?: string | null;
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
  plan: PlanId | "trial";
  nombrePlan: string;
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
      plan: "trial",
      nombrePlan: "Prueba Gratuita",
    };
  }

  const planIdRaw = (taller.plan || "pro") as PlanId;
  const configPlan = obtenerConfigPlan(planIdRaw);

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
        plan: configPlan.id,
        nombrePlan: configPlan.nombre,
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
      plan: "trial",
      nombrePlan: "Prueba Gratuita (Acceso Total)",
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
      plan: configPlan.id,
      nombrePlan: configPlan.nombre,
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
    plan: configPlan.id,
    nombrePlan: configPlan.nombre,
  };
}
