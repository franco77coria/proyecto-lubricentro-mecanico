"use client";

import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

export function BotonVolverTablero({
  texto = "Volver al Tablero",
  className = "",
  variante = "inline",
}: {
  texto?: string;
  className?: string;
  variante?: "inline" | "boton";
}) {
  if (variante === "boton") {
    return (
      <Link
        href="/tablero"
        className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-xs transition-all hover:bg-muted/80 hover:border-accent/40 active:scale-95 ${className}`}
      >
        <ArrowLeft className="h-4 w-4 text-accent shrink-0" />
        <span>{texto}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/tablero"
      className={`inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95 transition-all group ${className}`}
    >
      <ArrowLeft className="h-4 w-4 text-accent transition-transform group-hover:-translate-x-0.5 shrink-0" />
      <span>{texto}</span>
    </Link>
  );
}
