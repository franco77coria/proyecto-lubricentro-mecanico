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

      const esValido = validarFirmaWebhookMP(xSignature, requestId, dataId);
      assert.equal(esValido, true);

      process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
    });

    test("rechaza firma alterada o con secret incorrecto", () => {
      process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;

      const dataId = "123456789";
      const requestId = "req_abc_123";
      const ts = "1710000000";
      const xSignature = `ts=${ts},v1=hash_falso_invalido_123456789abcdef`;

      const esValido = validarFirmaWebhookMP(xSignature, requestId, dataId);
      assert.equal(esValido, false);

      process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
    });

    test("rechaza si falta xSignature o dataId", () => {
      process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;

      assert.equal(validarFirmaWebhookMP(null, "req_1", "123"), false);
      assert.equal(validarFirmaWebhookMP("ts=1,v1=abc", "req_1", null), false);

      process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
    });

    test("rechaza si el timestamp o request-id fue adulterado en tránsito", () => {
      process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;

      const dataId = "123456789";
      const ts = "1710000000";
      const manifest = `id:${dataId};request-id:req_original;ts:${ts};`;
      const hash = crypto.createHmac("sha256", SECRET).update(manifest).digest("hex");
      const xSignature = `ts=${ts},v1=${hash}`;

      const esValido = validarFirmaWebhookMP(xSignature, "req_adulterado", dataId);
      assert.equal(esValido, false);

      process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
    });
  });
});
