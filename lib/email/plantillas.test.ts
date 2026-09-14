import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  renderEmailBienvenida,
  renderEmailAvisoTrial,
  renderEmailTrialVencido,
  renderEmailPagoExitoso,
  renderEmailPagoFallido,
} from "./plantillas.ts";
import { enviarEmail } from "./cliente.ts";

describe("Plantillas de Email Transaccionales (Executive Card)", () => {
  test("renderEmailBienvenida incluye nombre, taller, 7 días de prueba y enlace al tablero", () => {
    const { asunto, html } = renderEmailBienvenida({
      nombreUsuario: "Martín",
      nombreTaller: "Lubricentro San Cayetano",
      appUrl: "https://fierros.app",
    });

    assert.ok(asunto.includes("Fierros"));
    assert.ok(asunto.includes("7 días"));
    assert.ok(html.includes("Martín"));
    assert.ok(html.includes("Lubricentro San Cayetano"));
    assert.ok(html.includes("https://fierros.app/tablero"));
    assert.ok(html.includes("FIERROS"));
    assert.ok(html.includes("Prueba Activa"));
  });

  test("renderEmailAvisoTrial indica días restantes (48hs) y enlace a suscripción", () => {
    const { asunto, html } = renderEmailAvisoTrial({
      nombreUsuario: "Carlos",
      nombreTaller: "Taller Mecánico Carlos",
      diasRestantes: 2,
      appUrl: "https://fierros.app",
    });

    assert.ok(asunto.includes("2 días"));
    assert.ok(html.includes("Quedan 2 Días de Prueba"));
    assert.ok(html.includes("https://fierros.app/suscripcion"));
    assert.ok(html.includes("Plan Inicial"));
    assert.ok(html.includes("Plan Pro"));
    assert.ok(html.includes("29.900"));
    assert.ok(html.includes("44.900"));
  });

  test("renderEmailTrialVencido informa finalización de prueba y resguardo de datos", () => {
    const { asunto, html } = renderEmailTrialVencido({
      nombreUsuario: "Esteban",
      nombreTaller: "Boxes Rápidos",
      appUrl: "https://fierros.app",
    });

    assert.ok(asunto.includes("finalizado"));
    assert.ok(html.includes("Prueba Finalizada"));
    assert.ok(html.includes("Reactivar mi Taller Ahora"));
    assert.ok(html.includes("https://fierros.app/suscripcion"));
    assert.ok(html.includes("100% seguros y respaldados"));
  });

  test("renderEmailPagoExitoso detalla el plan, monto en pesos y confirmación", () => {
    const { asunto, html } = renderEmailPagoExitoso({
      nombreUsuario: "Franco",
      nombreTaller: "Fierros Racing",
      planNombre: "Plan Pro",
      montoARS: 44900,
      fechaVigencia: "2026-10-15T00:00:00.000Z",
      idOperacion: "MP-987654321",
      appUrl: "https://fierros.app",
    });

    assert.ok(asunto.includes("Suscripción confirmada"));
    assert.ok(html.includes("Plan Pro"));
    assert.ok(html.includes("44.900"));
    assert.ok(html.includes("MP-987654321"));
    assert.ok(html.includes("Suscripción Activa"));
    assert.ok(html.includes("https://fierros.app/tablero"));
  });

  test("renderEmailPagoFallido advierte sobre fallo en tarjeta y da período de gracia", () => {
    const { asunto, html } = renderEmailPagoFallido({
      nombreUsuario: "Jorge",
      nombreTaller: "Taller Norte",
      motivo: "Fondos insuficientes en la tarjeta de débito",
      appUrl: "https://fierros.app",
    });

    assert.ok(asunto.includes("No pudimos procesar el cobro"));
    assert.ok(html.includes("Pago Pendiente"));
    assert.ok(html.includes("Fondos insuficientes"));
    assert.ok(html.includes("Actualizar Medio de Pago"));
    assert.ok(html.includes("https://fierros.app/suscripcion"));
  });

  test("enviarEmail en entorno local o sin API key devuelve simulado exitoso sin arrojar error", async () => {
    const res = await enviarEmail({
      para: "test@ejemplo.com",
      asunto: "Test de prueba",
      html: "<p>Hola</p>",
    });

    assert.equal(res.ok, true);
    assert.ok(res.id?.startsWith("simulado_"));
  });
});
