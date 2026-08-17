"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";

interface BotonDictadoVozProps {
  onTextoTranscrito: (texto: string) => void;
  className?: string;
  placeholder?: string;
  tamano?: "sm" | "md" | "lg";
}

export function BotonDictadoVoz({
  onTextoTranscrito,
  className = "",
  tamano = "md",
}: BotonDictadoVozProps) {
  const { idioma } = useI18n();
  const [escuchando, setEscuchando] = useState(false);
  const [soportado, setSoportado] = useState(true);
  const reconocimientoRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSoportado(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang =
      idioma === "en" ? "en-US" : idioma === "pt" ? "pt-BR" : "es-AR";

    recognition.onstart = () => {
      setEscuchando(true);
    };

    recognition.onresult = (event: any) => {
      const transcripcion = event.results[0][0].transcript;
      if (transcripcion) {
        onTextoTranscrito(transcripcion);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("[DictadoVoz] error:", event.error);
      setEscuchando(false);
    };

    recognition.onend = () => {
      setEscuchando(false);
    };

    reconocimientoRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [idioma, onTextoTranscrito]);

  function toggleEscucha() {
    if (!reconocimientoRef.current) return;
    if (escuchando) {
      reconocimientoRef.current.stop();
      setEscuchando(false);
    } else {
      try {
        reconocimientoRef.current.start();
        setEscuchando(true);
      } catch (err) {
        console.warn("[DictadoVoz] no se pudo iniciar:", err);
      }
    }
  }

  if (!soportado) return null;

  const dimensiones =
    tamano === "sm"
      ? "h-9 w-9 text-xs"
      : tamano === "lg"
        ? "h-14 w-14 text-base"
        : "h-11 w-11 text-sm";

  return (
    <button
      type="button"
      onClick={toggleEscucha}
      aria-label={escuchando ? "Detener dictado por voz" : "Dictar por voz"}
      title={escuchando ? "Escuchando... hacé clic para parar" : "Dictar por voz (Modo Fosa)"}
      className={`relative grid shrink-0 place-items-center rounded-2xl transition-all active:scale-90 ${
        escuchando
          ? "bg-red-500 text-white shadow-lg shadow-red-500/40 ring-4 ring-red-400/30 animate-pulse"
          : "bg-muted/80 text-muted-foreground hover:bg-accent/10 hover:text-accent border border-border/80"
      } ${dimensiones} ${className}`}
    >
      {escuchando ? (
        <>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
          </span>
          <Mic className="h-5 w-5 animate-bounce" />
        </>
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  );
}
