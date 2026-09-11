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

/** Nombre de archivo para compras/remitos dentro del bucket: {taller}/compras/{compraId}/{uuid}.webp */
export function rutaFotoCompra(tallerId: string, compraId: string, extension = "webp"): string {
  return `${tallerId}/compras/${compraId}/${crypto.randomUUID()}.${extension}`;
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

/**
 * Comprime una imagen o fotograma de video específicamente para OCR con IA.
 *
 * Devuelve un data URI `data:image/jpeg;base64,...` optimizado (máximo 1600px,
 * calidad 0.82-0.85). Esto reduce fotos pesadas de celulares (5 a 15 MB) a
 * ~150-250 KB, evitando el límite de 4.5 MB de Serverless Functions en Vercel
 * y el default de Next.js Server Actions, preservando la máxima legibilidad de
 * patentes, números de chasis y textos chicos.
 *
 * `imageOrientation: "from-image"` es mandatorio para corregir automáticamente
 * la orientación EXIF de fotos sacadas con el celular.
 */
export async function comprimirParaOCR(
  origen: File | Blob | HTMLVideoElement,
  ladoMax = 1280,
  calidad = 0.78,
): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("comprimirParaOCR solo se puede ejecutar en el navegador.");
  }

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  if (origen instanceof HTMLVideoElement) {
    const ancho = origen.videoWidth;
    const alto = origen.videoHeight;
    if (ancho <= 0 || alto <= 0) {
      throw new Error("El video no tiene dimensiones válidas para capturar el fotograma.");
    }
    const dims = calcularDimensiones(ancho, alto, ladoMax);
    canvas = document.createElement("canvas");
    canvas.width = dims.ancho;
    canvas.height = dims.alto;
    ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas.");
    ctx.drawImage(origen, 0, 0, dims.ancho, dims.alto);
  } else {
    // Es File o Blob
    let bitmap: ImageBitmap | null = null;
    if (typeof createImageBitmap === "function") {
      try {
        bitmap = await createImageBitmap(origen, { imageOrientation: "from-image" });
      } catch (err) {
        console.warn("[comprimirParaOCR] createImageBitmap con orientación falló, reintentando básico:", err);
        try {
          bitmap = await createImageBitmap(origen);
        } catch {
          bitmap = null;
        }
      }
    }

    if (bitmap) {
      const dims = calcularDimensiones(bitmap.width, bitmap.height, ladoMax);
      canvas = document.createElement("canvas");
      canvas.width = dims.ancho;
      canvas.height = dims.alto;
      ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close();
        throw new Error("No se pudo obtener el contexto 2D del canvas.");
      }
      ctx.drawImage(bitmap, 0, 0, dims.ancho, dims.alto);
      bitmap.close();
    } else {
      // Fallback para entornos donde createImageBitmap no esté disponible
      const img = new Image();
      const url = URL.createObjectURL(origen);
      try {
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = (e) => reject(new Error("No se pudo decodificar la imagen: " + String(e)));
          img.src = url;
        });
        const dims = calcularDimensiones(img.naturalWidth, img.naturalHeight, ladoMax);
        canvas = document.createElement("canvas");
        canvas.width = dims.ancho;
        canvas.height = dims.alto;
        ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas.");
        ctx.drawImage(img, 0, 0, dims.ancho, dims.alto);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  }

  return canvas.toDataURL("image/jpeg", calidad);
}

