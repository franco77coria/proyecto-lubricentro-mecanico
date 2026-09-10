import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { sanitizarCedulaVerde } from "./cedula-verde.ts";

describe("sanitizarCedulaVerde", () => {
  test("sanitiza patente, marca, modelo, VIN y titular de cédula argentina", () => {
    const raw = {
      dominio: "AF 123 CD",
      marca: "VOLKSWAGEN",
      modelo: "GOL TREND 1.6 MSI 5P",
      anio: "2022",
      chasis: "8AWZZZ5UZNT123456",
      motor: "CCRA123456",
      combustible: "Nafta",
      titular: "GONZALEZ, MARIANO MARTIN",
      dni: "35.123.456",
      pais: "AR",
    };

    const res = sanitizarCedulaVerde(raw);

    assert.equal(res.patente, "AF123CD");
    assert.equal(res.marca, "VOLKSWAGEN");
    assert.equal(res.modelo, "GOL TREND 1.6 MSI 5P");
    assert.equal(res.anio, 2022);
    assert.equal(res.vin, "8AWZZZ5UZNT123456");
    assert.equal(res.motor, "CCRA123456");
    assert.equal(res.combustible, "nafta");
    assert.equal(res.titularNombre, "GONZALEZ, MARIANO MARTIN");
    assert.equal(res.titularDocumento, "35.123.456");
    assert.equal(res.pais, "AR");
    assert.equal(res.confianza, "alta");
  });

  test("maneja CRLV de Brasil y normaliza placa Mercosul", () => {
    const raw = {
      placa: "ABC-1D23",
      marca: "FIAT",
      modelo: "STRADA FREEDOM 1.3",
      ano: 2023,
      chassi: "9BD12345678901234",
      combustivel: "Flex",
      proprietario: "CARLOS SILVA",
      pais: "BR",
    };

    const res = sanitizarCedulaVerde(raw);

    assert.equal(res.patente, "ABC1D23");
    assert.equal(res.marca, "FIAT");
    assert.equal(res.combustible, "nafta");
    assert.equal(res.titularNombre, "CARLOS SILVA");
    assert.equal(res.pais, "BR");
  });

  test("detecta motorización 1.6 16V y código de motor K4M en Renault Fluence", () => {
    const raw = {
      patente: "LSJ 982",
      marca: "RENAULT",
      modelo: "FLUENCE 1.6 16V CONFORT",
      motor: "K4MV838R079119",
      chasis: "8A1LZB115DL468090",
      combustible: "Nafta",
    };

    const res = sanitizarCedulaVerde(raw);

    assert.equal(res.patente, "LSJ982");
    assert.equal(res.marca, "RENAULT");
    assert.equal(res.motorizacion, "1.6 16V");
    assert.equal(res.combustible, "nafta");
    assert.equal(res.motor, "K4MV838R079119");
    assert.equal(res.vin, "8A1LZB115DL468090");
  });
});
