import Anthropic from "@anthropic-ai/sdk";

/**
 * Cliente de la API de Claude.
 *
 * Vive en su propio archivo para que quede UN solo lugar donde se decide el
 * modelo, el esfuerzo y el manejo de la falta de credencial. Las dos funciones
 * de IA (diagnóstico y traducción) comparten todo eso.
 */

/**
 * El modelo que usan TODAS las funciones de IA.
 *
 * Está acá y no repetido en cada archivo por una razón que ya nos mordió:
 * cuando el string vivía copiado en tres lados, quedó apuntando a
 * `claude-3-5-sonnet-latest` —un modelo RETIRADO— y las cuatro funciones de IA
 * devolvían 404 sin que nada lo avisara, porque cada una atrapa su error y cae
 * a un fallback en silencio.
 *
 * Si se cambia, se cambia una vez.
 */
export const MODELO_IA = "claude-opus-5";
export const MODELO_GEMINI = process.env.GEMINI_MODELO || "gemini-3.6-flash";

/**
 * La feature es OPCIONAL y tiene que poder no estar.
 *
 * Funciona tanto con Google Gemini como con Anthropic Claude.
 * Sin credenciales, la app entera sigue funcionando y los botones de IA no aparecen.
 */
export function iaDisponible(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.ANTHROPIC_API_KEY,
  );
}

/**
 * Indica qué proveedor de IA está activo según las variables de entorno.
 * Prioriza Gemini si está configurado.
 */
export function proveedorIAActivo(): "gemini" | "claude" | null {
  if (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY
  ) {
    return "gemini";
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return "claude";
  }
  return null;
}

let cliente: Anthropic | null = null;

export function obtenerCliente(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  cliente ??= new Anthropic();
  return cliente;
}

export interface UsoTokens {
  entrada: number;
  salida: number;
}

/**
 * Ejecuta generación de texto con Google Gemini (Flash 3.0).
 */
export async function generarTextoGemini(opciones: {
  prompt: string;
  system?: string;
  jsonOutput?: boolean;
}): Promise<{
  texto: string;
  modelo: string;
  tokensEntrada?: number;
  tokensSalida?: number;
} | null> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!apiKey) return null;
  const modelo = MODELO_GEMINI;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: opciones.prompt }] }],
    generationConfig: {
      temperature: 0.2,
      ...(opciones.jsonOutput ? { response_mime_type: "application/json" } : {}),
    },
  };

  if (opciones.system) {
    body.systemInstruction = {
      parts: [{ text: opciones.system }],
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[generarTextoGemini] HTTP ${res.status}:`, err);
      return null;
    }

    const data = await res.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) return null;

    return {
      texto,
      modelo,
      tokensEntrada: data.usageMetadata?.promptTokenCount,
      tokensSalida: data.usageMetadata?.candidatesTokenCount,
    };
  } catch (err) {
    console.error("[generarTextoGemini] Error al conectar con Gemini:", err);
    return null;
  }
}

/**
 * Ejecuta generación multimodal con imágenes con Google Gemini (Flash 3.0).
 */
export async function generarVisionGemini(opciones: {
  prompt: string;
  imagenes: Array<{ base64: string; mediaType: string }>;
  system?: string;
  jsonOutput?: boolean;
}): Promise<{
  texto: string;
  modelo: string;
  tokensEntrada?: number;
  tokensSalida?: number;
} | null> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!apiKey) return null;
  const modelo = MODELO_GEMINI;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

  const parts: Array<Record<string, unknown>> = [
    { text: opciones.prompt },
    ...opciones.imagenes.map((img) => ({
      inline_data: {
        mime_type: img.mediaType,
        data: img.base64,
      },
    })),
  ];

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.1,
      ...(opciones.jsonOutput ? { response_mime_type: "application/json" } : {}),
    },
  };

  if (opciones.system) {
    body.systemInstruction = {
      parts: [{ text: opciones.system }],
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[generarVisionGemini] HTTP ${res.status}:`, err);
      return null;
    }

    const data = await res.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) return null;

    return {
      texto,
      modelo,
      tokensEntrada: data.usageMetadata?.promptTokenCount,
      tokensSalida: data.usageMetadata?.candidatesTokenCount,
    };
  } catch (err) {
    console.error("[generarVisionGemini] Error al conectar con Gemini:", err);
    return null;
  }
}

/**
 * Motivo por el que una respuesta no llegó, en castellano y para el usuario.
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
