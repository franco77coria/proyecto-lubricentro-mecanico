import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { calcularEstadoSuscripcion } from "./suscripcion.ts";

describe("calcularEstadoSuscripcion", () => {
  test("taller recién creado en su primer día de prueba de 7 días", () => {
    const ahora = Date.now();
    const trialFin = new Date(ahora + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = calcularEstadoSuscripcion({
      estado_suscripcion: "trial",
      trial_fin: trialFin,
    });

    assert.equal(res.tieneAcceso, true);
    assert.equal(res.enTrial, true);
    assert.equal(res.trialVencido, false);
    assert.equal(res.diasRestantesTrial, 7);
    assert.equal(res.estado, "trial");
  });

  test("taller al que le quedan 2 días de prueba", () => {
    const ahora = Date.now();
    const trialFin = new Date(ahora + 2 * 24 * 60 * 60 * 1000 - 1000).toISOString();
    const res = calcularEstadoSuscripcion({
      estado_suscripcion: "trial",
      trial_fin: trialFin,
    });

    assert.equal(res.tieneAcceso, true);
    assert.equal(res.enTrial, true);
    assert.equal(res.trialVencido, false);
    assert.equal(res.diasRestantesTrial, 2);
  });

  test("taller con los 7 días de prueba vencidos sin suscripción", () => {
    const ahora = Date.now();
    const trialFin = new Date(ahora - 2 * 60 * 60 * 1000).toISOString(); // venció hace 2 horas
    const res = calcularEstadoSuscripcion({
      estado_suscripcion: "trial",
      trial_fin: trialFin,
    });

    assert.equal(res.tieneAcceso, false);
    assert.equal(res.enTrial, false);
    assert.equal(res.trialVencido, true);
    assert.equal(res.diasRestantesTrial, 0);
    assert.equal(res.estado, "vencida");
  });

  test("taller con suscripción activa paga mediante Mercado Pago", () => {
    const ahora = Date.now();
    const trialFin = new Date(ahora - 10 * 24 * 60 * 60 * 1000).toISOString(); // trial venció hace 10 días
    const res = calcularEstadoSuscripcion({
      plan: "pro",
      estado_suscripcion: "activa",
      trial_fin: trialFin,
      suscripcion_fin: new Date(ahora + 25 * 24 * 60 * 60 * 1000).toISOString(),
    });

    assert.equal(res.tieneAcceso, true);
    assert.equal(res.enTrial, false);
    assert.equal(res.trialVencido, false);
    assert.equal(res.estado, "activa");
    assert.equal(res.plan, "pro");
    assert.equal(res.nombrePlan, "Plan Pro");
  });

  test("taller cancelado no tiene acceso aunque tuviera trial viejo", () => {
    const res = calcularEstadoSuscripcion({
      estado_suscripcion: "cancelada",
      trial_fin: new Date(Date.now() - 1000).toISOString(),
    });

    assert.equal(res.tieneAcceso, false);
    assert.equal(res.estado, "cancelada");
  });

  test("soporta los 2 planes con sus respectivos nombres", () => {
    const ahora = Date.now();
    const suscripcionFin = new Date(ahora + 30 * 24 * 60 * 60 * 1000).toISOString();

    const inicial = calcularEstadoSuscripcion({
      plan: "inicial",
      estado_suscripcion: "activa",
      suscripcion_fin: suscripcionFin,
    });
    assert.equal(inicial.plan, "inicial");
    assert.equal(inicial.nombrePlan, "Plan Inicial");

    const pro = calcularEstadoSuscripcion({
      plan: "pro",
      estado_suscripcion: "activa",
      suscripcion_fin: suscripcionFin,
    });
    assert.equal(pro.plan, "pro");
    assert.equal(pro.nombrePlan, "Plan Pro");
  });
});
