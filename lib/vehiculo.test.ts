import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { formatearVehiculoBadge } from "./vehiculo.ts";

describe("formatearVehiculoBadge", () => {
  test("formatea marca, modelo, año y motorización", () => {
    const res = formatearVehiculoBadge({
      marca: "Renault",
      modelo: "Fluence",
      anio: 2016,
      motorizacion: "2.0 Turbo GT2 190cv",
    });
    assert.equal(res, "Renault Fluence (2016) · 2.0 Turbo GT2 190cv");
  });

  test("formatea sin año", () => {
    const res = formatearVehiculoBadge({
      marca: "Volkswagen",
      modelo: "Amarok",
      motorizacion: "3.0 V6 TDI 258cv",
    });
    assert.equal(res, "Volkswagen Amarok · 3.0 V6 TDI 258cv");
  });

  test("formatea sin motorización", () => {
    const res = formatearVehiculoBadge({
      marca: "Toyota",
      modelo: "Hilux",
      anio: 2024,
    });
    assert.equal(res, "Toyota Hilux (2024)");
  });

  test("maneja vehículo nulo", () => {
    assert.equal(formatearVehiculoBadge(null), "Sin datos de vehículo");
  });
});
