"use server";

import { limitarIA, mensajeLimiteIA } from "@/lib/rate-limit";
import { BUCKET_FOTOS } from "@/lib/storage";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";
import { procesarOCRComprobanteCompra, type ResultadoOCRCompra } from "@/lib/ia/ocr-compras";

const PREFIJO_DATA_URI = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * OCR de un remito o factura de compra.
 *
 * Acepta dos formas y ninguna más: la foto recién sacada (data URI) o el id de
 * un comprobante ya guardado. Deliberadamente NO acepta una URL — antes sí, y
 * eso hacía que el servidor descargara cualquier dirección que mandara el
 * navegador (red interna, localhost, metadata del cloud). La URL firmada del
 * comprobante guardado la genera el servidor acá adentro.
 */
export async function analizarComprobanteCompraAction(
  fotoIdODataUri: string,
): Promise<ResultadoOCRCompra> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "No autorizado" };
  if (sesion.perfil.rol === "mecanico") {
    return { error: "Las compras las carga el mostrador o el dueño." };
  }

  if (typeof fotoIdODataUri !== "string") {
    return { error: "No llegó ninguna imagen para analizar." };
  }

  const limite = await limitarIA(sesion.perfil.taller_id, "comprobante");
  if (!limite.permitido) return { error: mensajeLimiteIA(limite.esperaSegundos) };

  try {
    // Foto recién sacada: se manda tal cual.
    if (PREFIJO_DATA_URI.test(fotoIdODataUri)) {
      return await procesarOCRComprobanteCompra(fotoIdODataUri);
    }

    if (!UUID.test(fotoIdODataUri)) {
      return { error: "La imagen no llegó en un formato que se pueda leer." };
    }

    // Comprobante ya guardado. RLS limita `compra_foto` al propio taller, así
    // que si no aparece es que no es de acá.
    const supabase = await crearClienteServidor();
    const { data: foto } = await supabase
      .from("compra_foto")
      .select("path")
      .eq("id", fotoIdODataUri)
      .maybeSingle();

    if (!foto) return { error: "No se encontró el comprobante en el sistema." };

    // El bucket sale de la constante compartida. Acá decía "fotos" a mano, un
    // bucket que no existe: este camino fallaba siempre y el error que se veía
    // ("no se pudo generar el enlace seguro") no señalaba la causa.
    const { data: firmada } = await supabase.storage
      .from(BUCKET_FOTOS)
      .createSignedUrl(foto.path, 300);

    if (!firmada?.signedUrl) {
      return { error: "No se pudo abrir el comprobante guardado." };
    }

    return await procesarOCRComprobanteCompra({ url: firmada.signedUrl });
  } catch (err) {
    console.error("[analizarComprobanteCompraAction]", err instanceof Error ? err.name : "desconocido");
    return { error: "No se pudo procesar el comprobante. Probá de nuevo." };
  }
}
