"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { Mic } from "lucide-react";
import { localeDe } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/I18nContext";

/**
 * La Web Speech API no está en los tipos del DOM (sigue siendo un borrador y
 * en Chrome va con prefijo). Se declara acá el pedazo que se usa: son cinco
 * campos, y tenerlos tipados es lo que hace que un error de nombre lo agarre
 * el compilador en vez del taller.
 */
interface ResultadoVoz {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface ErrorVoz {
  error: string;
}

interface ReconocimientoVoz {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((evento: ResultadoVoz) => void) | null;
  onerror: ((evento: ErrorVoz) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type ConstructorVoz = new () => ReconocimientoVoz;

function constructorDeVoz(): ConstructorVoz | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: ConstructorVoz;
    webkitSpeechRecognition?: ConstructorVoz;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** El soporte del navegador no cambia mientras la pestaña vive, así que no
 *  hay a qué suscribirse. Va por useSyncExternalStore y no por un efecto para
 *  no arrancar mostrando el botón y esconderlo un render después. */
const sinSuscripcion = () => () => {};
const haySoporte = () => constructorDeVoz() !== undefined;
/** En el servidor se asume que sí: es el caso mayoritario y evita que el botón
 *  aparezca de golpe al hidratar. */
const haySoporteEnServidor = () => true;

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
  const soportado = useSyncExternalStore(sinSuscripcion, haySoporte, haySoporteEnServidor);
  const reconocimientoRef = useRef<ReconocimientoVoz | null>(null);

  useEffect(() => {
    const SpeechRecognition = constructorDeVoz();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang =
      localeDe(idioma);

    recognition.onstart = () => {
      setEscuchando(true);
    };

    recognition.onresult = (event: ResultadoVoz) => {
      const transcripcion = event.results[0][0].transcript;
      if (transcripcion) {
        onTextoTranscrito(transcripcion);
      }
    };

    recognition.onerror = (event: ErrorVoz) => {
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
