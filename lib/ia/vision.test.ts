import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  detectarMimeType,
  extraerJSON,
  sanitizarPeritaje,
  prepararImagen,
  type PeritajeVisionData,
} from "./vision.ts";

describe("detectarMimeType", () => {
  test("detecta JPEG correctamente", () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    assert.equal(detectarMimeType(jpegBuffer), "image/jpeg");
  });

  test("detecta PNG correctamente", () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.equal(detectarMimeType(pngBuffer), "image/png");
  });

  test("detecta WEBP correctamente", () => {
    const webpBuffer = Buffer.from("RIFF\x00\x00\x00\x00WEBPVP8 ");
    assert.equal(detectarMimeType(webpBuffer), "image/webp");
  });

  test("detecta GIF correctamente", () => {
    const gifBuffer = Buffer.from("GIF89a...");
    assert.equal(detectarMimeType(gifBuffer), "image/gif");
  });

  test("fallback a JPEG si es desconocido", () => {
    const unknownBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    assert.equal(detectarMimeType(unknownBuffer), "image/jpeg");
  });
});

describe("extraerJSON", () => {
  test("extrae JSON directo limpio", () => {
    const jsonStr = '{"colorEstimado":"Blanco","estadoCarroceria":"bueno","abolladuras":[],"rayones":[],"roturasOpticas":[],"nivelCombustible":"1/2"}';
    const res = extraerJSON<PeritajeVisionData>(jsonStr);
    assert.equal(res.colorEstimado, "Blanco");
    assert.equal(res.estadoCarroceria, "bueno");
  });

  test("extrae JSON envuelto en bloques markdown ```json", () => {
    const texto = `Aquí está el análisis pericial del vehículo:
\`\`\`json
{
  "colorEstimado": "Gris plata metalizado",
  "estadoCarroceria": "regular",
  "abolladuras": ["Golpe en guardabarro delantero"],
  "rayones": ["Rayón en paragolpe trasero"],
  "roturasOpticas": ["Óptica delantera derecha rajada"],
  "nivelCombustible": "3/4"
}
\`\`\`
Espero que te sea útil.`;
    const res = extraerJSON<PeritajeVisionData>(texto);
    assert.equal(res.colorEstimado, "Gris plata metalizado");
    assert.equal(res.estadoCarroceria, "regular");
    assert.equal(res.abolladuras.length, 1);
    assert.equal(res.roturasOpticas.length, 1);
  });

  test("extrae JSON con texto antes y después sin markdown tags", () => {
    const texto = `Respuesta del perito: {"colorEstimado":"Rojo","estadoCarroceria":"excelente","abolladuras":[],"rayones":[],"roturasOpticas":[],"nivelCombustible":"Lleno"} Saludos cordiales.`;
    const res = extraerJSON<PeritajeVisionData>(texto);
    assert.equal(res.colorEstimado, "Rojo");
    assert.equal(res.nivelCombustible, "Lleno");
  });

  test("lanza error si no hay ningún JSON", () => {
    assert.throws(() => extraerJSON("Esto es solo un texto sin llaves"), /No se pudo extraer/);
  });
});

describe("sanitizarPeritaje", () => {
  test("normaliza claves snake_case y camelCase", () => {
    const raw = {
      color_estimado: "Negro",
      estado_carroceria: "REGULAR",
      danyos_abolladuras: ["Abolladura en zócalo"],
      danyos_rayones: ["Rayón en puerta"],
      roturas_opticas: ["Faro trasero astillado"],
      nivel_combustible: "1/4",
      resumen: "Auto con detalles en lateral",
    };

    const sanitizado = sanitizarPeritaje(raw);
    assert.equal(sanitizado.colorEstimado, "Negro");
    assert.equal(sanitizado.estadoCarroceria, "regular");
    assert.deepEqual(sanitizado.abolladuras, ["Abolladura en zócalo"]);
    assert.deepEqual(sanitizado.rayones, ["Rayón en puerta"]);
    assert.deepEqual(sanitizado.roturasOpticas, ["Faro trasero astillado"]);
    assert.equal(sanitizado.nivelCombustible, "1/4");
    assert.equal(sanitizado.observaciones, "Auto con detalles en lateral");
  });

  test("aplica valores por defecto seguros ante campos nulos o faltantes", () => {
    const sanitizado = sanitizarPeritaje({});
    assert.equal(sanitizado.colorEstimado, "No determinado");
    assert.equal(sanitizado.estadoCarroceria, "bueno");
    assert.deepEqual(sanitizado.abolladuras, []);
    assert.deepEqual(sanitizado.rayones, []);
    assert.deepEqual(sanitizado.roturasOpticas, []);
    assert.equal(sanitizado.nivelCombustible, "No visible en las fotos");
  });

  test("valida estados de carrocería válidos", () => {
    const s1 = sanitizarPeritaje({ estadoCarroceria: "malo" });
    assert.equal(s1.estadoCarroceria, "malo");

    const s2 = sanitizarPeritaje({ estadoCarroceria: "excelente" });
    assert.equal(s2.estadoCarroceria, "excelente");

    const s3 = sanitizarPeritaje({ estadoCarroceria: "destruido_invalido" });
    assert.equal(s3.estadoCarroceria, "bueno"); // fallback seguro
  });
});

describe("prepararImagen", () => {
  test("procesa un data URI en base64", async () => {
    const dataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const res = await prepararImagen(dataUri);
    assert.ok(res !== null);
    assert.equal(res?.mediaType, "image/png");
    assert.equal(res?.base64, "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
  });

  test("procesa un objeto con base64", async () => {
    const obj = {
      base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mediaType: "image/webp" as const,
    };
    const res = await prepararImagen(obj);
    assert.ok(res !== null);
    assert.equal(res?.mediaType, "image/webp");
  });

  test("retorna null para entradas vacías", async () => {
    const res1 = await prepararImagen("");
    assert.equal(res1, null);
    const res2 = await prepararImagen({} as any);
    assert.equal(res2, null);
  });
});
