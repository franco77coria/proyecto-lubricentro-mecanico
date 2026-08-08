/**
 * Compresión de fotos antes de subirlas.
 *
 * Un celular moderno saca JPEG de 4 a 6 MB. Con ocho fotos por recepción y la
 * conexión de un taller, subir los originales hace que la app sea inusable y
 * llena el storage por nada: para documentar el estado de un auto, 1600px de
 * lado mayor sobra.
 */

export const LADO_MAX = 1600;
export const CALIDAD = 0.82;

/**
 * Escala respetando la proporción, sin agrandar nunca.
 *
 * Si la foto ya es más chica que el máximo se deja como está: agrandarla solo
 * sumaría peso sin agregar un solo detalle.
 */
export function calcularDimensiones(
  ancho: number,
  alto: number,
  ladoMax = LADO_MAX,
): { ancho: number; alto: number } {
  if (ancho <= 0 || alto <= 0) return { ancho: 0, alto: 0 };

  const mayor = Math.max(ancho, alto);
  if (mayor <= ladoMax) return { ancho: Math.round(ancho), alto: Math.round(alto) };

  const factor = ladoMax / mayor;
  return { ancho: Math.round(ancho * factor), alto: Math.round(alto * factor) };
}

/** Nombre de archivo dentro del bucket: {taller}/{ot}/{uuid}.webp */
export function rutaFoto(tallerId: string, otId: string, extension = "webp"): string {
  return `${tallerId}/${otId}/${crypto.randomUUID()}.${extension}`;
}

export interface FotoComprimida {
  blob: Blob;
  ancho: number;
  alto: number;
  bytesOriginales: number;
  bytesFinales: number;
}

/**
 * Comprime en el navegador.
 *
 * `imageOrientation: "from-image"` no es opcional: las fotos de celular traen
 * la rotación en los metadatos EXIF y sin esto aparecen acostadas. Al dibujar
 * en un canvas esa información se pierde, así que hay que aplicarla al
 * decodificar.
 *
 * WebP con fallback a JPEG: WebP pesa bastante menos, pero si el navegador no
 * sabe generarlo devuelve un PNG enorme sin avisar, y ahí conviene JPEG.
 */
export async function comprimirImagen(
  archivo: File,
  ladoMax = LADO_MAX,
  calidad = CALIDAD,
): Promise<FotoComprimida> {
  const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const { ancho, alto } = calcularDimensiones(bitmap.width, bitmap.height, ladoMax);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen en este dispositivo");

  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", calidad),
  );

  const final =
    blob && blob.type === "image/webp"
      ? blob
      : await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("No se pudo comprimir la imagen"))),
            "image/jpeg",
            calidad,
          ),
        );

  return {
    blob: final,
    ancho,
    alto,
    bytesOriginales: archivo.size,
    bytesFinales: final.size,
  };
}

export function formatearPeso(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
