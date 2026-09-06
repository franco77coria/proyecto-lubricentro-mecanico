"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, CheckCheck } from "lucide-react";

interface MensajeTemplate {
  id: string;
  etiqueta: string;
  titulo: string;
  cuerpo: string;
  hora: string;
  badge: string;
}

const TEMPLATES: MensajeTemplate[] = [
  {
    id: "ingreso",
    etiqueta: "Auto Ingresado",
    titulo: "Ingreso & Inspección",
    cuerpo:
      "¡Hola Carlos! Tu Toyota Hilux (AE789CD) ya ingresó a Fosa 2 en Lubricentro Los Amigos. Ya arrancamos con el service programado. Podés seguir el avance en tiempo real y ver las fotos acá: https://fierros.app/seguimiento/tk_883f9",
    hora: "10:14",
    badge: "En Fosa",
  },
  {
    id: "presupuesto",
    etiqueta: "Presupuesto Listo",
    titulo: "Presupuesto para Aprobar",
    cuerpo:
      "Carlos, revisamos el tren delantero y vimos pastillas de freno al 25%. Te armamos el presupuesto con repuesto original: $84.500. Podés aprobarlo con 1 tap desde tu celular sin tener que venir hasta acá: https://fierros.app/seguimiento/tk_883f9",
    hora: "11:30",
    badge: "Presupuesto",
  },
  {
    id: "listo",
    etiqueta: "Auto Listo",
    titulo: "Listo para Retirar",
    cuerpo:
      "¡Todo listo, Carlos! Tu Hilux ya terminó el service completo (aceite 5W-30 + los 4 filtros cambiados). Ya podés pasar a retirarla cuando gustes. Adjuntamos comprobante y detalle de garantía: https://fierros.app/seguimiento/tk_883f9",
    hora: "12:45",
    badge: "Terminado",
  },
];

export function InteractiveWhatsAppPreview() {
  const [activoId, setActivoId] = useState("ingreso");
  const template = TEMPLATES.find((t) => t.id === activoId) || TEMPLATES[0];

  return (
    <section className="seccion">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
        <div>
          <p className="t-eyebrow">Cero Teléfono Sonando</p>
          <h2 className="t-titulo mt-6 text-balance text-white">
            Avisos por WhatsApp en 1 clic. Tus clientes tranquilos, tu taller enfocado.
          </h2>
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-white/70">
            Cada vez que cambia el estado de una orden o terminás un presupuesto, el sistema
            prepara el mensaje exacto con el link de seguimiento y fotos. Un clic y se envía por WhatsApp Web o desde el celular.
          </p>

          {/* Botones selectores de plantillas */}
          <div className="mt-8 space-y-2.5">
            <p className="text-xs uppercase tracking-wider font-bold text-white/50 mb-3">
              Elegí una situación para ver el mensaje automático:
            </p>
            {TEMPLATES.map((t) => {
              const isSel = t.id === activoId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActivoId(t.id)}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isSel
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                      : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] text-white/70 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare
                      className={`h-4 w-4 ${isSel ? "text-emerald-400" : "text-white/40"}`}
                    />
                    <span
                      className={`text-sm font-bold ${isSel ? "text-white" : "text-white/80"}`}
                    >
                      {t.titulo}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      isSel
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/[0.05] text-white/40"
                    }`}
                  >
                    {t.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Simulación de Celular con WhatsApp */}
        <div className="relative mx-auto w-full max-w-sm rounded-[2.5rem] bg-[#0b0b0f] p-3 border-2 border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
          {/* Cámara Notch */}
          <div className="mx-auto h-4 w-28 rounded-full bg-black/60 mb-2" />

          {/* Pantalla de WhatsApp */}
          <div className="rounded-[2rem] bg-[#0b141a] overflow-hidden border border-white/[0.05] flex flex-col h-[480px]">
            {/* WhatsApp Header */}
            <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                  LP
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">
                    Lubricentro Los Amigos
                  </p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    En línea (Fierros Bot)
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 bg-[#0b141a] bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px] flex flex-col justify-end">
              <AnimatePresence mode="wait">
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#005c4b] rounded-2xl rounded-tr-xs p-3 text-white text-xs sm:text-[13px] shadow-md space-y-2 relative"
                >
                  <p className="leading-relaxed whitespace-pre-line">{template.cuerpo}</p>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-white/60">
                    <span>{template.hora}</span>
                    <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Input simulado */}
            <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
              <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-1.5 text-xs text-white/50">
                Mensaje automático listo...
              </div>
              <div className="h-8 w-8 rounded-full bg-[#00a884] flex items-center justify-center text-black">
                <Send className="h-3.5 w-3.5 fill-black" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
