/**
 * Guardas del modelo de IA.
 *
 * Existe por un bug real: el string del modelo estaba copiado en tres archivos
 * y quedó apuntando a `claude-3-5-sonnet-latest`, que está RETIRADO. La API
 * devolvía 404 y las cuatro funciones de IA quedaron muertas sin que nada lo
 * avisara — cada una atrapa su error y cae a un fallback en silencio, así que
 * ni los logs gritaban.
 *
 * Estos tests no prueban que el modelo ande (eso necesita credencial y red).
 * Prueban las dos cosas que fallaron: que el modelo elegido no sea uno dado de
 * baja, y que siga habiendo UN solo lugar donde se elige.
 */

import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

import { MODELO_IA } from "./cliente.ts";

/**
 * Modelos que la API ya no sirve. Un pedido con cualquiera de estos devuelve
 * 404, no un error de "modelo viejo pero funcional".
 */
const RETIRADOS = [
  "claude-3-5-sonnet-latest",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-sonnet-20240620",
  "claude-3-5-haiku-20241022",
  "claude-3-7-sonnet-20250219",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-2.1",
  "claude-2.0",
];

describe("MODELO_IA", () => {
  test("no apunta a un modelo retirado", () => {
    assert.ok(
      !RETIRADOS.includes(MODELO_IA),
      `${MODELO_IA} está retirado: la API devuelve 404 y la IA queda muerta`,
    );
  });

  test("tiene forma de id de modelo de Anthropic", () => {
    assert.match(MODELO_IA, /^claude-[a-z0-9-]+$/);
  });

  test("el id no lleva sufijo de fecha inventado", () => {
    // Los alias actuales son completos tal cual: agregarles una fecha de
    // memoria ("claude-opus-5-20260101") es un 404 garantizado.
    assert.doesNotMatch(MODELO_IA, /-\d{8}$/);
  });
});

describe("un solo lugar donde se elige el modelo", () => {
  test("ningún archivo de lib/ia hardcodea un id de modelo", () => {
    const dir = new URL(".", import.meta.url);
    const culpables: string[] = [];

    for (const archivo of readdirSync(dir)) {
      if (!archivo.endsWith(".ts") || archivo === "cliente.ts") continue;
      if (archivo.endsWith(".test.ts")) continue;

      const contenido = readFileSync(new URL(archivo, dir), "utf8");
      // Un string literal que empieza con "claude-" es un modelo escrito a
      // mano. La constante importada no matchea porque no lleva comillas.
      for (const m of contenido.matchAll(/["'`](claude-[a-z0-9.-]+)["'`]/g)) {
        culpables.push(`${archivo}: ${m[1]}`);
      }
    }

    assert.deepEqual(
      culpables,
      [],
      `Estos archivos eligen el modelo por su cuenta en vez de importar MODELO_IA:\n  ${culpables.join("\n  ")}`,
    );
  });
});
