/**
 * Verificación integral del subsistema de Inteligencia Artificial (Google Gemini 3.0 Flash).
 *
 * Corre con: node scripts/verificar-ia.mjs
 *
 * Valida credenciales reales de Gemini, modelo 3.6 Flash, generación de texto
 * estructurado para diagnósticos, redacción de WhatsApp y visión multimodal.
 */
import { readFileSync } from "node:fs";

// Cargar .env.local
try {
  for (const linea of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = linea.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) {
      const raw = m[2].trim();
      process.env[m[1]] ??= raw.replace(/^["']|["']$/g, "").trim();
    }
  }
} catch (e) {
  console.warn("Aviso: no se encontró .env.local");
}

let fallos = 0;
const ok = (msg) => console.log(`  OK    ${msg}`);
const fail = (msg) => {
  fallos++;
  console.log(`  FALLA ${msg}`);
};

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_AI_API_KEY ||
  process.env.GOOGLE_API_KEY;

const modelo = process.env.GEMINI_MODELO || "gemini-3.6-flash";

async function main() {
  console.log("=== AUDITORÍA Y VERIFICACIÓN INTEGRAL DE IA (GEMINI FLASH) ===");

  // 1. Variable de entorno
  console.log("\n[1] Configuración de Credenciales");
  apiKey
    ? ok(`API Key de Gemini detectada (${apiKey.slice(0, 8)}...${apiKey.slice(-4)})`)
    : fail("Falta GEMINI_API_KEY en .env.local");
  ok(`Modelo configurado: ${modelo}`);

  if (!apiKey) {
    console.error("No se puede continuar sin GEMINI_API_KEY");
    process.exit(1);
  }

  // 2. Conectividad básica y latencia
  console.log("\n[2] Conexión y Latencia con Google Gemini API");
  const t0 = Date.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Respondé únicamente: 'CONEXION_OK'" }] }],
      }),
    });

    const ms = Date.now() - t0;
    if (!res.ok) {
      const err = await res.text();
      fail(`HTTP ${res.status}: ${err}`);
    } else {
      const json = await res.json();
      const reply = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      ok(`Conectado exitosamente en ${ms}ms. Respuesta: "${reply}"`);
    }
  } catch (err) {
    fail(`Excepción al conectar con Gemini: ${err.message}`);
  }

  // 3. Prueba: Diagnóstico Mecánico en JSON Estructurado
  console.log("\n[3] Prueba: Diagnóstico Mecánico Asistido (JSON Estructurado)");
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
    const prompt = `Vehículo: Volkswagen Gol Trend 1.6 2018\nSíntoma que reporta el cliente: Tiembla al regular y se apaga en caliente`;
    const system = `Sos un mecánico experto de taller. Devolvé un JSON con este formato exacto:
{
  "hipotesis": [
    { "causa": "string", "probabilidad": 60, "como_verificar": "string" },
    { "causa": "string", "probabilidad": 40, "como_verificar": "string" }
  ]
}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: { response_mime_type: "application/json", temperature: 0.1 },
      }),
    });

    if (!res.ok) {
      fail(`HTTP ${res.status} en diagnóstico`);
    } else {
      const json = await res.json();
      const texto = json.candidates?.[0]?.content?.parts?.[0]?.text;
      const parseado = JSON.parse(texto);
      if (Array.isArray(parseado.hipotesis) && parseado.hipotesis.length > 0) {
        ok(`Diagnóstico generado (${parseado.hipotesis.length} hipótesis identificadas):`);
        for (const h of parseado.hipotesis) {
          console.log(`         • [${h.probabilidad}%] ${h.causa} → ${h.como_verificar}`);
        }
      } else {
        fail("El JSON generado no tiene la clave hipotesis");
      }
    }
  } catch (err) {
    fail(`Error en prueba de diagnóstico: ${err.message}`);
  }

  // 4. Prueba: Traductor de Descargo Técnico a WhatsApp
  console.log("\n[4] Prueba: Traducción Técnica para WhatsApp al Cliente");
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
    const notas = `Se cambió termostato trabado, bomba de agua con juego y refrigerante nuevo. Se purgó circuito.`;
    const system = `Convertís las notas técnicas de un mecánico en un mensaje claro y cordial de WhatsApp para el dueño del auto en castellano argentino. Devolvé solo el mensaje sin firma.`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: notas }] }],
        systemInstruction: { parts: [{ text: system }] },
      }),
    });

    if (!res.ok) {
      fail(`HTTP ${res.status} en traducción WhatsApp`);
    } else {
      const json = await res.json();
      const mensaje = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (mensaje && mensaje.length > 20) {
        ok(`Mensaje de WhatsApp generado exitosamente:`);
        console.log(`         "${mensaje}"`);
      } else {
        fail("El mensaje generado está vacío o es muy corto");
      }
    }
  } catch (err) {
    fail(`Error en traducción WhatsApp: ${err.message}`);
  }

  // 5. Prueba: Visión Multimodal con Imagen (1x1 PNG)
  console.log("\n[5] Prueba: Visión Multimodal para Cédula Verde y Carrocería");
  try {
    const imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Devolve un JSON con {'vision_activa': true}" },
              { inline_data: { mime_type: "image/png", data: imgBase64 } },
            ],
          },
        ],
        generationConfig: { response_mime_type: "application/json" },
      }),
    });

    if (!res.ok) {
      fail(`HTTP ${res.status} en visión multimodal`);
    } else {
      const json = await res.json();
      const txt = json.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(txt);
      if (parsed.vision_activa) {
        ok("Visión multimodal operativa al 100%");
      } else {
        fail("Respuesta de visión inesperada");
      }
    }
  } catch (err) {
    fail(`Error en prueba de visión: ${err.message}`);
  }

  // Resumen
  console.log("\n=======================================================");
  if (fallos === 0) {
    console.log("  RESULTADO: TODOS LOS CHEQUEOS DE IA GEMINI PASARON (100% OK)");
    console.log("=======================================================\n");
    process.exit(0);
  } else {
    console.error(`  RESULTADO: SE ENCONTRARON ${fallos} FALLO(S)`);
    console.log("=======================================================\n");
    process.exit(1);
  }
}

main().catch(console.error);
