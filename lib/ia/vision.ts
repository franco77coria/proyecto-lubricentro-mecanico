import Anthropic from "@anthropic-ai/sdk";
import { MODELO_IA, obtenerCliente } from "./cliente.ts";

/**
 * Estado general de la carrocería del vehículo detectado por la IA.
 */
export type EstadoCarroceria = "excelente" | "bueno" | "regular" | "malo";

/**
 * Datos estructurados del peritaje visual vehicular.
 */
export interface PeritajeVisionData {
  /** Color principal estimado del vehículo (ej: "Gris plata metalizado", "Blanco", "Negro"). */
  colorEstimado: string;
  /** Estado general de la chapa y pintura. */
  estadoCarroceria: EstadoCarroceria;
  /** Lista de abolladuras, golpes o hundimientos visibles con su ubicación anatómica. */
  abolladuras: string[];
  /** Lista de rayones, raspones o marcas en la pintura con su ubicación. */
  rayones: string[];
  /** Lista de roturas, rajaduras o faltantes en ópticas delanteras, faros traseros o espejos. */
  roturasOpticas: string[];
  /** Nivel de combustible estimado si se visualiza el instrumental/tablero (ej: "Lleno", "3/4", "1/2", "1/4", "Reserva", "No visible en las fotos"). */
  nivelCombustible: string;
  /** Resumen pericial técnico profesional del estado de ingreso. */
  observaciones?: string;
  /** Otros detalles observados relevantes (ej: estado de neumáticos, parabrisas, molduras). */
  detallesAdicionales?: string[];
  /** Testigos de alerta encendidos en el tablero si la foto muestra el instrumental. */
  lucesTestigo?: string[];
}

export type TipoImagenVision = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export interface ImagenProcesada {
  base64: string;
  mediaType: TipoImagenVision;
}

export type EntradaImagen =
  | string
  | {
      url?: string;
      base64?: string;
      mediaType?: TipoImagenVision;
      path?: string;
    };

export interface OpcionesPeritaje {
  vehiculoInfo?: {
    marca?: string | null;
    modelo?: string | null;
    anio?: number | null;
    colorRegistrado?: string | null;
  };
  proveedorPreferido?: "auto" | "claude" | "gemini";
}

export interface ResultadoPeritajeVision {
  datos?: PeritajeVisionData;
  modelo?: string;
  proveedor?: "claude" | "gemini";
  tokensEntrada?: number;
  tokensSalida?: number;
  error?: string;
}

/**
 * Verifica si algún servicio de visión IA está configurado.
 */
export function visionDisponible(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY,
  );
}

/**
 * Detecta el MIME type a partir del buffer o encabezado base64.
 */
export function detectarMimeType(buffer: Buffer): TipoImagenVision {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 3) === "GIF") {
    return "image/gif";
  }
  return "image/jpeg";
}

/**
 * Convierte una entrada (URL http/https, data URI o base64 puro) en un objeto ImagenProcesada listo para la IA.
 */
export async function prepararImagen(entrada: EntradaImagen): Promise<ImagenProcesada | null> {
  try {
    if (!entrada) return null;

    if (typeof entrada === "string") {
      const limpio = entrada.trim();
      if (!limpio) return null;

      // Caso 1: Data URI (ej. data:image/webp;base64,...)
      if (limpio.startsWith("data:")) {
        const match = limpio.match(/^data:([^;]+);base64,(.+)$/i);
        if (match) {
          const rawMime = match[1].toLowerCase();
          const mime: TipoImagenVision =
            rawMime === "image/png" ||
            rawMime === "image/webp" ||
            rawMime === "image/gif"
              ? (rawMime as TipoImagenVision)
              : "image/jpeg";
          return { base64: match[2], mediaType: mime };
        }
      }

      // Caso 2: URL HTTP / HTTPS
      if (limpio.startsWith("http://") || limpio.startsWith("https://")) {
        const res = await fetch(limpio, {
          headers: { Accept: "image/*" },
          cache: "no-store",
        });
        if (!res.ok) {
          console.error(`[prepararImagen] Error descargando ${limpio}: HTTP ${res.status}`);
          return null;
        }
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const headerMime = res.headers.get("content-type")?.toLowerCase();
        let mediaType: TipoImagenVision = "image/jpeg";
        if (
          headerMime === "image/png" ||
          headerMime === "image/webp" ||
          headerMime === "image/gif"
        ) {
          mediaType = headerMime as TipoImagenVision;
        } else {
          mediaType = detectarMimeType(buffer);
        }
        return {
          base64: buffer.toString("base64"),
          mediaType,
        };
      }

      // Caso 3: Base64 directo
      const buffer = Buffer.from(limpio, "base64");
      return {
        base64: limpio,
        mediaType: detectarMimeType(buffer),
      };
    }

    // Si es un objeto
    if (entrada.url) {
      return await prepararImagen(entrada.url);
    }
    if (entrada.base64) {
      const limpio = entrada.base64.replace(/^data:[^;]+;base64,/, "");
      return {
        base64: limpio,
        mediaType: entrada.mediaType || "image/jpeg",
      };
    }

    return null;
  } catch (error) {
    console.error("[prepararImagen] Error procesando imagen:", error);
    return null;
  }
}

