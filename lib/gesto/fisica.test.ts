import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  proyectar,
  rubberband,
  acotarElastico,
  detentDestino,
  velocidadDesde,
} from "./fisica.ts";

describe("proyectar", () => {
  test("soltar quieto no proyecta nada", () => {
    assert.equal(proyectar(0), 0);
  });

  test("conserva el signo de la velocidad", () => {
    assert.ok(proyectar(500) > 0);
    assert.ok(proyectar(-500) < 0);
  });

  test("un flick corto llega lejos: 500 px/s proyecta ~250 px", () => {
    // Es lo que hace que un movimiento chico se sienta como un envión.
    assert.ok(Math.abs(proyectar(500) - 249.5) < 1);
  });

  test("más deceleración = llega menos lejos", () => {
    assert.ok(proyectar(500, 0.99) < proyectar(500, 0.998));
  });
});

describe("rubberband", () => {
  test("sin exceso no hay desplazamiento", () => {
    assert.equal(rubberband(0, 800), 0);
  });

  test("resiste: siempre devuelve menos que el exceso arrastrado", () => {
    for (const exceso of [10, 50, 100, 300]) {
      assert.ok(rubberband(exceso, 800) < exceso, `falló con ${exceso}`);
    }
  });

  test("la resistencia crece: al doble de arrastre, menos del doble de avance", () => {
    const a = rubberband(100, 800);
    const b = rubberband(200, 800);
    assert.ok(b < a * 2);
  });

  test("es simétrico hacia ambos lados", () => {
    assert.equal(rubberband(-100, 800), -rubberband(100, 800));
  });

  test("por más que se arrastre nunca se corre más que el alto del contenedor", () => {
    // El límite de (x·d·c)/(d + c·x) cuando x→∞ es d. Arrastrar 100 metros
    // y arrastrar 100 km dan casi lo mismo: el tope es la dimensión.
    assert.ok(rubberband(100_000, 800) < 800);
    assert.ok(rubberband(100_000, 800) > 780);
  });
});

describe("acotarElastico", () => {
  test("dentro del rango sigue al dedo 1:1", () => {
    assert.equal(acotarElastico(50, 0, 100, 800), 50);
  });

  test("pasado el borde resiste en vez de frenar en seco", () => {
    const r = acotarElastico(-40, 0, 100, 800);
    assert.ok(r < 0 && r > -40, `esperaba resistencia, dio ${r}`);
  });
});

describe("detentDestino", () => {
  const detents = [0, 400, 800];

  test("sin velocidad va al más cercano", () => {
    assert.equal(detentDestino(380, 0, detents), 400);
    assert.equal(detentDestino(120, 0, detents), 0);
  });

  test("un flick hacia abajo pasa de largo el más cercano", () => {
    // Quedó casi en 0 pero venía lanzado: tiene que irse a 400, no volver a 0.
    assert.equal(detentDestino(100, 800, detents), 400);
  });

  test("un flick hacia arriba cierra aunque haya quedado lejos", () => {
    assert.equal(detentDestino(300, -900, detents), 0);
  });

  test("soltar quieto cerca de un detent no se lo saltea", () => {
    assert.equal(detentDestino(390, 10, detents), 400);
  });

  test("sin detents devuelve la posición", () => {
    assert.equal(detentDestino(123, 500, []), 123);
  });
});

describe("velocidadDesde", () => {
  test("con menos de dos muestras no hay velocidad", () => {
    assert.equal(velocidadDesde([]), 0);
    assert.equal(velocidadDesde([{ valor: 10, t: 0 }]), 0);
  });

  test("100 px en 100 ms son 1000 px/s", () => {
    assert.equal(
      velocidadDesde([
        { valor: 0, t: 0 },
        { valor: 100, t: 100 },
      ]),
      1000,
    );
  });

  test("ignora las muestras viejas fuera de la ventana", () => {
    // El dedo venía rapidísimo y en los últimos 100 ms se frenó del todo:
    // soltar quieto NO puede salir disparado.
    const v = velocidadDesde([
      { valor: 0, t: 0 },
      { valor: 900, t: 900 },
      { valor: 900, t: 1000 },
    ]);
    assert.equal(v, 0);
  });

  test("detecta el sentido inverso", () => {
    assert.ok(
      velocidadDesde([
        { valor: 100, t: 0 },
        { valor: 0, t: 100 },
      ]) < 0,
    );
  });

  test("muestras con el mismo timestamp no rompen", () => {
    assert.equal(
      velocidadDesde([
        { valor: 0, t: 50 },
        { valor: 100, t: 50 },
      ]),
      0,
    );
  });
});
