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
