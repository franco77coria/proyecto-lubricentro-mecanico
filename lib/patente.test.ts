import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  normalizarPatente,
  detectarFormato,
  esPatenteValida,
  formatearPatente,
  ayudaPatente,
} from "./patente.ts";

describe("normalizarPatente", () => {
  test("las tres formas de escribir la misma chapa colapsan en una", () => {
    for (const entrada of ["AB123CD", "ab 123 cd", "AB-123-CD", " ab123cd "]) {
      assert.equal(normalizarPatente(entrada), "AB123CD", `falló con "${entrada}"`);
    }
  });

  test("saca puntos, barras y cualquier separador", () => {
    assert.equal(normalizarPatente("A.B/123.C-D"), "AB123CD");
  });
});

describe("detectarFormato", () => {
  const casos = [
    ["AB123CD", "auto_mercosur"],
    ["RTF421", "auto_viejo"],
    ["123ABC", "moto_vieja"],
    ["A123BCD", "moto_mercosur"],
  ] as const;

  for (const [patente, formato] of casos) {
    test(`${patente} es ${formato}`, () => {
      assert.equal(detectarFormato(patente), formato);
    });
  }

  test("rechaza lo que no es una patente", () => {
    for (const basura of ["HOLA", "12345", "AAAA111", "", "AB12CD"]) {
      assert.equal(esPatenteValida(basura), false, `aceptó "${basura}"`);
    }
  });

  test("acepta minúsculas y separadores en todos los formatos", () => {
    assert.equal(detectarFormato("rtf-421"), "auto_viejo");
    assert.equal(detectarFormato("a 123 bcd"), "moto_mercosur");
  });
});

describe("formatearPatente", () => {
  test("agrupa para que se pueda dictar por teléfono", () => {
    assert.equal(formatearPatente("AB123CD"), "AB 123 CD");
    assert.equal(formatearPatente("RTF421"), "RTF 421");
    assert.equal(formatearPatente("A123BCD"), "A 123 BCD");
  });

  test("lo que no reconoce lo deja normalizado, sin inventar grupos", () => {
    assert.equal(formatearPatente("xyz"), "XYZ");
  });
});

describe("ayudaPatente", () => {
  test("no molesta mientras se está escribiendo", () => {
    for (const parcial of ["", "A", "AB", "AB1", "AB12", "AB123"]) {
      assert.equal(ayudaPatente(parcial), null, `avisó de más con "${parcial}"`);
    }
  });

  test("no dice nada cuando la patente es válida", () => {
    assert.equal(ayudaPatente("AB123CD"), null);
    assert.equal(ayudaPatente("RTF421"), null);
  });

  test("avisa recién cuando ya hay largo suficiente y no coincide", () => {
    assert.ok(ayudaPatente("ABC12D"));
    assert.ok(ayudaPatente("AB123CDE"));
  });
});
