import { obtenerCliente } from "./cliente.ts";
import { extraerJSON, prepararImagen, type EntradaImagen } from "./vision.ts";
import { normalizarPatente } from "../patente.ts";

export interface CedulaVerdeOCRData {
  patente: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  vin?: string; // Número de chasis / cuadro
  motor?: string;
  color?: string;
  combustible?: "nafta" | "diesel" | "gnc" | "hibrido" | "electrico";
  titularNombre?: string;
  titularDocumento?: string; // DNI / CUIT / CPF
  pais?: string;
  confianza?: "alta" | "media" | "baja";
}

export interface ResultadoOCRCedulaVerde {
  datos?: CedulaVerdeOCRData;
  modelo?: string;
  proveedor?: "claude" | "gemini";
  error?: string;
}

export function sanitizarCedulaVerde(crudo: any): CedulaVerdeOCRData {
  const patenteCruda = String(crudo.patente || crudo.dominio || crudo.placa || "").trim();
  const patente = normalizarPatente(patenteCruda);

  let combustible: "nafta" | "diesel" | "gnc" | "hibrido" | "electrico" | undefined;
  const combStr = String(crudo.combustible || crudo.combustivel || "").toLowerCase();
  if (combStr.includes("diesel") || combStr.includes("gasoil") || combStr.includes("diesel")) combustible = "diesel";
  else if (combStr.includes("gnc") || combStr.includes("gas") || combStr.includes("gnv")) combustible = "gnc";
  else if (combStr.includes("hibrido") || combStr.includes("hybrid") || combStr.includes("híbrido")) combustible = "hibrido";
  else if (combStr.includes("electrico") || combStr.includes("ev") || combStr.includes("elétrico")) combustible = "electrico";
  else if (combStr.includes("nafta") || combStr.includes("gasolina") || combStr.includes("flex") || combStr.includes("etanol") || combStr.includes("alcohol")) combustible = "nafta";

  let anio: number | undefined;
  const anioNum = Number(crudo.anio || crudo.ano || crudo.modelo_anio);
  if (!isNaN(anioNum) && anioNum >= 1900 && anioNum <= new Date().getFullYear() + 2) {
    anio = anioNum;
  }

  const vinLimpio = String(crudo.vin || crudo.chasis || crudo.cuadro || "").replace(/[^A-HJ-NPR-Z0-9]/gi, "").toUpperCase();

  return {
    patente: patente || patenteCruda.toUpperCase(),
    marca: crudo.marca ? String(crudo.marca).trim() : undefined,
    modelo: crudo.modelo ? String(crudo.modelo).trim() : undefined,
    anio,
    vin: vinLimpio.length >= 6 ? vinLimpio : undefined,
    motor: crudo.motor ? String(crudo.motor).trim() : undefined,
    color: crudo.color ? String(crudo.color).trim() : undefined,
    combustible,
    titularNombre: crudo.titularNombre || crudo.titular || crudo.propietario || crudo.proprietario
      ? String(crudo.titularNombre || crudo.titular || crudo.propietario || crudo.proprietario).trim()
      : undefined,
    titularDocumento: crudo.titularDocumento || crudo.documento || crudo.dni || crudo.cuit
      ? String(crudo.titularDocumento || crudo.documento || crudo.dni || crudo.cuit).trim()
      : undefined,
    pais: crudo.pais ? String(crudo.pais).trim().toUpperCase() : "AR",
    confianza: patente.length >= 6 ? "alta" : "media",
  };
}

const PROMPT_CEDULA_VERDE = `Eres un sistema experto de OCR vehicular especializado en Cédulas Verdes, Cédulas de Identificación del Automotor, Títulos de Propiedad Automotor, Tarjetas de Circulación (México/España) y CRLV (Brasil).

Analiza minuciosamente la imagen de la cédula del automotor y extrae los datos del vehículo y del titular registrado.

Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura:

{
  "patente": "Dominio o Placa (ej: AF123CD o AB123CD o RTF421)",
  "marca": "Marca del fabricante (ej: VOLKSWAGEN, TOYOTA, PEUGEOT, FORD)",
  "modelo": "Modelo y versión exacta (ej: GOL TREND 1.6 MSI 5P, HILUX 2.8 4X4 CD)",
  "anio": 2021,
  "vin": "Número de Chasis / VIN alfanumérico (ej: 8AWZZZ...)",
  "motor": "Número de Motor",
  "combustible": "nafta" | "diesel" | "gnc" | "hibrido" | "electrico",
  "titularNombre": "Apellido y Nombres completos del titular",
  "titularDocumento": "DNI / CUIT / CPF del titular",
  "pais": "AR" | "BR" | "CL" | "MX" | "ES" | "CO" | "US"
}

REGLAS CRÍTICAS:
1. Asegúrate de extraer la patente sin espacios ni caracteres extraños.
2. Si el número de chasis / VIN está presente, transcríbelo con exactitud.
3. Si el titular está visible en la cédula, extrae su nombre completo para asignar el cliente automáticamente.
4. Devuelve EXCLUSIVAMENTE el JSON, sin texto introductorio ni bloques decorativos.`;

export async function procesarOCRCedulaVerde(
  imagen: EntradaImagen,
): Promise<ResultadoOCRCedulaVerde> {
  const imgProcesada = await prepararImagen(imagen);
  if (!imgProcesada) {
    return { error: "No se pudo procesar la imagen de la cédula verde." };
  }

  // 1. Probar con Claude Vision
  const clienteClaude = obtenerCliente();
  if (clienteClaude) {
    try {
      const response = await clienteClaude.messages.create({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1500,
        temperature: 0.1,
        system: "Eres un extractor de datos de cédulas y documentos vehiculares. Devuelves estrictamente JSON.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: imgProcesada.mediaType,
                  data: imgProcesada.base64,
                },
              },
              {
                type: "text",
                text: PROMPT_CEDULA_VERDE,
              },
            ],
          },
        ],
      });

      const bloqueTexto = response.content.find((c) => c.type === "text");
      if (bloqueTexto && "text" in bloqueTexto) {
        const rawJson = extraerJSON(bloqueTexto.text);
        const datos = sanitizarCedulaVerde(rawJson);
        return {
          datos,
          modelo: response.model,
          proveedor: "claude",
        };
      }
    } catch (err) {
      console.warn("Claude Vision falló en Cédula Verde, probando fallback:", err);
    }
  }

  // 2. Probar con Gemini Vision
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (geminiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                text: PROMPT_CEDULA_VERDE,
              },
              {
                inlineData: {
                  mimeType: imgProcesada.mediaType,
                  data: imgProcesada.base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const textoRespuesta =
          json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textoRespuesta) {
          const parsed = extraerJSON(textoRespuesta);
          const datos = sanitizarCedulaVerde(parsed);
          return {
            datos,
            modelo: "gemini-2.5-flash",
            proveedor: "gemini",
          };
        }
      }
    } catch (err) {
      console.error("Gemini Vision Cédula Verde falló:", err);
    }
  }

  return {
    error: "No se pudo conectar con el servicio de IA de visión.",
  };
}
