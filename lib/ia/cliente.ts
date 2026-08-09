import Anthropic from "@anthropic-ai/sdk";

/**
 * Cliente de la API de Claude.
 *
 * Vive en su propio archivo para que quede UN solo lugar donde se decide el
 * modelo, el esfuerzo y el manejo de la falta de credencial. Las dos funciones
 * de IA (diagnóstico y traducción) comparten todo eso.
 */

export const MODELO_IA = "claude-opus-5";

/**
 * La feature es OPCIONAL y tiene que poder no estar.
 *
 * Sin `ANTHROPIC_API_KEY` la app entera sigue funcionando y los botones de IA
 * no aparecen. Un taller que no quiere pagarla no tiene por qué ver botones que
 * fallan, y el deploy no puede romperse por una variable que falta.
 */
export function iaDisponible(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let cliente: Anthropic | null = null;

export function obtenerCliente(): Anthropic | null {
  if (!iaDisponible()) return null;
  cliente ??= new Anthropic();
  return cliente;
}

export interface UsoTokens {
  entrada: number;
  salida: number;
}

/**
 * Motivo por el que una respuesta no llegó, en castellano y para el usuario.
 *
 * El `refusal` no es un error de red: es un 200 con `stop_reason: "refusal"`, y
 * si el código lee `content[0]` sin chequear, revienta. Se traduce a un mensaje
 * que le sirva al mecánico en vez de mostrarle el código de la API.
 */
export function motivoDeFalla(stopReason: string | null): string {
  switch (stopReason) {
    case "refusal":
      return "El asistente no pudo procesar este texto. Escribilo con tus palabras y probá de nuevo.";
    case "max_tokens":
      return "La respuesta quedó cortada. Probá con un descargo más corto.";
    default:
      return "No se pudo generar la respuesta. Probá de nuevo en un momento.";
  }
}
