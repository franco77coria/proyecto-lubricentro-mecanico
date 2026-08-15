"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface OdometroNumeroProps {
  valor: number;
  formato?: "km" | "pesos" | "entero";
  className?: string;
}

export function OdometroNumero({
  valor,
  formato = "entero",
  className,
}: OdometroNumeroProps) {
  const [displayValor, setDisplayValor] = useState(0);

  useEffect(() => {
    let inicio = 0;
    const duracion = 800; // ms
    const pasos = 30;
    const incremento = valor / pasos;
    const intervalo = duracion / pasos;

    const timer = setInterval(() => {
      inicio += incremento;
      if (inicio >= valor) {
        setDisplayValor(valor);
        clearInterval(timer);
      } else {
        setDisplayValor(Math.floor(inicio));
      }
    }, intervalo);

    return () => clearInterval(timer);
  }, [valor]);

  const formatear = (num: number) => {
    if (formato === "pesos") {
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(num);
    }
    if (formato === "km") {
      return `${new Intl.NumberFormat("es-AR").format(num)} km`;
    }
    return new Intl.NumberFormat("es-AR").format(num);
  };

  return (
    <span
      className={cn(
        "font-mono font-bold tabular-nums tracking-tight text-foreground transition-all",
        className,
      )}
    >
      {formatear(displayValor)}
    </span>
  );
}
