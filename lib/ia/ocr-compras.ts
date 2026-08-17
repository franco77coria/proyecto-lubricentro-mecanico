import Anthropic from "@anthropic-ai/sdk";
import { obtenerCliente } from "./cliente.ts";
import { detectarMimeType, extraerJSON, prepararImagen, type EntradaImagen } from "./vision.ts";

export interface ItemComprobanteOCR {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  codigo?: string;
}

export type TipoComprobanteOCR =
  | "factura_a"
  | "factura_b"
  | "factura_c"
  | "remito"
  | "recibo"
  | "presupuesto"
  | "ticket"
  | "otro";

export interface ComprobanteCompraOCRData {
  proveedor: string;
  cuitProveedor?: string;
  numeroComprobante: string;
  fecha: string; // YYYY-MM-DD
  tipoComprobante: TipoComprobanteOCR;
  items: ItemComprobanteOCR[];
  subtotalNeto?: number;
  iva?: number;
  total: number;
  observaciones?: string;
  confianza?: "alta" | "media" | "baja";
}

export interface ResultadoOCRCompra {
  datos?: ComprobanteCompraOCRData;
  modelo?: string;
  proveedor?: "claude" | "gemini";
  error?: string;
}

export function sanitizarOCRCompra(crudo: any): ComprobanteCompraOCRData {
  const itemsCrudos = Array.isArray(crudo.items) ? crudo.items : [];
  const items: ItemComprobanteOCR[] = itemsCrudos
    .map((it: any) => {
      const cantidad = typeof it.cantidad === "number" && !isNaN(it.cantidad) ? it.cantidad : Number(it.cantidad) || 1;
      const precioUnitario = typeof it.precioUnitario === "number" && !isNaN(it.precioUnitario)
        ? it.precioUnitario
        : Number(it.precio_unitario || it.precio || it.unitario) || 0;
      const subtotal = typeof it.subtotal === "number" && !isNaN(it.subtotal)
        ? it.subtotal
        : cantidad * precioUnitario;

      return {
        descripcion: String(it.descripcion || it.detalle || it.nombre || "Insumo sin descripción").trim(),
        cantidad: Math.max(0.01, cantidad),
        precioUnitario: Math.max(0, precioUnitario),
        subtotal: Math.max(0, subtotal),
        codigo: it.codigo ? String(it.codigo).trim() : undefined,
      };
    })
    .filter((it: ItemComprobanteOCR) => it.descripcion.length > 0);

  const totalCalculado = items.reduce((acc, it) => acc + it.subtotal, 0);
  const total = typeof crudo.total === "number" && !isNaN(crudo.total) && crudo.total > 0
    ? crudo.total
    : totalCalculado;

  let tipo: TipoComprobanteOCR = "remito";
  const tipoStr = String(crudo.tipoComprobante || crudo.tipo_comprobante || "").toLowerCase();
  if (tipoStr.includes("factura a") || tipoStr === "factura_a") tipo = "factura_a";
  else if (tipoStr.includes("factura b") || tipoStr === "factura_b") tipo = "factura_b";
  else if (tipoStr.includes("factura c") || tipoStr === "factura_c") tipo = "factura_c";
  else if (tipoStr.includes("ticket")) tipo = "ticket";
  else if (tipoStr.includes("recibo")) tipo = "recibo";
  else if (tipoStr.includes("presupuesto")) tipo = "presupuesto";

  return {
    proveedor: String(crudo.proveedor || crudo.razon_social || crudo.empresa || "Distribuidora de Repuestos").trim(),
    cuitProveedor: crudo.cuitProveedor || crudo.cuit ? String(crudo.cuitProveedor || crudo.cuit).trim() : undefined,
    numeroComprobante: String(crudo.numeroComprobante || crudo.numero_comprobante || crudo.numero || "S/N").trim(),
    fecha: String(crudo.fecha || new Date().toISOString().slice(0, 10)).trim(),
    tipoComprobante: tipo,
    items,
    subtotalNeto: typeof crudo.subtotalNeto === "number" ? crudo.subtotalNeto : undefined,
    iva: typeof crudo.iva === "number" ? crudo.iva : undefined,
    total,
    observaciones: crudo.observaciones ? String(crudo.observaciones).trim() : undefined,
    confianza: items.length > 0 ? "alta" : "media",
  };
}

