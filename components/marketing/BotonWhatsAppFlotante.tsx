"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

function LogoWhatsApp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.79.98-.15.17-.3.19-.55.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.32-.02-.45s-.56-1.35-.77-1.85c-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.3-.23.25-.87.85-.87 2.08 0 1.23.89 2.41 1.02 2.58.12.16 1.76 2.68 4.26 3.76.6.26 1.06.41 1.42.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.07-.1-.23-.17-.48-.29" />
    </svg>
  );
}

export function BotonWhatsAppFlotante() {
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const [descartado, setDescartado] = useState(false);

  useEffect(() => {
    // Mostrar mensaje emergente a los 3 segundos
    const timer = setTimeout(() => {
      if (!descartado) {
        setMostrarMensaje(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [descartado]);

  const urlWhatsapp =
    "https://wa.me/5491163515966?text=" +
    encodeURIComponent("¡Hola! Quiero consultar y conocer más sobre el sistema Fierros para mi taller.");

  return (
    <div className="fixed bottom-6 right-5 sm:right-7 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {/* Mensaje de bienvenida flotante */}
      <AnimatePresence>
        {mostrarMensaje && !descartado && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto relative max-w-[260px] rounded-2xl border border-emerald-500/30 bg-[#121214]/95 p-3.5 shadow-2xl backdrop-blur-xl"
          >
            <button
              type="button"
              onClick={() => {
                setMostrarMensaje(false);
                setDescartado(true);
              }}
              className="absolute -top-2 -left-2 grid h-6 w-6 place-items-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 shadow-md"
              aria-label="Cerrar mensaje"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              ¿Tenés dudas sobre tu taller?
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-300">
              Escribinos directamente al WhatsApp y te mostramos cómo funciona en vivo.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón principal con logo oficial de WhatsApp */}
      <motion.a
        href={urlWhatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp al 1163515966"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="pointer-events-auto group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgb(37,211,102,0.45)] hover:shadow-[0_10px_35px_rgb(37,211,102,0.6)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/50"
      >
        {/* Radar ping effect */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping group-hover:hidden" />

        <LogoWhatsApp className="h-7 w-7 text-white drop-shadow-sm transition-transform group-hover:scale-110" />
      </motion.a>
    </div>
  );
}
