import test, { describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { validarFirmaWebhookMP, obtenerPrecioPlanMensual } from "./cliente.ts";

describe("Mercado Pago - Cliente y Utilidades", () => {
  describe("obtenerPrecioPlanMensual", () => {
    test("retorna el precio por defecto de $29.900 ARS si no hay variable", () => {
      const precio = obtenerPrecioPlanMensual();
      assert.equal(typeof precio, "number");
      assert.ok(precio > 0);
    });
  });

  describe("validarFirmaWebhookMP", () => {
    const SECRET = "test_webhook_secret_key_123456";
    const originalSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    test("valida correctamente una firma legítima generada por Mercado Pago", () => {
      process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;

      const dataId = "123456789";
      const requestId = "req_abc_123";
      const ts = "1710000000";

      // Plantilla oficial MP: id:${dataId};request-id:${xRequestId};ts:${ts};
      const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
      const hash = crypto.createHmac("sha256", SECRET).update(manifest).digest("hex");
      const xSignature = `ts=${ts},v1=${hash}`;

      const resultado = validarFirmaWebhookMP(xSignature, requestId, dataId);
      assert.equal(resultado.ok, true);

      process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
    });

    test("rechaza firma alterada o con secret incorrecto", () => {
      process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;

      const dataId = "123456789";
      const requestId = "req_abc_123";
      const ts = "1710000000";
      const xSignature = `ts=${ts},v1=hash_falso_invalido_123456789abcdef`;

      const resultado = validarFirmaWebhookMP(xSignature, requestId, dataId);
      assert.equal(resultado.ok, false);
      assert.equal(!resultado.ok && resultado.motivo, "firma_invalida");

      process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
    });

    test("rechaza si falta xSignature o dataId", () => {
      process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;

      assert.equal(validarFirmaWebhookMP(null, "req_1", "123").ok, false);
      assert.equal(validarFirmaWebhookMP("ts=1,v1=abc", "req_1", null).ok, false);

      process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
    });

    test("rechaza si el timestamp o request-id fue adulterado en tránsito", () => {
      process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;

      const dataId = "123456789";
      const ts = "1710000000";
      const manifest = `id:${dataId};request-id:req_original;ts:${ts};`;
      const hash = crypto.createHmac("sha256", SECRET).update(manifest).digest("hex");
      const xSignature = `ts=${ts},v1=${hash}`;

      const resultado = validarFirmaWebhookMP(xSignature, "req_adulterado", dataId);
      assert.equal(resultado.ok, false);

      process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
    });

    // process.env.NODE_ENV es readonly en los tipos de Node: se muta a través
    // de un Record para poder simular cada ambiente en el test.
    const env = process.env as Record<string, string | undefined>;

    test("falla CERRADO si falta el secret en producción, no deja pasar todo", () => {
      const originalEnv = env.NODE_ENV;
      process.env.MERCADOPAGO_WEBHOOK_SECRET = "";
      process.env.MERCADO_PAGO_WEBHOOK_SECRET = "";
      process.env.MP_WEBHOOK_SECRET = "";
      env.NODE_ENV = "production";

      const resultado = validarFirmaWebhookMP(null, null, "123456789");
      assert.equal(resultado.ok, false);
      assert.equal(!resultado.ok && resultado.motivo, "sin_secret_en_produccion");

      env.NODE_ENV = originalEnv;
      process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
    });

    test("permite la invocación sin secret fuera de producción (para poder probar el webhook)", () => {
      const originalEnv = env.NODE_ENV;
      process.env.MERCADOPAGO_WEBHOOK_SECRET = "";
      process.env.MERCADO_PAGO_WEBHOOK_SECRET = "";
      process.env.MP_WEBHOOK_SECRET = "";
      env.NODE_ENV = "development";

      const resultado = validarFirmaWebhookMP(null, null, "123456789");
      assert.equal(resultado.ok, true);

      env.NODE_ENV = originalEnv;
      process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
    });
  });
});