const PROMPT_OCR_COMPRA = `Eres un sistema experto de OCR y extracción estructurada de comprobantes fiscales, facturas, remitos y recibos de casas de repuestos, lubricantes y autopartes.

Analiza minuciosamente la imagen del comprobante y devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura:

{
  "proveedor": "Nombre de la casa de repuestos / distribuidora o mayorista",
  "cuitProveedor": "CUIT / NIF / RFC si es legible o null",
  "numeroComprobante": "Número de remito o factura (ej: 0004-00012345)",
  "fecha": "YYYY-MM-DD (fecha del comprobante)",
  "tipoComprobante": "factura_a" | "factura_b" | "factura_c" | "remito" | "recibo" | "ticket" | "otro",
  "items": [
    {
      "codigo": "Código del fabricante/proveedor si está visible (ej: W712/52)",
      "descripcion": "Descripción del repuesto o lubricante (ej: Filtro de Aceite Mann W712/52)",
      "cantidad": 2,
      "precioUnitario": 12500,
      "subtotal": 25000
    }
  ],
  "subtotalNeto": 25000,
  "iva": 5250,
  "total": 30250,
  "observaciones": "Comentarios sobre condiciones de pago, descuentos o notas al pie"
}

REGLAS CRÍTICAS:
1. Extrae todos los ítems legibles con sus cantidades y precios. Si un precio unitario no está explícito, calcúlalo dividiendo subtotal entre cantidad.
2. Si la imagen es un remito sin precios, pon precioUnitario: 0 y total: 0 para cada ítem pero extrae rigurosamente las cantidades y descripciones.
3. Devuelve EXCLUSIVAMENTE el JSON, sin texto explicativo antes ni después.`;

export async function procesarOCRComprobanteCompra(
  imagen: EntradaImagen,
): Promise<ResultadoOCRCompra> {
  const imgProcesada = await prepararImagen(imagen);
  if (!imgProcesada) {
    return { error: "No se pudo procesar o cargar la imagen del comprobante." };
  }

  // 1. Intentar con Claude Vision si hay API key
  const clienteClaude = obtenerCliente();
  if (clienteClaude) {
    try {
      const response = await clienteClaude.messages.create({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 2048,
        temperature: 0.1,
        system: "Eres un extractor de datos de comprobantes y facturas de compras automotrices. Devuelves estrictamente JSON.",
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
                text: PROMPT_OCR_COMPRA,
              },
            ],
          },
        ],
      });

      const bloqueTexto = response.content.find((c) => c.type === "text");
      if (bloqueTexto && "text" in bloqueTexto) {
        const rawJson = extraerJSON(bloqueTexto.text);
        const datos = sanitizarOCRCompra(rawJson);
        return {
          datos,
          modelo: response.model,
          proveedor: "claude",
        };
      }
    } catch (err) {
      console.warn("Claude Vision falló en OCR, intentando fallback:", err);
    }
  }

  // 2. Intentar con Gemini Vision REST API si hay credenciales
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
                text: PROMPT_OCR_COMPRA,
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
          const datos = sanitizarOCRCompra(parsed);
          return {
            datos,
            modelo: "gemini-2.5-flash",
            proveedor: "gemini",
          };
        }
      }
    } catch (err) {
      console.error("Gemini Vision OCR falló:", err);
    }
  }

  return {
    error: "No se pudo conectar con el servicio de IA de visión (configure ANTHROPIC_API_KEY o GEMINI_API_KEY).",
  };
}
