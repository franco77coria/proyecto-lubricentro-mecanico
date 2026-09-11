"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

const STORAGE_KEY = "fierros_consent_v1";

export function BannerCookies() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Revisar si el usuario ya definió su preferencia
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (!guardado) {
        // Breve retardo para no interferir con la carga inicial
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignorar errores de localStorage (ej. navegación privada estricta)
    }
  }, []);

  const aceptar = (tipo: "all" | "essential") => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tipo, fecha: new Date().toISOString() }));
    } catch {
      // noop
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Aviso de privacidad y cookies"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl border border-black/10 bg-white/95 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-100 text-orange-600">
              <Cookie className="h-4 w-4" />
            </span>
            <p className="text-sm font-bold text-zinc-950">Privacidad y Cookies</p>
          </div>
          <button
            type="button"
            onClick={() => aceptar("essential")}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md transition-colors"
            aria-label="Cerrar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-zinc-600">
          En Fierros utilizamos cookies y almacenamiento local estrictamente necesarios para autenticar tu taller de forma segura, recordar tus preferencias y garantizar el cumplimiento de la Ley 25.326. No vendemos tus datos a terceros.
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>
            Podés consultar nuestra{" "}
            <Link
              href="/legales/privacidad"
              className="font-semibold text-zinc-800 underline underline-offset-2 hover:text-orange-600"
            >
              Política de Privacidad
            </Link>{" "}
            y{" "}
            <Link
              href="/legales/cookies"
              className="font-semibold text-zinc-800 underline underline-offset-2 hover:text-orange-600"
            >
              Cookies
            </Link>
            .
          </span>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => aceptar("essential")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            Solo necesarias
          </button>
          <button
            type="button"
            onClick={() => aceptar("all")}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 shadow-sm transition-colors"
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </aside>
  );
}
