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
} from "lucide-react";
import { iniciarSuscripcionAction, cancelarSuscripcionAction } from "@/lib/actions/suscripcion";
import type { EstadoSuscripcionCalculado } from "@/lib/suscripcion";
import { formatearMoneda } from "@/lib/i18n";

interface PanelSuscripcionProps {
  estadoCalculado: EstadoSuscripcionCalculado;
  precioARS: number;
  esDueno: boolean;
  nombreTaller: string;
  suscripcionFin?: string | null;
  exitoReciente?: boolean;
}

export function PanelSuscripcion({
  estadoCalculado,
  precioARS,
  esDueno,
  nombreTaller,
  suscripcionFin,
  exitoReciente,
}: PanelSuscripcionProps) {
  const [modoCargando, setModoCargando] = useState<"recurrente" | "un_mes" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { estado, enTrial, trialVencido, diasRestantesTrial, tieneAcceso } = estadoCalculado;

  async function handleSuscribir(modo: "recurrente" | "un_mes") {
    setModoCargando(modo);
    setErrorMsg(null);

    try {
      const res = await iniciarSuscripcionAction(modo);
      if (res.error) {
        setErrorMsg(res.error);
        setModoCargando(null);
        return;
      }

      if (res.initPoint) {
        window.location.href = res.initPoint;
      } else {
        setErrorMsg("No se recibió la URL de pago de Mercado Pago.");
        setModoCargando(null);
      }
    } catch {
      setErrorMsg("Ocurrió un error al conectar con Mercado Pago.");
      setModoCargando(null);
    }
  }

  const [cargandoCancelar, setCargandoCancelar] = useState(false);

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

  const caracteristicas = [
    "Órdenes de trabajo ilimitadas en vivo",
    "Escaneo instantáneo de cédula (PDF417 y QR)",
    "Peritaje de carrocería con Inteligencia Artificial",
    "Control de stock con libro mayor inmutable",
    "Portal web para clientes con tracking en tiempo real",
    "Avisos automáticos de service por WhatsApp",
    "Gestión de equipo: Dueños, Encargados y Mecánicos",
    "Soporte prioritario y actualizaciones continuas",
  ];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Header del Taller */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1 text-xs font-bold text-accent">
          <Wrench className="h-3.5 w-3.5" aria-hidden />
          <span>{nombreTaller}</span>
        </div>
        <h1 className="text-display text-2xl sm:text-3xl font-black text-foreground">
          Plan Taller Pro
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Gestioná tu taller o lubricentro sin límites operativos, con trazabilidad completa y cobro seguro.
        </p>
      </div>

      {/* Tarjeta de Estado Actual */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Estado de tu cuenta
            </p>
            <div className="flex items-center gap-2 mt-1">
              {estado === "activa" ? (
                <>
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                  <h2 className="text-lg font-black text-emerald-400">Suscripción Activa</h2>
                </>
              ) : enTrial ? (
                <>
                  <Clock className="h-5 w-5 text-accent" aria-hidden />
                  <h2 className="text-lg font-black text-accent">
                    Período de Prueba ({diasRestantesTrial} {diasRestantesTrial === 1 ? "día restante" : "días restantes"})
                  </h2>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
                  <h2 className="text-lg font-black text-destructive">
                    {trialVencido ? "Período de Prueba Finalizado" : "Suscripción Inactiva"}
                  </h2>
                </>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-caption text-muted-foreground">Precio Mensual</span>
            <p className="tabular text-2xl font-black text-foreground">
              {formatearMoneda(precioARS, "ARS", "es")}
              <span className="text-xs font-normal text-muted-foreground"> /mes</span>
            </p>
          </div>
        </div>

        {/* Mensajes de Contexto */}
        {exitoReciente && (
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 text-xs text-foreground leading-relaxed animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="font-bold text-emerald-400">¡Pago acreditado exitosamente!</p>
              <p className="text-muted-foreground mt-0.5">
                Tu suscripción mensual a Plan Taller Pro ya está activa en Mercado Pago. Todas las funciones del taller se encuentran 100% habilitadas.
              </p>
            </div>
          </div>
        )}

        {enTrial && !exitoReciente && (
          <div className="flex items-start gap-3 rounded-2xl bg-accent/10 border border-accent/20 p-4 text-xs text-foreground leading-relaxed">
            <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="font-bold text-accent">¡Disfrutá de 7 días gratis sin cargo!</p>
              <p className="text-muted-foreground mt-0.5">
                Podés usar todas las funciones del taller sin poner una tarjeta de crédito. Al finalizar los 7 días, podrás activar tu suscripción mensual para no interrumpir el servicio.
              </p>
            </div>
          </div>
        )}

        {trialVencido && !tieneAcceso && (
          <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-foreground leading-relaxed">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="font-bold text-destructive">Tu prueba gratuita ha finalizado.</p>
              <p className="text-muted-foreground mt-0.5">
                Tus datos históricos y órdenes están guardados de forma segura. Activá tu plan mensual con Mercado Pago para reactivar el acceso a las funciones operativas del taller.
              </p>
            </div>
          </div>
        )}

        {estado === "activa" && suscripcionFin && (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-400">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
            <span>Próxima fecha de renovación: {new Date(suscripcionFin).toLocaleDateString("es-AR")}</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl bg-destructive/15 border border-destructive/30 p-3 text-xs font-semibold text-destructive">
            {errorMsg}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="pt-2 space-y-3">
          {esDueno ? (
            estado !== "activa" ? (
              <div className="space-y-3">
                {/* Opción 1: Dinero en cuenta y todos los medios (Checkout Pro - estilo Cuánto Sale) */}
                <button
                  type="button"
                  onClick={() => handleSuscribir("un_mes")}
                  disabled={Boolean(modoCargando) || cargandoCancelar}
                  className="w-full inline-flex items-center justify-between gap-3 rounded-2xl bg-accent px-5 py-4 text-sm font-black text-accent-foreground shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {modoCargando === "un_mes" ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    ) : (
                      <CreditCard className="h-5 w-5" aria-hidden />
                    )}
                    <div className="text-left">
                      <span className="block text-sm font-extrabold">Pagar 1 mes puntual</span>
                      <span className="block text-xs font-semibold opacity-90">
                        {formatearMoneda(precioARS, "ARS", "es")} ARS
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-black/20 dark:bg-white/20 px-3 py-1.5 rounded-xl text-right">
                    Dinero en cuenta / Débito / Crédito
                  </span>
                </button>

                {/* Opción 2: Suscripción automática mensual (Débito automático) */}
                <button
                  type="button"
                  onClick={() => handleSuscribir("recurrente")}
                  disabled={Boolean(modoCargando) || cargandoCancelar}
                  className="w-full inline-flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card hover:bg-muted/50 px-5 py-3.5 text-xs font-bold text-foreground shadow-sm hover:border-accent/40 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {modoCargando === "recurrente" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden />
                    ) : (
                      <Sparkles className="h-4 w-4 text-accent" aria-hidden />
                    )}
                    <div className="text-left">
                      <span className="block font-bold">Débito automático mensual</span>
                      <span className="block text-caption text-muted-foreground">
                        Suscripción recurrente con tarjeta
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Sin vencimientos
                  </span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCancelar}
                disabled={cargandoCancelar}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-3 text-xs font-bold text-destructive hover:bg-destructive/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {cargandoCancelar ? "Cancelando..." : "Cancelar Débito Automático"}
              </button>
            )
          ) : (
            <p className="text-center text-xs text-muted-foreground italic py-2">
              Solo el dueño del taller puede activar o modificar la suscripción del negocio.
            </p>
          )}

          <div className="flex items-center justify-center gap-2 text-caption text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-accent" aria-hidden />
            <span>Pago seguro procesado mediante Mercado Pago</span>
          </div>
        </div>
      </div>

      {/* Qué incluye el Plan Pro */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-lg space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
          Todo lo que incluye tu Plan Taller Pro
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {caracteristicas.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden />
              <span className="text-xs sm:text-sm font-medium leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
