import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { calcularDimensiones, formatearPeso } from "./imagen.ts";

describe("calcularDimensiones", () => {
  test("una foto de celular apaisada entra en el lado mayor", () => {
    // 4032x3024 es lo que saca un iPhone.
    assert.deepEqual(calcularDimensiones(4032, 3024), { ancho: 1600, alto: 1200 });
  });

  test("una foto vertical también, sin deformarse", () => {
    assert.deepEqual(calcularDimensiones(3024, 4032), { ancho: 1200, alto: 1600 });
  });

  test("mantiene la proporción original", () => {
    const r = calcularDimensiones(4000, 2250);
    assert.ok(Math.abs(r.ancho / r.alto - 4000 / 2250) < 0.01);
  });

  test("nunca agranda: una foto chica queda igual", () => {
    assert.deepEqual(calcularDimensiones(800, 600), { ancho: 800, alto: 600 });
  });

  test("justo en el límite no la toca", () => {
    assert.deepEqual(calcularDimensiones(1600, 900), { ancho: 1600, alto: 900 });
  });

  test("una imagen cuadrada queda cuadrada", () => {
    assert.deepEqual(calcularDimensiones(3000, 3000), { ancho: 1600, alto: 1600 });
  });

  test("dimensiones inválidas no revientan", () => {
    assert.deepEqual(calcularDimensiones(0, 0), { ancho: 0, alto: 0 });
    assert.deepEqual(calcularDimensiones(-10, 100), { ancho: 0, alto: 0 });
  });

  test("acepta un lado máximo distinto", () => {
    assert.deepEqual(calcularDimensiones(4000, 2000, 800), { ancho: 800, alto: 400 });
  });
});

describe("formatearPeso", () => {
  test("muestra la unidad que corresponde", () => {
    assert.equal(formatearPeso(512), "512 B");
    assert.equal(formatearPeso(204800), "200 KB");
    assert.equal(formatearPeso(5 * 1024 * 1024), "5.0 MB");
  });
});

describe("rutas de almacenamiento", () => {
  test("rutaFoto genera ruta con tenant y ot", async () => {
    const { rutaFoto } = await import("./imagen.ts");
    const ruta = rutaFoto("taller-123", "ot-456", "webp");
    assert.match(ruta, /^taller-123\/ot-456\/[a-f0-9-]+\.webp$/);
  });

  test("rutaFotoCompra genera ruta con tenant, compras y compraId", async () => {
    const { rutaFotoCompra } = await import("./imagen.ts");
    const ruta = rutaFotoCompra("taller-123", "compra-789", "webp");
    assert.match(ruta, /^taller-123\/compras\/compra-789\/[a-f0-9-]+\.webp$/);
  });
});