/**
 * Extrae y parsea de forma segura un bloque JSON devuelto por un modelo LLM.
 */
export function extraerJSON<T = Record<string, unknown>>(texto: string): T {
  const limpio = texto.trim();

  // 1. Intento directo
  try {
    return JSON.parse(limpio) as T;
  } catch {
    // Continuar con regex
  }

  // 2. Extraer de bloque de código ```json ... ```
  const matchBloque = limpio.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (matchBloque && matchBloque[1]) {
    try {
      return JSON.parse(matchBloque[1].trim()) as T;
    } catch {
      // Continuar
    }
  }

  // 3. Buscar primer { y último }
  const primerLlave = limpio.indexOf("{");
  const ultimaLlave = limpio.lastIndexOf("}");
  if (primerLlave !== -1 && ultimaLlave > primerLlave) {
    const substr = limpio.slice(primerLlave, ultimaLlave + 1);
    try {
      return JSON.parse(substr) as T;
    } catch {
      // Falló
    }
  }

  throw new Error("No se pudo extraer un JSON válido de la respuesta de la IA.");
}

/**
 * Sanitiza y asegura la estructura de los datos del peritaje.
 */
export function sanitizarPeritaje(raw: Record<string, unknown>): PeritajeVisionData {
  const estadosValidos: EstadoCarroceria[] = ["excelente", "bueno", "regular", "malo"];

  let estadoCarroceria: EstadoCarroceria = "bueno";
  if (
    typeof raw.estadoCarroceria === "string" &&
    estadosValidos.includes(raw.estadoCarroceria.toLowerCase() as EstadoCarroceria)
  ) {
    estadoCarroceria = raw.estadoCarroceria.toLowerCase() as EstadoCarroceria;
  } else if (
    typeof raw.estado_carroceria === "string" &&
    estadosValidos.includes(raw.estado_carroceria.toLowerCase() as EstadoCarroceria)
  ) {
    estadoCarroceria = raw.estado_carroceria.toLowerCase() as EstadoCarroceria;
  }

  const parseArrayStrings = (val: unknown): string[] => {
    if (Array.isArray(val)) {
      return val
        .map((item) => (typeof item === "string" ? item.trim() : typeof item === "object" && item !== null ? JSON.stringify(item) : ""))
        .filter((item): item is string => Boolean(item));
    }
    if (typeof val === "string" && val.trim()) {
      return [val.trim()];
    }
    return [];
  };

  const colorEstimado =
    typeof raw.colorEstimado === "string" && raw.colorEstimado.trim()
      ? raw.colorEstimado.trim()
      : typeof raw.color_estimado === "string" && raw.color_estimado.trim()
        ? raw.color_estimado.trim()
        : typeof raw.color === "string" && raw.color.trim()
          ? raw.color.trim()
          : "No determinado";

  const nivelCombustible =
    typeof raw.nivelCombustible === "string" && raw.nivelCombustible.trim()
      ? raw.nivelCombustible.trim()
      : typeof raw.nivel_combustible === "string" && raw.nivel_combustible.trim()
        ? raw.nivel_combustible.trim()
        : "No visible en las fotos";

  const abolladuras = parseArrayStrings(raw.abolladuras ?? raw.danyos_abolladuras);
  const rayones = parseArrayStrings(raw.rayones ?? raw.danyos_rayones);
  const roturasOpticas = parseArrayStrings(raw.roturasOpticas ?? raw.roturas_opticas ?? raw.opticas);
  const detallesAdicionales = parseArrayStrings(raw.detallesAdicionales ?? raw.detalles_adicionales);
  const lucesTestigo = parseArrayStrings(raw.lucesTestigo ?? raw.luces_testigo);

  const observaciones =
    typeof raw.observaciones === "string" && raw.observaciones.trim()
      ? raw.observaciones.trim()
      : typeof raw.resumen === "string" && raw.resumen.trim()
        ? raw.resumen.trim()
        : undefined;

  return {
    colorEstimado,
    estadoCarroceria,
    abolladuras,
    rayones,
    roturasOpticas,
    nivelCombustible,
    ...(observaciones ? { observaciones } : {}),
    ...(detallesAdicionales.length > 0 ? { detallesAdicionales } : {}),
    ...(lucesTestigo.length > 0 ? { lucesTestigo } : {}),
  };
}

