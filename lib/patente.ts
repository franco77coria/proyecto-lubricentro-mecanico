/**
 * Patentes argentinas.
 *
 * Espejo en JS de lo que valida Postgres. La base sigue siendo la autoridad:
 * esto es para dar respuesta inmediata mientras se escribe, no para confiar.
 */

export const FORMATOS = {
  auto_viejo: /^[A-Z]{3}[0-9]{3}$/, //      RTF421
  auto_mercosur: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/, // AB123CD
  moto_vieja: /^[0-9]{3}[A-Z]{3}$/, //      123ABC
  moto_mercosur: /^[A-Z][0-9]{3}[A-Z]{3}$/, //  A123BCD
} as const;

export type FormatoPatente = keyof typeof FORMATOS;

/** Deja solo alfanuméricos en mayúscula, igual que la columna generada. */
export function normalizarPatente(entrada: string): string {
  return entrada.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function detectarFormato(entrada: string): FormatoPatente | null {
  const p = normalizarPatente(entrada);
  for (const [nombre, regex] of Object.entries(FORMATOS)) {
    if (regex.test(p)) return nombre as FormatoPatente;
  }
  return null;
}

export function esPatenteValida(entrada: string): boolean {
  return detectarFormato(entrada) !== null;
}

/**
 * Formato de lectura. La chapa se lee en grupos, así que mostrarla así reduce
 * los errores al dictarla por teléfono.
 */
export function formatearPatente(entrada: string): string {
  const p = normalizarPatente(entrada);
  switch (detectarFormato(p)) {
    case "auto_mercosur":
      return `${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}`;
    case "auto_viejo":
      return `${p.slice(0, 3)} ${p.slice(3)}`;
    case "moto_vieja":
      return `${p.slice(0, 3)} ${p.slice(3)}`;
    case "moto_mercosur":
      return `${p.slice(0, 1)} ${p.slice(1, 4)} ${p.slice(4)}`;
    default:
      return p;
  }
}

const NOMBRES: Record<FormatoPatente, string> = {
  auto_viejo: "Auto (formato anterior a 2016)",
  auto_mercosur: "Auto (Mercosur)",
  moto_vieja: "Moto (formato anterior)",
  moto_mercosur: "Moto (Mercosur)",
};

export function nombreFormato(f: FormatoPatente): string {
  return NOMBRES[f];
}

/**
 * Qué decirle a quien está escribiendo.
 *
 * Devuelve null cuando todavía no hay nada que corregir: avisar "formato
 * inválido" cuando el usuario escribió dos letras es ruido, no ayuda.
 */
export function ayudaPatente(entrada: string): string | null {
  const p = normalizarPatente(entrada);
  if (p.length === 0) return null;
  if (p.length < 6) return null;
  if (p.length > 7) return "Una patente argentina tiene 6 o 7 caracteres";
  return esPatenteValida(p) ? null : "No coincide con ningún formato argentino";
}
