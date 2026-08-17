"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function SelectorTema({ className = "" }: { className?: string }) {
  const [tema, setTema] = useState<"dark" | "light">("light");
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    const guardado = localStorage.getItem("fierros-tema") as "dark" | "light" | null;
    if (guardado) {
      setTema(guardado);
      aplicarTema(guardado);
    } else {
      // Default a light (modo claro)
      setTema("light");
      aplicarTema("light");
    }
  }, []);

  function aplicarTema(nuevoTema: "dark" | "light") {
    const root = document.documentElement;
    if (nuevoTema === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    }
  }

  function toggleTema() {
    const siguiente = tema === "dark" ? "light" : "dark";
    setTema(siguiente);
    localStorage.setItem("fierros-tema", siguiente);
    aplicarTema(siguiente);
  }

  if (!montado) {
    return (
      <div className={`h-8 w-8 rounded-xl bg-muted/50 animate-pulse ${className}`} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTema}
      aria-label={`Cambiar a modo ${tema === "dark" ? "claro" : "oscuro"}`}
      title={`Cambiar a modo ${tema === "dark" ? "claro" : "oscuro"}`}
      className={`inline-flex h-8 items-center gap-1.5 rounded-xl border border-border/70 bg-card/80 px-2.5 text-[11px] font-bold text-foreground transition-all hover:bg-muted active:scale-95 shadow-xs ${className}`}
    >
      {tema === "dark" ? (
        <>
          <Sun className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>Claro</span>
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>Oscuro</span>
        </>
      )}
    </button>
  );
}
