import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { interpretarCedula, resumirCedula, desglosarTitular } from "./cedula.ts";

describe("interpretarCedula", () => {
  test("interpreta cédula Mercosur separada por comas", () => {
    const texto = "AB123CD, TOYOTA, COROLLA, 2022, 8AJBA3FS0N1234567";
    const res = interpretarCedula(texto);
    assert.equal(res.patente, "AB123CD");
    assert.equal(res.vin, "8AJBA3FS0N1234567");
  });

  test("interpreta cédula formato clave:valor", () => {
    const texto = `
      Dominio: AA123BB
      Marca: FORD
      Modelo: RANGER
      Año: 2021
      Chasis: 8AFFR123456789012
      Titular: PEREZ JUAN
    `;
    const res = interpretarCedula(texto);
    assert.equal(res.patente, "AA123BB");
    assert.equal(res.marca, "FORD");
    assert.equal(res.modelo, "RANGER");
    assert.equal(res.anio, 2021);
    assert.equal(res.vin, "8AFFR123456789012");
    assert.equal(res.titular, "PEREZ JUAN");
  });

  test("extrae patente y VIN sueltos si el formato es desconocido", () => {
    const texto = "CÉDULA DE IDENTIFICACIÓN VEHICULAR AA123BB CHASSIS 8AFFR123456789012 MODELO 2020";
    const res = interpretarCedula(texto);
    assert.equal(res.patente, "AA123BB");
    assert.equal(res.vin, "8AFFR123456789012");
    assert.equal(res.anio, 2020);
  });
});

describe("resumirCedula", () => {
  test("resume los datos principales presentes", () => {
    const res = resumirCedula({
      patente: "AB123CD",
      marca: "TOYOTA",
      modelo: "COROLLA",
      anio: 2022,
      crudo: "...",
    });
    assert.equal(res, "AB123CD · TOYOTA · COROLLA · 2022");
  });
});

describe("desglosarTitular", () => {
  test("desglosa titular con coma (formato DNRPA clásico)", () => {
    const res = desglosarTitular("CORIA, FRANCO EZEQUIEL");
    assert.equal(res.apellido, "Coria");
    assert.equal(res.nombre, "Franco Ezequiel");
  });

  test("desglosa titular sin comas de 3 palabras", () => {
    const res = desglosarTitular("GONZALEZ JUAN CARLOS");
    assert.equal(res.apellido, "Gonzalez");
    assert.equal(res.nombre, "Juan Carlos");
  });

  test("desglosa titular de 2 palabras", () => {
    const res = desglosarTitular("PEREZ JUAN");
    assert.equal(res.apellido, "Perez");
    assert.equal(res.nombre, "Juan");
  });

  test("maneja titular vacío o nulo", () => {
    assert.deepEqual(desglosarTitular(null), { nombre: "", apellido: "" });
    assert.deepEqual(desglosarTitular(""), { nombre: "", apellido: "" });
  });
});
