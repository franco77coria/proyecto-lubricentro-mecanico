import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { normalizarTelefono, paraWhatsApp, formatearTelefono } from "./telefono.ts";

describe("normalizarTelefono", () => {
  test("las formas en que la gente escribe el mismo celular dan lo mismo", () => {
    // Todas estas son el mismo número de Buenos Aires.
    for (const entrada of [
      "11 5555-4444",
      "011 15 5555 4444",
      "+54 9 11 5555 4444",
      "5491155554444",
      "(011) 15-5555-4444",
    ]) {
      assert.equal(normalizarTelefono(entrada), "+5491155554444", `falló con "${entrada}"`);
    }
  });

  test("saca el 15 después de códigos de área de distinto largo", () => {
    assert.equal(normalizarTelefono("0221 15 456 7890"), "+5492214567890");
    assert.equal(normalizarTelefono("02901 15 45 6789"), "+5492901456789");
  });

  test("un fijo no lleva el 9", () => {
    assert.equal(normalizarTelefono("11 4555-4444", false), "+541145554444");
  });

  test("rechaza lo que no puede ser un teléfono", () => {
    assert.equal(normalizarTelefono(""), null);
    assert.equal(normalizarTelefono("123"), null);
    assert.equal(normalizarTelefono("no tengo"), null);
  });

  test("el resultado siempre cumple lo que exige la base", () => {
    const patronDeLaBase = /^\+[1-9][0-9]{7,14}$/;
    for (const e of ["11 5555-4444", "0351 15 234 5678", "+54 9 11 2222 3333"]) {
      const n = normalizarTelefono(e);
      assert.ok(n && patronDeLaBase.test(n), `"${e}" dio "${n}"`);
    }
  });
});

describe("paraWhatsApp", () => {
  test("saca el + porque en una URL se decodifica como espacio", () => {
    assert.equal(paraWhatsApp("+5491155554444"), "5491155554444");
    assert.ok(!paraWhatsApp("+5491155554444").includes("+"));
  });
});

describe("formatearTelefono", () => {
  test("reconoce el área de 2 dígitos del AMBA", () => {
    assert.equal(formatearTelefono("+5491155554444"), "+54 9 11 5555-4444");
  });

  test("para el interior asume área de 3 dígitos", () => {
    assert.equal(formatearTelefono("+5493512345678"), "+54 9 351 234-5678");
  });

  test("sin teléfono devuelve vacío, no 'null'", () => {
    assert.equal(formatearTelefono(null), "");
  });
});
