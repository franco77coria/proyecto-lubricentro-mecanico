"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Wrench,
  AlertTriangle,
  Loader2,
  Calendar,
  Wallet,
  Zap,
  Star,
  Users,
} from "lucide-react";
import { iniciarSuscripcionAction, cancelarSuscripcionAction } from "@/lib/actions/suscripcion";
import {
  PLANES_DISPONIBLES,
  type EstadoSuscripcionCalculado,
  type PlanId,
} from "@/lib/suscripcion";
import { formatearMoneda } from "@/lib/i18n";

interface PanelSuscripcionProps {
  estadoCalculado: EstadoSuscripcionCalculado;
  planActual?: PlanId | "trial";
  nombrePlan?: string;
  precioARS?: number;
  esDueno: boolean;
  nombreTaller: string;
  suscripcionFin?: string | null;
  exitoReciente?: boolean;
}

export function PanelSuscripcion({
  estadoCalculado,
  planActual = "pro",
  esDueno,
  nombreTaller,
  suscripcionFin,
  exitoReciente,
}: PanelSuscripcionProps) {
  const [modalidad, setModalidad] = useState<"un_mes" | "recurrente">("un_mes");
  const [planCargando, setPlanCargando] = useState<PlanId | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cargandoCancelar, setCargandoCancelar] = useState(false);

  const { estado, enTrial, trialVencido, diasRestantesTrial, tieneAcceso } = estadoCalculado;

  async function handleSuscribir(planId: PlanId) {
    setPlanCargando(planId);
    setErrorMsg(null);

    try {
      const res = await iniciarSuscripcionAction(modalidad, planId);
      if (res.error) {
        setErrorMsg(res.error);
        setPlanCargando(null);
        return;
      }

      if (res.initPoint) {
        window.location.href = res.initPoint;
      } else {
        setErrorMsg("No se recibió la URL de pago de Mercado Pago.");
        setPlanCargando(null);
      }
    } catch {
      setErrorMsg("Ocurrió un error al conectar con Mercado Pago.");
      setPlanCargando(null);
    }
  }

  async function handleCancelar() {
    if (!confirm("¿Seguro que deseás cancelar la suscripción mensual de este taller?")) return;
    setCargandoCancelar(true);
    setErrorMsg(null);

    try {
      const res = await cancelarSuscripcionAction();
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        window.location.reload();
      }
    } catch {
      setErrorMsg("Error al cancelar la suscripción.");
    } finally {
      setCargandoCancelar(false);
    }
  }

  const planesList = Object.values(PLANES_DISPONIBLES);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {/* Header del Taller y Título */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1 text-xs font-bold text-accent">
          <Wrench className="h-3.5 w-3.5" aria-hidden />
          <span>{nombreTaller}</span>
        </div>
        <h1 className="text-display text-2xl sm:text-4xl font-black text-foreground tracking-tight">
          Elegí el plan para tu negocio
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Herramientas pensadas específicamente para lubricentros y talleres mecánicos de Argentina.
        </p>
      </div>

      {/* Tarjeta de Estado Actual de la Cuenta */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Estado de tu cuenta
            </span>
            <div className="flex items-center gap-2.5">
              {estado === "activa" ? (
                <>
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-emerald-400">
                    Suscripción Activa — {estadoCalculado.nombrePlan}
                  </h2>
                </>
              ) : enTrial ? (
                <>
                  <Clock className="h-5 w-5 text-accent" aria-hidden />
                  <h2 className="text-base sm:text-lg font-black text-accent">
                    Prueba Gratuita ({diasRestantesTrial} {diasRestantesTrial === 1 ? "día restante" : "días restantes"})
                  </h2>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
                  <h2 className="text-base sm:text-lg font-black text-destructive">
                    {trialVencido ? "Período de Prueba Finalizado" : "Suscripción Inactiva"}
                  </h2>
                </>
              )}
            </div>
          </div>

          {estado === "activa" && suscripcionFin && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-400">
              <Calendar className="h-4 w-4 shrink-0" aria-hidden />
              <span>Vencimiento / Renovación: {new Date(suscripcionFin).toLocaleDateString("es-AR")}</span>
            </div>
          )}

          {estado === "activa" && esDueno && (
            <button
              type="button"
              onClick={handleCancelar}
              disabled={cargandoCancelar}
              className="inline-flex items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {cargandoCancelar ? "Cancelando..." : "Cancelar Débito"}
            </button>
          )}
        </div>

        {/* Notificación de éxito post-checkout */}
        {exitoReciente && (
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 text-xs text-foreground leading-relaxed animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="font-bold text-emerald-400">¡Pago acreditado exitosamente con Mercado Pago!</p>
              <p className="text-muted-foreground mt-0.5">
                El plan de tu taller ya se encuentra activo. Podés continuar operando todas las funciones sin restricciones.
              </p>
            </div>
          </div>
        )}

        {/* Alerta de prueba */}
        {enTrial && !exitoReciente && (
          <div className="flex items-start gap-3 rounded-2xl bg-accent/10 border border-accent/20 p-4 text-xs text-foreground leading-relaxed">
            <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="font-bold text-accent">¡Tenés 7 días gratis sin cargo con todas las funciones!</p>
              <p className="text-muted-foreground mt-0.5">
                Elegí con tranquilidad el plan que mejor se adapte a tu taller. Podés abonar ahora o al finalizar la prueba sin perder ningún dato.
              </p>
            </div>
          </div>
        )}

        {/* Alerta de prueba vencida */}
        {trialVencido && !tieneAcceso && (
          <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-foreground leading-relaxed">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="font-bold text-destructive">Tu prueba gratuita ha finalizado.</p>
              <p className="text-muted-foreground mt-0.5">
                Tus órdenes, stock e historial de clientes están protegidos. Seleccioná un plan para reactivar el acceso inmediatamente.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl bg-destructive/15 border border-destructive/30 p-3 text-xs font-semibold text-destructive">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Selector de Modalidad de Pago (Checkout Pro vs Débito Automático) */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
          Modalidad de Pago en Mercado Pago
        </span>
        <div className="inline-flex p-1.5 rounded-2xl border border-border/80 bg-muted/40 shadow-inner">
          <button
            type="button"
            onClick={() => setModalidad("un_mes")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              modalidad === "un_mes"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wallet className="h-4 w-4 text-accent" aria-hidden />
            <span>Pagar 1 mes puntual</span>
            <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-md font-extrabold hidden sm:inline">
              Dinero en cuenta / Débito / Crédito
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModalidad("recurrente")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              modalidad === "recurrente"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="h-4 w-4 text-accent" aria-hidden />
            <span>Débito automático mensual</span>
            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-medium hidden sm:inline">
              Renovación mensual sin vencimientos
            </span>
          </button>
        </div>
      </div>

      {/* Grilla de los 3 Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {planesList.map((plan) => {
          const esPlanActual = estado === "activa" && planActual === plan.id;
          const estaCargando = planCargando === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl border transition-all duration-200 bg-card p-6 sm:p-7 shadow-lg ${
                plan.destacado
                  ? "border-accent shadow-accent/10 shadow-2xl ring-2 ring-accent/20 md:-translate-y-2"
                  : "border-border/80 hover:border-accent/40"
              }`}
            >
              {/* Badge destacado superior */}
              {plan.destacado && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1 text-[11px] font-black text-accent-foreground shadow-md">
                  <Star className="h-3 w-3 fill-current" aria-hidden />
                  <span>MÁS ELEGIDO</span>
                </div>
              )}

              {plan.id === "premium" && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1 text-[11px] font-black text-background shadow-md">
                  <Zap className="h-3 w-3 fill-current" aria-hidden />
                  <span>MÁXIMA POTENCIA</span>
                </div>
              )}

              {/* Contenido Superior */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-black text-foreground">{plan.nombre}</h3>
                  {esPlanActual && (
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                      Plan Actual
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground min-h-[32px] leading-relaxed">
                  {plan.subtitulo}
                </p>

                {/* Precio */}
                <div className="pt-2 pb-1 border-b border-border/60">
                  <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight tabular">
                    {formatearMoneda(plan.precioARS, "ARS", "es")}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground"> /mes</span>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {modalidad === "un_mes"
                      ? "Pagas 1 mes con dinero en cuenta o tarjeta"
                      : "Débito mensual automático con tarjeta"}
                  </p>
                </div>

                {/* Límite de mecánicos destacado */}
                <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-2.5 text-xs font-semibold text-foreground">
                  <Users className="h-4 w-4 text-accent shrink-0" aria-hidden />
                  <span>
                    {typeof plan.limiteMecanicos === "number"
                      ? `Hasta ${plan.limiteMecanicos} mecánicos / usuarios`
                      : "Mecánicos y usuarios ilimitados"}
                  </span>
                </div>

                {/* Lista de Características */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Incluye:
                  </span>
                  <ul className="space-y-2">
                    {plan.caracteristicas.map((caract, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs leading-snug text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" aria-hidden />
                        <span>{caract}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Botón de Contratación */}
              <div className="pt-6 mt-6 border-t border-border/50">
                {esDueno ? (
                  <button
                    type="button"
                    onClick={() => handleSuscribir(plan.id)}
                    disabled={Boolean(planCargando) || cargandoCancelar}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-xs font-black shadow-lg transition-all active:scale-98 disabled:opacity-50 cursor-pointer ${
                      plan.destacado
                        ? "bg-accent text-accent-foreground hover:brightness-110 shadow-accent/20"
                        : "bg-foreground text-background hover:opacity-90"
                    }`}
                  >
                    {estaCargando ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        <span>Conectando...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" aria-hidden />
                        <span>
                          {modalidad === "un_mes"
                            ? `Pagar 1 Mes ${plan.nombre.replace("Plan ", "")}`
                            : `Suscribirme a ${plan.nombre.replace("Plan ", "")}`}
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <p className="text-center text-[11px] text-muted-foreground italic">
                    Acción reservada al dueño
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pie de Garantía y Seguridad */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 text-center space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-accent" aria-hidden />
            <span>Pago seguro con Mercado Pago</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden />
            <span>Sin contratos ni permanencia</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <Wallet className="h-4 w-4 text-accent" aria-hidden />
            <span>Dinero en cuenta o tarjeta</span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/80 max-w-md mx-auto">
          Podés cambiar de plan o cancelar en cualquier momento desde esta misma pantalla sin cargos adicionales.
        </p>
      </div>
    </div>
  );
}
