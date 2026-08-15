"use client";

import { useReducedMotion, useScroll } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const SCRUB_FRACTION = 0.72;

export function VideoBackdrop() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [esMobile, setEsMobile] = useState(false);
  const [videoListo, setVideoListo] = useState(false);

  const target = useRef(0);
  const current = useRef(0);
  const isSeeking = useRef(false);
  const rafId = useRef<number | null>(null);

  const { scrollY } = useScroll();

  // Detección de mobile/touch para optimización de decodificador
  useEffect(() => {
    const checkMobile = () => {
      setEsMobile(window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduceMotion) return;

    // En mobile: reproducir en loop cinematográfico fluido y suave
    if (esMobile) {
      v.loop = true;
      v.muted = true;
      v.playsInline = true;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setVideoListo(true))
          .catch(() => {
            // Silently fallback if autoplay is restricted
          });
      }
      return;
    }

    // En desktop: scrub reactivo por scroll optimizado para evitar saturar el decoder
    v.pause();

    const spanFor = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return Math.max(1, max * SCRUB_FRACTION);
    };
    let span = spanFor();

    const remeasure = () => {
      span = spanFor();
    };
    window.addEventListener("resize", remeasure, { passive: true });
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.documentElement);

    const onSeeked = () => {
      isSeeking.current = false;
    };
    v.addEventListener("seeked", onSeeked);

    // Bucle de renderizado animado inteligente: solo corre cuando hay movimiento
    const tick = () => {
      const d = v.duration;
      if (d && Number.isFinite(d)) {
        const delta = target.current - current.current;
        
        // Suavizado cinemático
        current.current += delta * 0.1;

        // Solo solicitar seek si el decodificador no está saturado y el cambio es perceptible
        if (!isSeeking.current && !v.seeking) {
          const t = Math.min(d - 0.05, Math.max(0, current.current * d));
          if (Math.abs(v.currentTime - t) > 0.03) {
            isSeeking.current = true;
            if ("fastSeek" in v && typeof (v as unknown as { fastSeek: (time: number) => void }).fastSeek === "function") {
              (v as unknown as { fastSeek: (time: number) => void }).fastSeek(t);
            } else {
              v.currentTime = t;
            }
          }
        }

        // Desvanecimiento suave al fondo oscuro al final del documento
        if (wrapRef.current) {
          const opacidad = current.current > 0.9 ? Math.max(0, (1 - current.current) / 0.1) : 1;
          wrapRef.current.style.opacity = String(opacidad);
        }

        // Si todavía hay movimiento residual, continuar animando
        if (Math.abs(delta) > 0.001) {
          rafId.current = requestAnimationFrame(tick);
        } else {
          rafId.current = null;
        }
      }
    };

    const unsub = scrollY.on("change", (y) => {
      target.current = Math.min(1, Math.max(0, y / span));
      // Despertar el tick si estaba inactivo
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(tick);
      }
    });

    return () => {
      unsub();
      window.removeEventListener("resize", remeasure);
      ro.disconnect();
      v.removeEventListener("seeked", onSeeked);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [reduceMotion, scrollY, esMobile]);

  return (
    <div aria-hidden className="fixed inset-0 -z-10 bg-[#0a0a0a] overflow-hidden pointer-events-none">
      <div 
        ref={wrapRef} 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          transform: "translate3d(0, 0, 0)",
          backfaceVisibility: "hidden",
        }}
      >
        {reduceMotion ? (
          <Image
            src="/img/gtr-noche.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[58%_center]"
          />
        ) : (
          <video
            ref={videoRef}
            className="h-full w-full object-cover object-[58%_center] transition-opacity duration-500"
            src="/video/hero-scrub.mp4"
            poster="/img/gtr-noche.jpg"
            muted
            playsInline
            autoPlay={esMobile}
            loop={esMobile}
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onLoadedData={() => setVideoListo(true)}
            style={{
              opacity: videoListo ? 1 : 0.85,
              transform: "translate3d(0, 0, 0)",
              willChange: "transform, opacity",
            }}
          />
        )}

        {/* Gradiente radial para enmascarar marca de agua y acentuar el vehículo */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(38% 42% at 100% 100%, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.55) 55%, transparent 78%)",
          }}
        />
      </div>

      {/* Gradiente de contraste para legibilidad óptima de tipografía en desktop y móvil */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-[#0a0a0a]/30 sm:bg-gradient-to-r sm:from-[#0a0a0a]/95 sm:via-[#0a0a0a]/50 sm:to-transparent" />
    </div>
  );
}
