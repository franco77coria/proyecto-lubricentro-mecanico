import type { DiccionarioTraduccion, Idioma, Moneda } from "./types";
import { diccionarioEs } from "./diccionarios/es";
import { diccionarioEn } from "./diccionarios/en";
import { diccionarioPt } from "./diccionarios/pt";

export * from "./types";

const DICCIONARIOS: Record<Idioma, DiccionarioTraduccion> = {
  es: diccionarioEs,
  en: diccionarioEn,
  pt: diccionarioPt,
};

export const IDIOMAS_DISPONIBLES: { codigo: Idioma; nombre: string; bandera: string }[] = [
  { codigo: "es", nombre: "Español", bandera: "🇪🇸" },
  { codigo: "en", nombre: "English", bandera: "🇺🇸" },
  { codigo: "pt", nombre: "Português", bandera: "🇧🇷" },
];

export const MONEDAS_DISPONIBLES: { codigo: Moneda; simbolo: string; nombre: string }[] = [
  { codigo: "ARS", simbolo: "$", nombre: "Peso Argentino (ARS)" },
  { codigo: "USD", simbolo: "$", nombre: "US Dollar (USD)" },
  { codigo: "BRL", simbolo: "R$", nombre: "Real Brasileiro (BRL)" },
  { codigo: "MXN", simbolo: "$", nombre: "Peso Mexicano (MXN)" },
  { codigo: "EUR", simbolo: "€", nombre: "Euro (EUR)" },
  { codigo: "CLP", simbolo: "$", nombre: "Peso Chileno (CLP)" },
  { codigo: "COP", simbolo: "$", nombre: "Peso Colombiano (COP)" },
];

export function obtenerDiccionario(idioma: Idioma = "es"): DiccionarioTraduccion {
  return DICCIONARIOS[idioma] || diccionarioEs;
}

/**
 * El locale de Intl para un idioma.
 *
 * Estaba repetido dentro de cada formateador de este archivo y, peor, escrito
 * a mano como "es-AR" en más de cincuenta lugares de las pantallas. Un taller
 * de Brasil le mostraba pesos argentinos a su cliente por eso.
 */
export function localeDe(idioma: Idioma = "es"): string {
  return idioma === "en" ? "en-US" : idioma === "pt" ? "pt-BR" : "es-AR";
}

/** Miles con el separador del idioma. Para kilómetros y cantidades, que no
 *  llevan símbolo de moneda. */
export function formatearNumero(n: number, idioma: Idioma = "es"): string {
  return new Intl.NumberFormat(localeDe(idioma)).format(n || 0);
}

export function formatearMoneda(
  monto: number,
  moneda: Moneda = "ARS",
  idioma: Idioma = "es"
): string {
  const sinDecimales = moneda === "CLP" || moneda === "COP" || moneda === "ARS";
  const locale = localeDe(idioma);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: moneda,
      minimumFractionDigits: sinDecimales ? 0 : 2,
      maximumFractionDigits: sinDecimales ? 0 : 2,
    }).format(monto || 0);
  } catch {
    return `$ ${(monto || 0).toLocaleString(locale)}`;
  }
}

export function formatearFecha(
  fecha: string | Date,
  idioma: Idioma = "es",
  opciones?: Intl.DateTimeFormatOptions
): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const locale = localeDe(idioma);
  
  return new Intl.DateTimeFormat(locale, opciones ?? {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatearDistancia(km: number, idioma: Idioma = "es"): string {
  return `${formatearNumero(km, idioma)} km`;
}
