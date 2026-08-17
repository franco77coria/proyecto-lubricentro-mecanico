import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { sanitizarOCRCompra } from "./ocr-compras.ts";

describe("sanitizarOCRCompra", () => {
  test("sanitiza y estructura correctamente los datos de factura y renglones", () => {
    const raw = {
      proveedor: "Distribuidora Warnes S.A.",
      cuit: "30-71122334-9",
      numero_comprobante: "0001-00045120",
      fecha: "2026-08-15",
      tipo_comprobante: "Factura A",
      items: [
        {
          codigo: "W712/52",
          descripcion: "Filtro de Aceite Mann",
          cantidad: 4,
          precio_unitario: 12000,
          subtotal: 48000,
        },
        {
          codigo: "ELAION-F50",
          descripcion: "Aceite YPF Elaion F50 5W40 4L",
          cantidad: 2,
          precio_unitario: 45000,
          subtotal: 90000,
        },
      ],
      total: 138000,
    };

    const res = sanitizarOCRCompra(raw);

    assert.equal(res.proveedor, "Distribuidora Warnes S.A.");
    assert.equal(res.cuitProveedor, "30-71122334-9");
    assert.equal(res.numeroComprobante, "0001-00045120");
    assert.equal(res.tipoComprobante, "factura_a");
    assert.equal(res.items.length, 2);
    assert.equal(res.items[0].codigo, "W712/52");
    assert.equal(res.items[0].cantidad, 4);
    assert.equal(res.items[0].precioUnitario, 12000);
    assert.equal(res.items[0].subtotal, 48000);
    assert.equal(res.total, 138000);
    assert.equal(res.confianza, "alta");
  });

  test("calcula el total si viene en 0 o nulo sumando los subtotales", () => {
    const raw = {
      proveedor: "Repuestos Belgrano",
      items: [
        {
          descripcion: "Juego de Pastillas Delanteras",
          cantidad: 1,
          precioUnitario: 35000,
        },
      ],
    };

    const res = sanitizarOCRCompra(raw);
    assert.equal(res.items[0].subtotal, 35000);
    assert.equal(res.total, 35000);
  });

  test("maneja remito físico sin precios asignando ceros y conservando cantidades", () => {
    const raw = {
      proveedor: "Expreso Sur",
      tipo_comprobante: "remito",
      items: [
        {
          descripcion: "Tambor Aceite 205L 15W40",
          cantidad: 1,
        },
      ],
    };

    const res = sanitizarOCRCompra(raw);
    assert.equal(res.tipoComprobante, "remito");
    assert.equal(res.items[0].cantidad, 1);
    assert.equal(res.items[0].precioUnitario, 0);
  });
});
