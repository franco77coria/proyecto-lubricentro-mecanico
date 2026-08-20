"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "dark" | "light";

/**
 * Quién manda sobre el tema.
 *
 * El script inline del layout raíz ya dejó el tema aplicado en `<html>` antes
 * de que se pinte nada — para eso existe, para evitar el destello blanco. Así
 * que el DOM ES la fuente de verdad y este botón la lee, en vez de tener su
 * propio estado que arranca en "light" y se corrige después de montar (eso
 * causaba un render de más y dejaba el botón mostrando el tema equivocado por
 * un instante).
 *
 * Los suscriptores se avisan a mano porque el cambio lo dispara este mismo
 * componente: no hay un evento del navegador al que engancharse.
 */
const oyentes = new Set<() => void>();

function suscribir(alCambiar: () => void) {
  oyentes.add(alCambiar);
  return () => {
    oyentes.delete(alCambiar);
  };
}

function temaActual(): Tema {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/** En el servidor no hay DOM. Se asume claro, que es el default de la app, y
 *  el primer render del cliente ya trae el valor real. */
function temaEnServidor(): Tema {
  return "light";
}

export function SelectorTema({ className = "" }: { className?: string }) {
  const tema = useSyncExternalStore(suscribir, temaActual, temaEnServidor);
  const montado = useSyncExternalStore(suscribir, () => true, () => false);

  const aplicarTema = useCallback((nuevoTema: Tema) => {
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
    oyentes.forEach((avisar) => avisar());
  }, []);

  function toggleTema() {
    const siguiente: Tema = tema === "dark" ? "light" : "dark";
    localStorage.setItem("fierros-tema", siguiente);
    aplicarTema(siguiente);
  }

  if (!montado) {
    return (
      <div className={`h-6 w-6 rounded-full bg-muted/40 animate-pulse ${className}`} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTema}
      aria-label={`Cambiar a modo ${tema === "dark" ? "claro" : "oscuro"}`}
      title={`Cambiar a modo ${tema === "dark" ? "claro" : "oscuro"}`}
      className={`inline-flex h-6 items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 text-[10px] font-bold text-foreground transition-all hover:bg-muted/80 active:scale-95 ${className}`}
    >
      {tema === "dark" ? (
        <>
          <Sun className="h-3 w-3 text-amber-400 shrink-0" />
          <span>Claro</span>
        </>
      ) : (
        <>
          <Moon className="h-3 w-3 text-indigo-500 shrink-0" />
          <span>Oscuro</span>
        </>
      )}
    </button>
  );
}
