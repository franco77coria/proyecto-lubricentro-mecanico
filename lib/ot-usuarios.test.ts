import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { obtenerResponsablesOT, formatearRol } from "./ot-usuarios.ts";

describe("formatearRol", () => {
  test("formatea dueno como Dueño / Encargado", () => {
    assert.equal(formatearRol("dueno"), "Dueño / Encargado");
  });

  test("formatea mecanico como Mecánico", () => {
    assert.equal(formatearRol("mecanico"), "Mecánico");
  });

  test("formatea nulo como Taller", () => {
    assert.equal(formatearRol(null), "Taller");
  });
});

describe("obtenerResponsablesOT", () => {
  test("orden en curso con mecánico asignado", () => {
    const res = obtenerResponsablesOT({
      estado: "en_trabajo",
      mecanico: { user_id: "u1", nombre: "Carlos Gómez", rol: "mecanico" },
      logs: [],
    });
    assert.equal(res.mecanicoNombre, "Carlos Gómez");
    assert.equal(res.cerradoPorNombre, null);
    assert.equal(res.resumen, "Mecánico asignado: Carlos Gómez");
  });

  test("orden en curso sin mecánico", () => {
    const res = obtenerResponsablesOT({
      estado: "recibido",
      mecanico: null,
      logs: [],
    });
    assert.equal(res.mecanicoNombre, null);
    assert.equal(res.cerradoPorNombre, null);
    assert.equal(res.resumen, "Sin mecánico asignado");
  });

  test("orden cerrada por el mismo mecánico que la hizo", () => {
    const res = obtenerResponsablesOT({
      estado: "cerrado",
      mecanico: { user_id: "u1", nombre: "Carlos Gómez", rol: "mecanico" },
      logs: [
        {
          estado_nuevo: "cerrado",
          creado_en: "2026-08-10T15:00:00Z",
          usuario: { user_id: "u1", nombre: "Carlos Gómez", rol: "mecanico" },
        },
      ],
    });
    assert.equal(res.mecanicoNombre, "Carlos Gómez");
    assert.equal(res.cerradoPorNombre, "Carlos Gómez");
    assert.equal(res.resumen, "Hecho y cerrado por Carlos Gómez");
  });

  test("orden cerrada por el encargado/dueño pero realizada por otro mecánico", () => {
    const res = obtenerResponsablesOT({
      estado: "entregado",
      mecanico: { user_id: "u1", nombre: "Carlos Gómez", rol: "mecanico" },
      logs: [
        {
          estado_nuevo: "en_trabajo",
          creado_en: "2026-08-10T10:00:00Z",
          usuario: { user_id: "u1", nombre: "Carlos Gómez", rol: "mecanico" },
        },
        {
          estado_nuevo: "entregado",
          creado_en: "2026-08-10T18:00:00Z",
          usuario: { user_id: "u2", nombre: "Lucas Taller", rol: "dueno" },
        },
      ],
    });
    assert.equal(res.mecanicoNombre, "Carlos Gómez");
    assert.equal(res.cerradoPorNombre, "Lucas Taller");
    assert.equal(res.cerradoPorRol, "dueno");
    assert.equal(res.resumen, "Hecho por Carlos Gómez · Cerrado por Lucas Taller");
  });

  test("orden histórica sin log pero con mecánico asignado", () => {
    const res = obtenerResponsablesOT({
      estado: "cerrado",
      fecha_entrega: "2026-08-01T12:00:00Z",
      mecanico: { user_id: "u1", nombre: "Mario", rol: "mecanico" },
      logs: [],
    });
    assert.equal(res.mecanicoNombre, "Mario");
    assert.equal(res.cerradoPorNombre, "Mario");
    assert.equal(res.resumen, "Hecho y cerrado por Mario");
  });
});
