"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function SelectorTema({ className = "" }: { className?: string }) {
  const [tema, setTema] = useState<"dark" | "light">("dark");
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    const guardado = localStorage.getItem("fierros-tema") as "dark" | "light" | null;
    if (guardado) {
      setTema(guardado);
      aplicarTema(guardado);
    } else {
      // Default a dark
      setTema("dark");
      aplicarTema("dark");
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
      <div className={`h-9 w-9 rounded-xl bg-muted/50 animate-pulse ${className}`} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTema}
      aria-label={`Cambiar a modo ${tema === "dark" ? "claro" : "oscuro"}`}
      title={`Cambiar a modo ${tema === "dark" ? "claro" : "oscuro"}`}
      className={`flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 px-3 py-2 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95 shadow-sm backdrop-blur-sm ${className}`}
    >
      {tema === "dark" ? (
        <>
          <Sun className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Modo Claro</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-sky-400 shrink-0" />
          <span className="hidden sm:inline">Modo Oscuro</span>
        </>
      )}
    </button>
  );
}