const SYSTEM_PROMPT_PERITAJE = `Sos un perito técnico vehicular y mecánico experto de un taller automotriz y lubricentro en Argentina.
Tu tarea es inspeccionar visualmente con máxima rigurosidad y precisión las fotografías provistas del vehículo que ingresa al taller para generar la constancia de recepción pericial.

Debés examinar:
1. Color exterior del vehículo (tonalidad aproximada).
2. Estado de carrocería general: calificar estrictamente en 'excelente', 'bueno', 'regular' o 'malo'.
3. Abolladuras, golpes, hundimientos o deformaciones en paneles de chapa (especificar ubicación exacta: paragolpe delantero, puerta delantera izquierda, guardabarro, zócalo, etc.).
4. Rayones, raspones, marcas o saltaduras de pintura (especificar ubicación).
5. Roturas de ópticas, faros traseros, intermitentes, antinieblas o espejos retrovisores (rajaduras, roturas de acrílico o faltantes).
6. Nivel de combustible: solo si alguna foto muestra el tablero de instrumentos (ej: 'Lleno', '3/4', '1/2', '1/4', 'Reserva'). Si ninguna foto muestra el cuadro/tablero, indicar exactamente: 'No visible en las fotos'.
7. Luces testigo: si se ve el cuadro encendido, indicar si hay testigos prendidos (Check Engine, ABS, batería, etc.).
8. Detalles adicionales: estado visual de parabrisas, escobillas, llantas o neumáticos si se aprecian.
9. Observaciones: resumen técnico profesional conciso de cómo ingresa el vehículo.

Devolvé ÚNICAMENTE un objeto JSON válido con este formato:
{
  "colorEstimado": "Gris plata metalizado",
  "estadoCarroceria": "bueno",
  "abolladuras": ["Abolladura leve de 5cm en guardabarro trasero derecho"],
  "rayones": ["Rayón superficial en paragolpe delantero lado izquierdo"],
  "roturasOpticas": [],
  "nivelCombustible": "1/2",
  "observaciones": "Vehículo en buen estado general con detalles menores de chapa en lateral derecho.",
  "detallesAdicionales": ["Neumáticos en buen estado", "Parabrisas sin roturas"],
  "lucesTestigo": []
}

Reglas:
- Sé objetivo y preciso: si una parte no se ve claramente en las fotos, no inventes daños.
- Si no hay abolladuras, rayones o roturas ópticas, devolvé arrays vacíos [].
- Usá terminología clara de taller mecánico argentino.`;

/**
 * Análisis mediante Gemini Vision (Google AI API).
 */
