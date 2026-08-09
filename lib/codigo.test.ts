/**
 * Lectura de códigos, de punta a punta.
 *
 * Genera códigos reales con el escritor de ZXing y los vuelve a leer con la
 * misma `leerCodigo` que usa la app. Es el único test que puede fallar cuando
 * la librería cambie de API: sin esto, el escáner se rompe en silencio y se
 * descubre al lado del auto, con la cédula en la mano.
 *
 * Los .wasm se pasan como bytes porque el build de ZXing es para navegador y
 * busca el archivo con `fetch`, que en Node no resuelve rutas del filesystem.
 */

import test, { before, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { prepareZXingModule as prepararEscritor, writeBarcode } from "zxing-wasm/writer";

import { FORMATOS_CEDULA, FORMATOS_PRODUCTO, leerCodigo, usarWasmBinario } from "./codigo.ts";
import { interpretarCedula } from "./cedula.ts";

/** El .wasm del paquete, como ArrayBuffer. */
function bytesDe(rutaRelativa: string): ArrayBuffer {
  const b = readFileSync(new URL(rutaRelativa, import.meta.url));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

before(() => {
  usarWasmBinario(bytesDe("../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm"));
  prepararEscritor({
    overrides: {
      wasmBinary: bytesDe("../node_modules/zxing-wasm/dist/writer/zxing_writer.wasm"),
    },
  });
});

/** Dibuja el código y devuelve la imagen lista para leer. */
async function generar(texto: string, formato: "PDF417" | "QRCode" | "EAN13") {
  const res = await writeBarcode(texto, { format: formato, scale: 4 });
  assert.ok(!res.error, `el escritor falló: ${res.error}`);
  assert.ok(res.image, "el escritor no devolvió imagen");
  return res.image!;
}

describe("leerCodigo", () => {
  test("lee un PDF417 como el del dorso de la cédula", async () => {
    const payload = "AB123CD,VOLKSWAGEN,GOL TREND 1.6,2018,9BWAB45U0JT123456,PEREZ JUAN";
    const texto = await leerCodigo(await generar(payload, "PDF417"), FORMATOS_CEDULA);
    assert.equal(texto, payload);
  });

  test("lee un QR, que es el otro formato que traen las cédulas", async () => {
    const payload = "Dominio: AA123BB\nMarca: FORD\nModelo: RANGER\nAño: 2021";
    const texto = await leerCodigo(await generar(payload, "QRCode"), FORMATOS_CEDULA);
    assert.equal(texto, payload);
  });

  test("lee un EAN-13, que es lo que trae pegado un bidón de aceite", async () => {
    // 779 es el prefijo argentino. El último dígito es el verificador y tiene
    // que cerrar: con 0 el escritor rechaza el código.
    const texto = await leerCodigo(await generar("7791234567898", "EAN13"), FORMATOS_PRODUCTO);
    assert.equal(texto, "7791234567898");
  });

  test("devuelve null cuando la imagen no tiene ningún código", async () => {
    // Un QR válido pero buscándolo entre los formatos de producto sin QR: sirve
    // para comprobar que no inventa una lectura cuando no hay nada del formato
    // esperado, que es el caso de la foto borrosa o del encuadre cortado.
    const soloLineales = FORMATOS_PRODUCTO.filter((f) => f !== "QRCode" && f !== "DataMatrix");
    const texto = await leerCodigo(await generar("hola", "QRCode"), soloLineales);
    assert.equal(texto, null);
  });

  test("lo leído de un PDF417 real atraviesa el parseo de cédula", async () => {
    // La cadena completa: código → texto → datos del vehículo. Es lo que hace
    // que el mostrador no tipee la patente ni el chasis.
    const payload = "AB123CD,VOLKSWAGEN,GOL TREND 1.6,2018,9BWAB45U0JT123456,PEREZ JUAN";
    const texto = await leerCodigo(await generar(payload, "PDF417"), FORMATOS_CEDULA);
    const datos = interpretarCedula(texto!);
    assert.equal(datos.patente, "AB123CD");
    assert.equal(datos.vin, "9BWAB45U0JT123456");
  });
});
