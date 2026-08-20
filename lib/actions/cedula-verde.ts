"use server";

import { limitarIA, mensajeLimiteIA } from "@/lib/rate-limit";
import { obtenerSesion } from "@/lib/supabase/server";
import { procesarOCRCedulaVerde, type ResultadoOCRCedulaVerde } from "@/lib/ia/cedula-verde";

/** La foto de la cédula la saca la cámara y llega como data URI. No se acepta
 *  una URL: `prepararImagen` la descargaría del lado del servidor, y un
 *  parámetro de red elegido por el navegador es un SSRF. La única foto remota
 *  legítima es la de nuestro Storage, y esa la resuelve el servidor solo. */
const PREFIJO_DATA_URI = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i;

export async function escanearCedulaVerdeAction(
  imagenDataUri: string,
): Promise<ResultadoOCRCedulaVerde> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "No autorizado" };

  if (typeof imagenDataUri !== "string" || !PREFIJO_DATA_URI.test(imagenDataUri)) {
    return { error: "La imagen no llegó en un formato que se pueda leer." };
  }

  const limite = await limitarIA(sesion.perfil.taller_id, "cedula");
  if (!limite.permitido) return { error: mensajeLimiteIA(limite.esperaSegundos) };

  try {
    return await procesarOCRCedulaVerde(imagenDataUri);
  } catch (err) {
    console.error("[escanearCedulaVerdeAction]", err instanceof Error ? err.name : "desconocido");
    return { error: "No se pudo leer la cédula. Probá sacando la foto de nuevo." };
  }
}
