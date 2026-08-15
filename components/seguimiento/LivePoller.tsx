"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LivePoller({ estado }: { estado: string }) {
  const router = useRouter();
  const estaCerrado = ["cerrado", "entregado", "anulado"].includes(estado);

  useEffect(() => {
    if (estaCerrado) return;

    // Polling suave cada 5 segundos si la ventana está activa y en foco
    const intervalo = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 6000);

    return () => clearInterval(intervalo);
  }, [estaCerrado, router]);

  return null;
}
