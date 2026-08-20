"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LivePoller({ estado }: { estado: string }) {
  const router = useRouter();
  const estaCerrado = ["cerrado", "entregado", "anulado"].includes(estado);

  useEffect(() => {
    if (estaCerrado) return;

    // Cada 30 segundos, no cada 6.
    //
    // Esta página es la única sin autenticar del sistema y cada refresh cuesta
    // una consulta más las URLs firmadas de las fotos. A 6 segundos, una
    // pestaña abierta eran ~600 pedidos por hora, y con un token filtrado
    // alcanzaba para sostener carga sola. El cliente que espera su auto no
    // necesita medio minuto de precisión.
    const intervalo = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 30_000);

    // Y no para siempre: después de dos horas sin que el estado cambie, el
    // auto no se está entregando en este momento. Se corta y el cliente
    // refresca a mano si quiere.
    const corte = setTimeout(() => clearInterval(intervalo), 2 * 60 * 60 * 1000);

    return () => {
      clearInterval(intervalo);
      clearTimeout(corte);
    };
  }, [estaCerrado, router]);

  return null;
}
