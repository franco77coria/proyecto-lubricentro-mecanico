"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { DiccionarioTraduccion, Idioma, Moneda } from "./types";
import { obtenerDiccionario } from "./index";

interface I18nContextType {
  idioma: Idioma;
  moneda: Moneda;
  t: DiccionarioTraduccion;
  cambiarIdioma: (nuevo: Idioma) => void;
  cambiarMoneda: (nueva: Moneda) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_IDIOMA_KEY = "fierros_idioma";
const STORAGE_MONEDA_KEY = "fierros_moneda";

export function I18nProvider({
  children,
  idiomaInicial = "es",
  monedaInicial = "ARS",
}: {
  children: ReactNode;
  idiomaInicial?: Idioma;
  monedaInicial?: Moneda;
}) {
  const [idioma, setIdioma] = useState<Idioma>(idiomaInicial);
  const [moneda, setMoneda] = useState<Moneda>(monedaInicial);

  useEffect(() => {
    const guardadoIdioma = localStorage.getItem(STORAGE_IDIOMA_KEY) as Idioma | null;
    const guardadaMoneda = localStorage.getItem(STORAGE_MONEDA_KEY) as Moneda | null;

    if (guardadoIdioma && (guardadoIdioma === "es" || guardadoIdioma === "en" || guardadoIdioma === "pt")) {
      setIdioma(guardadoIdioma);
    } else {
      // Auto-detección por navegador
      const browserLang = navigator.language.slice(0, 2);
      if (browserLang === "pt") setIdioma("pt");
      else if (browserLang === "en") setIdioma("en");
    }

    if (guardadaMoneda) {
      setMoneda(guardadaMoneda);
    }
  }, []);

  const cambiarIdioma = (nuevo: Idioma) => {
    setIdioma(nuevo);
    localStorage.setItem(STORAGE_IDIOMA_KEY, nuevo);
    document.cookie = `fierros_idioma=${nuevo}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const cambiarMoneda = (nueva: Moneda) => {
    setMoneda(nueva);
    localStorage.setItem(STORAGE_MONEDA_KEY, nueva);
    document.cookie = `fierros_moneda=${nueva}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const t = obtenerDiccionario(idioma);

  return (
    <I18nContext.Provider
      value={{
        idioma,
        moneda,
        t,
        cambiarIdioma,
        cambiarMoneda,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      idioma: "es" as Idioma,
      moneda: "ARS" as Moneda,
      t: obtenerDiccionario("es"),
      cambiarIdioma: () => {},
      cambiarMoneda: () => {},
    };
  }
  return ctx;
}
