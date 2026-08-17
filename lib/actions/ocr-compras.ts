"use server";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";
import { procesarOCRComprobanteCompra, type ResultadoOCRCompra } from "@/lib/ia/ocr-compras";

export async function analizarComprobanteCompraAction(
  fotoIdOData: string,
): Promise<ResultadoOCRCompra> {
  const sesion = await obtenerSesion();
  if (!sesion) return { error: "No autorizado" };

  try {
    // Si viene como ID de foto de compra en Supabase Storage
    if (!fotoIdOData.startsWith("data:") && !fotoIdOData.startsWith("http")) {
      const supabase = await crearClienteServidor();
      const { data: foto, error } = await supabase
        .from("compra_foto")
        .select("path, compra_id")
        .eq("id", fotoIdOData)
        .single();

      if (error || !foto) {
        return { error: "No se encontró el comprobante en el sistema." };
      }

      // Obtener signed URL
      const { data: signed } = await supabase.storage
        .from("fotos")
        .createSignedUrl(foto.path, 300);

      if (!signed?.signedUrl) {
        return { error: "No se pudo generar el enlace seguro de la imagen." };
      }

      return await procesarOCRComprobanteCompra({ url: signed.signedUrl });
    }

    // Si viene como base64 directo desde la cámara web o input file
    return await procesarOCRComprobanteCompra(fotoIdOData);
  } catch (err: any) {
    console.error("Error en analizarComprobanteCompraAction:", err);
    return { error: err.message || "Error al procesar el comprobante." };
  }
}
