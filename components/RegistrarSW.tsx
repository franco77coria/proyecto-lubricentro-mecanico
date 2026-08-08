"use client";

import { useEffect } from "react";

/**
 * Registra el service worker.
 *
 * Solo en producción: en desarrollo un service worker sirve archivos viejos y
 * hace perder tiempo persiguiendo cambios que sí se aplicaron pero no se ven.
 */
export function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    // Después del load: registrarlo durante la carga compite por ancho de
    // banda con lo que el usuario está esperando ver.
    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch((e) => {
        console.warn("[sw] no se pudo registrar:", e.message);
      });
    };

    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });
  }, []);

  return null;
}
