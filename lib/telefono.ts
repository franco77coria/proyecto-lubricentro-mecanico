/**
 * Teléfonos argentinos a E.164.
 *
 * Importa más de lo que parece: la base exige `^\+[1-9][0-9]{7,14}$` y el link
 * de WhatsApp no arma si el número no está en este formato. Como el mostrador
 * lo va a tipear de mil maneras distintas, la normalización se hace acá.
 *
 * Reglas de Argentina:
 *   - 0 inicial de larga distancia: se saca
 *   - 15 de celular después del código de área: se saca
 *   - Los celulares llevan un 9 después del +54 (lo que WhatsApp necesita)
 */

const PAIS = "54";

export function normalizarTelefono(entrada: string, esCelular = true): string | null {
  if (!entrada?.trim()) return null;

  // El + solo cuenta si viene al principio.
  const tenia54 = /^\s*\+?54/.test(entrada);
  let d = entrada.replace(/\D/g, "");

  if (tenia54 && d.startsWith(PAIS)) d = d.slice(2);
  if (d.startsWith("9") && d.length > 10) d = d.slice(1);
  if (d.startsWith("0")) d = d.slice(1);

  // El 15 va después del código de área (2 a 4 dígitos).
  for (const largoArea of [2, 3, 4]) {
    if (d.length > largoArea + 2 && d.slice(largoArea, largoArea + 2) === "15") {
      d = d.slice(0, largoArea) + d.slice(largoArea + 2);
      break;
    }
  }

  if (d.length < 8 || d.length > 12) return null;

  return `+${PAIS}${esCelular ? "9" : ""}${d}`;
}

/**
 * Número para un link wa.me: sin el +, sin separadores.
 * (El + en un query string se decodifica como espacio, así que nunca va crudo.)
 */
export function paraWhatsApp(e164: string): string {
  return e164.replace(/\D/g, "");
}

/**
 * Presentación legible.
 *
 * El largo del código de área varía (2 a 4 dígitos) y no se puede deducir del
 * número sin una tabla del ENACOM. Se reconoce el 11 del AMBA, que es el más
 * frecuente, y para el resto se asume 3 dígitos: es lo correcto para la
 * mayoría de las capitales de provincia. Es cosmético — lo que se guarda y lo
 * que va a WhatsApp es siempre el E.164 completo.
 */
export function formatearTelefono(e164: string | null): string {
  if (!e164) return "";
  const d = e164.replace(/\D/g, "");
  if (!d.startsWith("549") || d.length < 12) return e164;

  const resto = d.slice(3);
  const largoArea = resto.startsWith("11") ? 2 : 3;
  const area = resto.slice(0, largoArea);
  const numero = resto.slice(largoArea);

  return `+54 9 ${area} ${numero.slice(0, -4)}-${numero.slice(-4)}`;
}
