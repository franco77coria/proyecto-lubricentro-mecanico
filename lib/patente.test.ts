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
    // Argentina
    ["AB123CD", "auto_mercosur"],
    ["RTF421", "auto_viejo"],
    ["123ABC", "moto_vieja"],
    ["A123BCD", "moto_mercosur"],
    // Brasil
    ["ABC1D23", "br_mercosur"],
    ["ABC12D3", "br_moto_mercosur"],
    ["ABC1234", "br_antigua"],
    // Chile
    ["BBBB10", "cl_nuevo"],
    ["AB1000", "cl_antiguo"],
    // España / UE
    ["1234BCD", "es_actual"],
    ["M1234AB", "es_provincial"],
    // México
    ["ABC123A", "mx_formato1"],
    // Colombia
    ["ABC12D", "co_moto"],
  ] as const;

  for (const [patente, formato] of casos) {
    test(`${patente} es ${formato}`, () => {
      assert.equal(detectarFormato(patente), formato);
    });
  }

  test("reconoce patentes válidas internacionales y locales", () => {
    assert.equal(esPatenteValida("AB123CD"), true);
    assert.equal(esPatenteValida("ABC1D23"), true);
    assert.equal(esPatenteValida("1234BCD"), true);
    assert.equal(esPatenteValida("BBBB10"), true);
    assert.equal(esPatenteValida(""), false);
  });

  test("acepta minúsculas y separadores en todos los formatos", () => {
    assert.equal(detectarFormato("rtf-421"), "auto_viejo");
    assert.equal(detectarFormato("a 123 bcd"), "moto_mercosur");
    assert.equal(detectarFormato("abc-1d23"), "br_mercosur");
    assert.equal(detectarFormato("1234-bcd"), "es_actual");
  });
});

describe("formatearPatente", () => {
  test("agrupa para que se pueda dictar por teléfono", () => {
    assert.equal(formatearPatente("AB123CD"), "AB 123 CD");
    assert.equal(formatearPatente("RTF421"), "RTF 421");
    assert.equal(formatearPatente("A123BCD"), "A 123 BCD");
    assert.equal(formatearPatente("ABC1D23"), "ABC·1D23");
    assert.equal(formatearPatente("1234BCD"), "1234 BCD");
    assert.equal(formatearPatente("BBBB10"), "BB·BB·10");
  });

  test("lo que no reconoce lo deja normalizado, sin inventar grupos", () => {
    assert.equal(formatearPatente("xyz"), "XYZ");
  });
});

describe("ayudaPatente", () => {
  test("no molesta mientras se está escribiendo", () => {
    assert.equal(ayudaPatente(""), null);
    assert.equal(ayudaPatente("A"), null);
  });

  test("no dice nada cuando la patente es válida", () => {
    assert.equal(ayudaPatente("AB123CD"), null);
    assert.equal(ayudaPatente("ABC1D23"), null);
    assert.equal(ayudaPatente("1234BCD"), null);
  });

  test("avisa recién cuando supera la longitud máxima", () => {
    assert.equal(ayudaPatente("AB123CDEXTRAORDINARIO"), "Máximo 12 caracteres");
  });
});
