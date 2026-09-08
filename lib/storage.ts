/**
 * Constantes de Storage.
 *
 * Viven acá y no en `lib/actions/fotos.ts` porque un archivo marcado con
 * "use server" solo puede exportar funciones async: exportar una constante
 * desde ahí rompe el build (y el typecheck no lo detecta, solo aparece al
 * compilar). Es el mismo límite que tienen los `route.ts`.
 */
export const BUCKET_FOTOS = "ot-fotos";

/** Vida de las URLs firmadas. Corta a propósito: son fotos de la cédula y del
 *  auto de un cliente, no material público. Una hora alcanza para mirar la
 *  ficha y no deja links útiles dando vueltas. */
export const VIGENCIA_URL_SEGUNDOS = 60 * 60;

/**
 * Valida que una ruta de Storage pertenezca estrictamente al taller del usuario
 * y no contenga secuencias de escape de directorio (path traversal).
 */
export function esPathValido(path: string, tallerId: string): boolean {
  if (!path || typeof path !== "string") return false;
  if (path.includes("..") || path.includes("\\") || path.startsWith("/") || path.endsWith("/")) {
    return false;
  }
  const partes = path.split("/");
  if (partes.length < 2 || partes[0] !== tallerId) return false;
  return partes.every((p) => /^[a-zA-Z0-9_.-]+$/.test(p));
}