async function analizarConGemini(
  imagenes: ImagenProcesada[],
  opciones?: OpcionesPeritaje,
): Promise<ResultadoPeritajeVision> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return { error: "No está configurada la clave de Gemini (GEMINI_API_KEY)." };
  }

  const modelo = process.env.GEMINI_MODELO || "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

  const infoVehiculo = opciones?.vehiculoInfo
    ? `Datos registrados del vehículo: Marca: ${opciones.vehiculoInfo.marca || "No especificada"}, Modelo: ${opciones.vehiculoInfo.modelo || "No especificado"}, Año: ${opciones.vehiculoInfo.anio || "No especificado"}, Color registrado: ${opciones.vehiculoInfo.colorRegistrado || "No especificado"}.\n`
    : "";

  const promptUsuario = `${infoVehiculo}Analizá las siguientes ${imagenes.length} fotos del vehículo y generá el peritaje visual de recepción.`;

  const parts: Array<Record<string, unknown>> = [
    { text: `${SYSTEM_PROMPT_PERITAJE}\n\n${promptUsuario}` },
    ...imagenes.map((img) => ({
      inline_data: {
        mime_type: img.mediaType,
        data: img.base64,
      },
    })),
  ];

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.1,
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[analizarConGemini] HTTP ${res.status}:`, errorText);
    return { error: `Error en la API de Gemini (${res.status}).` };
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
    };
  };

  const candidato = data.candidates?.[0];
  const texto = candidato?.content?.parts?.[0]?.text;
  if (!texto) {
    return { error: "Gemini no devolvió texto de análisis para estas fotos." };
  }

  const rawJson = extraerJSON<Record<string, unknown>>(texto);
  const datos = sanitizarPeritaje(rawJson);

  return {
    datos,
    modelo,
    proveedor: "gemini",
    tokensEntrada: data.usageMetadata?.promptTokenCount,
    tokensSalida: data.usageMetadata?.candidatesTokenCount,
  };
}

/**
 * Análisis mediante Claude Vision (@anthropic-ai/sdk).
 */
async function analizarConClaude(
  imagenes: ImagenProcesada[],
  opciones?: OpcionesPeritaje,
): Promise<ResultadoPeritajeVision> {
  const cliente = obtenerCliente();
  if (!cliente) {
    return { error: "No está configurada la clave de Anthropic (ANTHROPIC_API_KEY)." };
  }

  const infoVehiculo = opciones?.vehiculoInfo
    ? `Datos registrados del vehículo en ficha: Marca: ${opciones.vehiculoInfo.marca || "No especificada"}, Modelo: ${opciones.vehiculoInfo.modelo || "No especificado"}, Año: ${opciones.vehiculoInfo.anio || "No especificado"}, Color en sistema: ${opciones.vehiculoInfo.colorRegistrado || "No especificado"}.\n`
    : "";

  const promptUsuario = `${infoVehiculo}Realizá el peritaje visual de recepción de este vehículo a partir de las ${imagenes.length} fotos adjuntas.`;

  const content: Array<
    | { type: "text"; text: string }
    | {
        type: "image";
        source: {
          type: "base64";
          media_type: TipoImagenVision;
          data: string;
        };
      }
  > = [
    ...imagenes.map((img) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: img.mediaType,
        data: img.base64,
      },
    })),
    {
      type: "text" as const,
      text: promptUsuario,
    },
  ];

  const respuesta = await cliente.messages.create({
    model: MODELO_IA,
    max_tokens: 3000,
    system: SYSTEM_PROMPT_PERITAJE,
    messages: [{ role: "user", content }],
  });

  if (respuesta.stop_reason === "refusal" || respuesta.stop_reason === "max_tokens") {
    return { error: "No se pudo completar el análisis de peritaje por límites de la IA." };
  }

  const texto = respuesta.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  if (!texto) {
    return { error: "El asistente visual no generó contenido para estas fotos." };
  }

  const rawJson = extraerJSON<Record<string, unknown>>(texto);
  const datos = sanitizarPeritaje(rawJson);

  return {
    datos,
    modelo: respuesta.model,
    proveedor: "claude",
    tokensEntrada: respuesta.usage.input_tokens,
    tokensSalida: respuesta.usage.output_tokens,
  };
}

/**
 * Función principal del motor de visión IA:
 * Procesa URLs o base64 de fotos del vehículo y analiza con IA (Gemini Vision / Claude Vision)
 * devolviendo un JSON con: color estimado, estado de carrocería (excelente/bueno/regular/malo),
 * abolladuras, rayones, roturas de ópticas y nivel de combustible.
 */
export async function analizarFotosVehiculo(
  entradas: EntradaImagen[],
  opciones?: OpcionesPeritaje,
): Promise<ResultadoPeritajeVision> {
  if (!entradas || entradas.length === 0) {
    return { error: "No se proporcionaron fotos para analizar." };
  }

  if (!visionDisponible()) {
    return {
      error:
        "El motor de visión con IA no está configurado. Configurá ANTHROPIC_API_KEY o GEMINI_API_KEY en las variables de entorno.",
    };
  }

  // Preparar todas las imágenes en paralelo (descargando URLs o decodificando base64)
  const procesadas = await Promise.all(entradas.map((e) => prepararImagen(e)));
  const imagenesValidas = procesadas.filter((img): img is ImagenProcesada => img !== null);

  if (imagenesValidas.length === 0) {
    return { error: "No se pudo cargar o procesar ninguna de las fotos provistas." };
  }

  // Limitar a un máximo razonable de fotos por llamada para no exceder cuotas de tokens (máximo 12)
  const imagenesFinales = imagenesValidas.slice(0, 12);

  // Determinación de proveedor
  const tieneGemini = Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY,
  );
  const tieneClaude = Boolean(process.env.ANTHROPIC_API_KEY);

  const preferencia = opciones?.proveedorPreferido || "auto";

  if (preferencia === "gemini" && tieneGemini) {
    return await analizarConGemini(imagenesFinales, opciones);
  }
  if (preferencia === "claude" && tieneClaude) {
    return await analizarConClaude(imagenesFinales, opciones);
  }

  // Auto: si tiene Claude usa Claude, si no Gemini, o viceversa
  if (tieneClaude) {
    const res = await analizarConClaude(imagenesFinales, opciones);
    if (!res.error) return res;
    if (tieneGemini) {
      console.warn("[analizarFotosVehiculo] Claude falló, intentando fallback con Gemini...");
      return await analizarConGemini(imagenesFinales, opciones);
    }
    return res;
  }

  if (tieneGemini) {
    return await analizarConGemini(imagenesFinales, opciones);
  }

  return { error: "Ningún proveedor de visión IA disponible." };
}
