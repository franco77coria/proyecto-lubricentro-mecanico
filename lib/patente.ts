/**
 * Motor Universal de Patentes y Placas Automotrices.
 *
 * Soporta Argentina, Brasil (Mercosul), México, Chile, Colombia, España/UE, USA
 * e identificación internacional flexible.
 */

export const FORMATOS = {
  // Argentina
  auto_mercosur: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/, // AB123CD
  auto_viejo: /^[A-Z]{3}[0-9]{3}$/, // RTF421
  moto_vieja: /^[0-9]{3}[A-Z]{3}$/, // 123ABC
  moto_mercosur: /^[A-Z][0-9]{3}[A-Z]{3}$/, // A123BCD

  // Brasil (Mercosul e histórico)
  br_mercosur: /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/, // ABC1D23
  br_moto_mercosur: /^[A-Z]{3}[0-9]{2}[A-Z][0-9]$/, // ABC12D3
  br_antigua: /^[A-Z]{3}[0-9]{4}$/, // ABC1234

  // Chile
  cl_nuevo: /^[BCDFGHJKLPRSTVWXYZ]{4}[0-9]{2}$/, // BBBB10
  cl_antiguo: /^[A-Z]{2}[0-9]{4}$/, // AB1000

  // España / Unión Europea
  es_actual: /^[0-9]{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/, // 1234BCD
  es_provincial: /^[A-Z]{1,2}[0-9]{4}[A-Z]{1,2}$/, // M1234AB

  // Colombia
  co_moto: /^[A-Z]{3}[0-9]{2}[A-Z]$/, // ABC12D

  // México
  mx_formato1: /^[A-Z]{3}[0-9]{3}[A-Z]$/, // ABC-123-A
  mx_formato2: /^[A-Z]{3}[0-9]{4}$/, // ABC-12-34
} as const;

export type FormatoPatente = keyof typeof FORMATOS | "internacional";

/** Deja solo alfanuméricos en mayúscula, igual que la columna generada. */
export function normalizarPatente(entrada: string): string {
  return entrada.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function detectarFormato(entrada: string): FormatoPatente | null {
  const p = normalizarPatente(entrada);
  for (const [nombre, regex] of Object.entries(FORMATOS)) {
    if (regex.test(p)) return nombre as FormatoPatente;
  }
  if (p.length >= 2 && p.length <= 12) {
    return "internacional";
  }
  return null;
}

export function esPatenteValida(entrada: string): boolean {
  const p = normalizarPatente(entrada);
  if (p.length < 2 || p.length > 12) return false;
  return detectarFormato(p) !== null;
}

/**
 * Formato de lectura agrupado.
 */
export function formatearPatente(entrada: string): string {
  const p = normalizarPatente(entrada);
  const formato = detectarFormato(p);

  switch (formato) {
    case "auto_mercosur":
      return `${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}`;
    case "auto_viejo":
    case "moto_vieja":
      return `${p.slice(0, 3)} ${p.slice(3)}`;
    case "moto_mercosur":
      return `${p.slice(0, 1)} ${p.slice(1, 4)} ${p.slice(4)}`;
    case "br_mercosur":
      return `${p.slice(0, 3)}·${p.slice(3)}`;
    case "br_antigua":
      return `${p.slice(0, 3)}-${p.slice(3)}`;
    case "cl_nuevo":
      return `${p.slice(0, 2)}·${p.slice(2, 4)}·${p.slice(4)}`;
    case "cl_antiguo":
      return `${p.slice(0, 2)}·${p.slice(2)}`;
    case "es_actual":
      return `${p.slice(0, 4)} ${p.slice(4)}`;
    case "co_moto":
      return `${p.slice(0, 3)} ${p.slice(3)}`;
    case "mx_formato1":
      return `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`;
    case "mx_formato2":
      return `${p.slice(0, 3)}-${p.slice(3, 5)}-${p.slice(5)}`;
    default:
      return p;
  }
}

const NOMBRES: Record<FormatoPatente, string> = {
  auto_viejo: "Auto (formato anterior a 2016)",
  auto_mercosur: "Auto (Mercosur)",
  moto_vieja: "Moto (formato anterior)",
  moto_mercosur: "Moto (Mercosur)",
  br_mercosur: "Brasil (Mercosul)",
  br_moto_mercosur: "Brasil Moto (Mercosul)",
  br_antigua: "Brasil (Cinza)",
  cl_nuevo: "Chile (Actual)",
  cl_antiguo: "Chile (Tradicional)",
  es_actual: "España / Unión Europea",
  es_provincial: "España (Provincial)",
  co_moto: "Colombia (Moto)",
  mx_formato1: "México (Estándar A)",
  mx_formato2: "México (Estándar B)",
  internacional: "Internacional / Especial",
};

export function nombreFormato(f: FormatoPatente): string {
  return NOMBRES[f] || "Internacional";
}

/**
 * Mensaje de guía mientras el usuario tipea.
 */
export function ayudaPatente(entrada: string): string | null {
  const p = normalizarPatente(entrada);
  if (p.length === 0) return null;
  if (p.length < 2) return null;
  if (p.length > 12) return "Máximo 12 caracteres";
  return null;
}
