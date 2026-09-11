import Link from "next/link";
import { CreditCard, ArrowRight, ShieldCheck, CheckCircle2, Clock, AlertTriangle, Sparkles } from "lucide-react";
import { formatearFecha, formatearMoneda, type Idioma } from "@/lib/i18n";
import {
  calcularEstadoSuscripcion,
  obtenerConfigPlan,
  type EstadoSuscripcionCalculado,
  type PlanId,
} from "@/lib/suscripcion";

interface SuscripcionConfigProps {
  taller: {
    plan?: string | null;
    estado_suscripcion?: string | null;
    trial_fin?: string | null;
    suscripcion_fin?: string | null;
    mp_subscription_status?: string | null;
    idioma?: string | null;
  };
  esDueno: boolean;
}

export function SuscripcionConfig({ taller, esDueno }: SuscripcionConfigProps) {
  const estadoCalculado: EstadoSuscripcionCalculado = calcularEstadoSuscripcion(taller);
  const { estado, enTrial, trialVencido, diasRestantesTrial, plan, nombrePlan } = estadoCalculado;
  const configPlan = obtenerConfigPlan((plan as PlanId) || "pro");

  return (
    <section className="tarjeta space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
            <CreditCard className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <h2 className="t-seccion">Suscripción & Mercado Pago</h2>
            <p className="text-caption text-muted-foreground">
              Plan activo y facturación recurrente de tu taller
            </p>
          </div>
        </div>

        {/* Badge de estado */}
        {estado === "activa" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-black text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            ACTIVA
          </span>
        ) : enTrial ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/30 px-2.5 py-1 text-[11px] font-black text-accent">
            <Clock className="h-3 w-3" />
            PRUEBA ({diasRestantesTrial}d)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 border border-destructive/30 px-2.5 py-1 text-[11px] font-black text-destructive">
            <AlertTriangle className="h-3 w-3" />
            {trialVencido ? "VENCIDA" : "INACTIVA"}
          </span>
        )}
      </div>

      {/* Detalle del Plan Actual */}
      <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Plan en curso
            </span>
            <p className="text-sm font-black text-foreground">
              {nombrePlan}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Importe
            </span>
            <p className="text-sm font-black text-foreground tabular">
              {formatearMoneda(configPlan.precioARS, "ARS", "es")}
              <span className="text-xs font-normal text-muted-foreground">/mes</span>
            </p>
          </div>
        </div>

        {/* Fechas / Vigencia */}
        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          {estado === "activa" && taller.suscripcion_fin ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                Próxima renovación: {formatearFecha(taller.suscripcion_fin, (taller.idioma as Idioma) || "es", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
          ) : enTrial ? (
            <div className="flex items-center gap-1.5 text-accent font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>7 días de prueba completa sin cargo</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-destructive font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Elegí un plan para continuar sin interrupciones</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
            <ShieldCheck className="h-3 w-3 text-accent" />
            <span>Mercado Pago Oficial</span>
          </div>
        </div>
      </div>

      {/* Botón de acceso a cambiar de plan o gestionar */}
      <div className="pt-1">
        {esDueno ? (
          <Link
            href="/suscripcion"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground px-4 py-2.5 text-xs font-black shadow-md hover:brightness-110 active:scale-98 transition-all"
          >
            <span>Gestionar Suscripción y Cambiar de Plan</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <p className="text-center text-[11px] text-muted-foreground italic">
            Solo el dueño del taller puede cambiar de plan o gestionar pagos.
          </p>
        )}
      </div>
    </section>
  );
}
