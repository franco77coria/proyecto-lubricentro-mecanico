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

export function formatearMoneda(
  monto: number,
  moneda: Moneda = "ARS",
  idioma: Idioma = "es"
): string {
  const sinDecimales = moneda === "CLP" || moneda === "COP" || moneda === "ARS";
  const locale = idioma === "en" ? "en-US" : idioma === "pt" ? "pt-BR" : "es-AR";

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
  const locale = idioma === "en" ? "en-US" : idioma === "pt" ? "pt-BR" : "es-AR";
  
  return new Intl.DateTimeFormat(locale, opciones ?? {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatearDistancia(km: number, idioma: Idioma = "es"): string {
  const locale = idioma === "en" ? "en-US" : idioma === "pt" ? "pt-BR" : "es-AR";
  const num = new Intl.NumberFormat(locale).format(km || 0);
  return `${num} km`;
}
