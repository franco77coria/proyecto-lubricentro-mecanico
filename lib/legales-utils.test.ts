import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { generarCodigoTramite } from "./legales-utils.ts";

describe("Trámites Legales - Generación de Códigos", () => {
  test("generarCodigoTramite genera código con prefijo BAJA y año actual", () => {
    const anio = new Date().getFullYear();
    const codigo = generarCodigoTramite("BAJA");
    assert.match(codigo, new RegExp(`^BAJA-${anio}-[A-Z0-9]{6}$`));
  });

  test("generarCodigoTramite genera código con prefijo ARREP y año actual", () => {
    const anio = new Date().getFullYear();
    const codigo = generarCodigoTramite("ARREP");
    assert.match(codigo, new RegExp(`^ARREP-${anio}-[A-Z0-9]{6}$`));
  });

  test("generarCodigoTramite genera código con prefijo ARCO y año actual", () => {
    const anio = new Date().getFullYear();
    const codigo = generarCodigoTramite("ARCO");
    assert.match(codigo, new RegExp(`^ARCO-${anio}-[A-Z0-9]{6}$`));
  });

  test("códigos consecutivos son únicos", () => {
    const codigos = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codigos.add(generarCodigoTramite("BAJA"));
    }
    assert.equal(codigos.size, 50);
  });
});
