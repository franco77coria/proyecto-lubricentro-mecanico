import { MODELO_GEMINI, MODELO_IA, obtenerCliente } from "./cliente.ts";
import { extraerJSON, prepararImagen, type EntradaImagen } from "./vision.ts";
import { normalizarPatente } from "../patente.ts";

export interface CedulaVerdeOCRData {
  patente: string;
  marca?: string;
  modelo?: string;
  motorizacion?: string; // Ej: 1.6 16V, 2.0 TDI, 2.8 D-4D, 3.0 V6
  tipo?: string; // Ej: SEDAN 4 PTAS, HATCHBACK, PICK-UP
  uso?: string; // Ej: PRIVADO, PÚBLICO
  anio?: number;
  vin?: string; // Número de chasis / cuadro / VIN
  motor?: string;
  color?: string;
  combustible?: "nafta" | "diesel" | "gnc" | "hibrido" | "electrico";
  vencimiento?: string; // Ej: 29/11/2023
  codigoDoc?: string; // Código alfanumérico superior (ej: ATA81365)
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

/** Lo que devuelve el modelo. Se declara como diccionario abierto porque el
 *  JSON puede traer las claves en cualquier idioma (patente/placa/dominio) y
 *  eso es justo lo que esta función normaliza. */
type CrudoIA = Record<string, unknown>;

export function sanitizarCedulaVerde(crudo: CrudoIA): CedulaVerdeOCRData {
  const patenteCruda = String(crudo.patente || crudo.dominio || crudo.placa || "").trim();
  const patente = normalizarPatente(patenteCruda);

  let combustible: "nafta" | "diesel" | "gnc" | "hibrido" | "electrico" | undefined;
  const combStr = String(crudo.combustible || crudo.combustivel || "").toLowerCase();
  if (combStr.includes("diesel") || combStr.includes("gasoil")) combustible = "diesel";
  else if (combStr.includes("gnc") || combStr.includes("gas") || combStr.includes("gnv")) combustible = "gnc";
  else if (combStr.includes("hibrido") || combStr.includes("hybrid") || combStr.includes("híbrido")) combustible = "hibrido";
  else if (combStr.includes("electrico") || combStr.includes("ev") || combStr.includes("elétrico")) combustible = "electrico";
  else if (combStr.includes("nafta") || combStr.includes("gasolina") || combStr.includes("flex") || combStr.includes("etanol") || combStr.includes("alcohol") || combStr.includes("16v") || combStr.includes("1.6")) combustible = "nafta";

  let anio: number | undefined;
  const anioNum = Number(crudo.anio || crudo.ano || crudo.modelo_anio);
  if (!isNaN(anioNum) && anioNum >= 1900 && anioNum <= new Date().getFullYear() + 2) {
    anio = anioNum;
  }

  const vinLimpio = String(crudo.vin || crudo.chasis || crudo.cuadro || "").replace(/[^A-HJ-NPR-Z0-9]/gi, "").toUpperCase();

  // Detección de motorización / cilindrada (ej: "1.6 16V", "2.0 TDI", "2.8 D-4D", "3.0 V6")
  let motorizacion = crudo.motorizacion ? String(crudo.motorizacion).trim() : undefined;
  if (!motorizacion) {
    const textoCompleto = `${crudo.modelo || ""} ${crudo.motor || ""}`;
    const matchMotor = textoCompleto.match(
      /\b(\d\.\d(?:\s*(?:16v|8v|tdi|hdi|dci|tsi|msi|turbo|thp|d-4d|gse|v6|v8))?|\d\.\d|\b(?:v6|v8|tdi|turbo))\b/i,
    );
    if (matchMotor) {
      motorizacion = matchMotor[0].toUpperCase();
    } else if (String(crudo.motor || "").toUpperCase().startsWith("K4M")) {
      motorizacion = "1.6 16V";
    }
  }

  return {
    patente: patente || patenteCruda.toUpperCase(),
    marca: crudo.marca ? String(crudo.marca).trim() : undefined,
    modelo: crudo.modelo ? String(crudo.modelo).trim() : undefined,
    motorizacion,
    tipo: crudo.tipo ? String(crudo.tipo).trim() : undefined,
    uso: crudo.uso ? String(crudo.uso).trim() : undefined,
    anio,
    vin: vinLimpio.length >= 6 ? vinLimpio : undefined,
    motor: crudo.motor ? String(crudo.motor).trim() : undefined,
    color: crudo.color ? String(crudo.color).trim() : undefined,
    combustible,
    vencimiento: crudo.vencimiento || crudo.vence ? String(crudo.vencimiento || crudo.vence).trim() : undefined,
    codigoDoc: crudo.codigoDoc || crudo.codigo || crudo.numeroControl ? String(crudo.codigoDoc || crudo.codigo || crudo.numeroControl).trim() : undefined,
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

const PROMPT_CEDULA_VERDE = `Eres un sistema experto de OCR vehicular de máxima precisión, especializado en Cédulas Verdes, Cédulas de Identificación del Automotor (DNRPA Argentina), Títulos de Propiedad, Tarjetas de Circulación y CRLV.

Analiza minuciosamente la imagen de la cédula del automotor (incluso si está orientada vertical o girada) y extrae TODOS los datos impresos del vehículo y del titular.

Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura completa:

{
  "patente": "Dominio o Chapa patente (ej: LSJ982 o AB123CD)",
  "marca": "Marca del fabricante (ej: RENAULT, VOLKSWAGEN, TOYOTA)",
  "modelo": "Modelo y versión exacta completa (ej: FLUENCE 1.6 16V CONFORT)",
  "motorizacion": "Motorización o cilindrada si figura en el modelo o documento (ej: 1.6 16V, 2.0 TDI, 2.8 D-4D, 3.0 V6)",
  "tipo": "Tipo de carrocería (ej: SEDAN 4 PTAS, HATCHBACK, PICK-UP)",
  "uso": "Uso registrado (ej: PRIVADO, PÚBLICO)",
  "anio": 2018,
  "vin": "Número de Chasis / Cuadro completo alfanumérico (ej: 8A1LZB115DL468090)",
  "motor": "Número de Motor completo alfanumérico (ej: K4MV838R079119)",
  "combustible": "nafta" | "diesel" | "gnc" | "hibrido" | "electrico",
  "vencimiento": "Fecha de vencimiento exacta (ej: 29/11/2023)",
  "codigoDoc": "Código superior del documento (ej: ATA81365)",
  "titularNombre": "Apellido y Nombres completos del titular si figuran",
  "titularDocumento": "DNI / CUIT del titular si figura",
  "pais": "AR" | "BR" | "CL" | "MX" | "ES" | "CO" | "US"
}

REGLAS CRÍTICAS:
1. Extrae la patente sin espacios ni guiones (ej: LSJ982).
2. Transcribe el número de Chasis (VIN) y el número de Motor con exactitud total.
3. Extrae la marca, la denominación de modelo exacta y la motorización/cilindrada (ej: 1.6 16V, 2.0 TDI).
4. Si figura Tipo (ej: SEDAN 4 PTAS), Uso (ej: PRIVADO) y Vence (ej: 29/11/2023), inclúyelos.
5. Devuelve EXCLUSIVAMENTE el JSON, sin texto explicativo.`;

export async function procesarOCRCedulaVerde(
  imagen: EntradaImagen,
): Promise<ResultadoOCRCedulaVerde> {
  const imgProcesada = await prepararImagen(imagen);
  if (!imgProcesada) {
    return { error: "No se pudo procesar la imagen de la cédula verde." };
  }

  // 1. Probar con Gemini Vision si está configurado (Flash 3.0)
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (geminiKey) {
    try {
      const modelo = MODELO_GEMINI;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${geminiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                text: PROMPT_CEDULA_VERDE,
              },
              {
                inline_data: {
                  mime_type: imgProcesada.mediaType,
                  data: imgProcesada.base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.1,
        },
      };

      let res: Response | null = null;
      for (let intento = 0; intento < 2; intento++) {
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.status !== 429 && res.status !== 503) break;
        await new Promise((resolve) => setTimeout(resolve, 1500 * (intento + 1)));
      }

      if (res && res.ok) {
        const json = await res.json();
        const textoRespuesta =
          json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textoRespuesta) {
          const parsed = extraerJSON(textoRespuesta);
          const datos = sanitizarCedulaVerde(parsed);
          return {
            datos,
            modelo,
            proveedor: "gemini",
          };
        }
      } else if (res) {
        const errText = await res.text();
        console.warn("[Gemini Cédula Verde] HTTP", res.status, errText);
      }
    } catch (err) {
      console.error("Gemini Vision Cédula Verde falló:", err);
    }
  }

  // 2. Probar con Claude Vision como fallback si está configurado
  const clienteClaude = obtenerCliente();
  if (clienteClaude) {
    try {
      const response = await clienteClaude.messages.create({
        model: MODELO_IA,
        max_tokens: 1500,
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
      console.warn("Claude Vision falló en Cédula Verde:", err);
    }
  }

  return {
    error: "No se pudo conectar con el servicio de IA de visión.",
  };
}
