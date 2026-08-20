"use client";

import { createContext, useContext, useMemo, useOptimistic, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import type { DiccionarioTraduccion, Idioma, Moneda } from "./types";
import { formatearFecha, formatearMoneda, formatearNumero, localeDe, obtenerDiccionario } from "./index";
import { guardarIdiomaMoneda } from "@/lib/actions/config";

interface I18nContextType {
  idioma: Idioma;
  moneda: Moneda;
  t: DiccionarioTraduccion;
  /** Si el cambio todavía está viajando al servidor. */
  guardando: boolean;
  cambiarIdioma: (nuevo: Idioma) => void;
  cambiarMoneda: (nueva: Moneda) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Idioma y moneda del TALLER, no del navegador.
 *
 * Antes esto vivía en localStorage y nada más: las columnas `taller.idioma` y
 * `taller.moneda` que agregó la migración 0041 no las escribía nadie. El
 * resultado era una configuración por dispositivo — el dueño ponía portugués
 * en su compu y su empleado, desde el celular, seguía viendo español. Y las
 * cotizaciones que se le mandaban al cliente salían en la moneda del aparato
 * que las generó.
 *
 * Ahora el valor viene del servidor (lo lee el layout desde `taller`) y al
 * cambiarlo se persiste ahí. `useOptimistic` hace que el botón responda en el
 * acto sin volver a introducir un estado local que pueda quedar desfasado del
 * de la base.
 */
export function I18nProvider({
  children,
  idiomaInicial = "es",
  monedaInicial = "ARS",
}: {
  children: ReactNode;
  idiomaInicial?: Idioma;
  monedaInicial?: Moneda;
}) {
  const router = useRouter();
  const [guardando, iniciar] = useTransition();

  const [idioma, verIdioma] = useOptimistic(idiomaInicial);
  const [moneda, verMoneda] = useOptimistic(monedaInicial);

  const cambiarIdioma = (nuevo: Idioma) => {
    iniciar(async () => {
      verIdioma(nuevo);
      await guardarIdiomaMoneda({ idioma: nuevo });
      router.refresh();
    });
  };

  const cambiarMoneda = (nueva: Moneda) => {
    iniciar(async () => {
      verMoneda(nueva);
      await guardarIdiomaMoneda({ moneda: nueva });
      router.refresh();
    });
  };

  const t = obtenerDiccionario(idioma);

  return (
    <I18nContext.Provider value={{ idioma, moneda, t, guardando, cambiarIdioma, cambiarMoneda }}>
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
      guardando: false,
      cambiarIdioma: () => {},
      cambiarMoneda: () => {},
    };
  }
  return ctx;
}

/**
 * Formateo de plata, fechas y números para componentes cliente.
 *
 * Cada pantalla tenía su propio `money()` con "es-AR" y "ARS" adentro. Eran
 * más de cincuenta copias de la misma regla, y todas decían Argentina.
 * Con esto hay una sola, y sale de lo que el taller tenga configurado.
 */
export function useFormato() {
  const { idioma, moneda } = useI18n();

  return useMemo(
    () => ({
      money: (n: number) => formatearMoneda(n, moneda, idioma),
      numero: (n: number) => formatearNumero(n, idioma),
      fecha: (v: string | Date, opciones?: Intl.DateTimeFormatOptions) =>
        formatearFecha(v, idioma, opciones),
      locale: localeDe(idioma),
    }),
    [idioma, moneda],
  );
}
