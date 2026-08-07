/**
 * Física de los gestos.
 *
 * Funciones puras, sin React ni DOM, para poder probarlas. Son las que hacen
 * que un arrastre se sienta nativo en vez de "web con animación".
 */

/**
 * Proyecta dónde va a terminar algo que se soltó con cierta velocidad.
 *
 * Es la clave de que un flick se sienta como un envión: al soltar NO se salta
 * al detent más cercano a donde quedó el dedo, sino al más cercano a donde el
 * gesto *iba*. Un movimiento corto y rápido tiene que llegar lejos.
 *
 * Es la misma curva de desaceleración que usa el scroll del sistema
 * (decaimiento exponencial). Ojo: NO es la fórmula de manual v²/(2·a) —
 * esa da otra sensación y no es la que se percibe como nativa.
 *
 * @param velocidad px/s al momento de soltar
 * @param deceleracion 0.998 = scroll normal, 0.99 = más seco
 * @returns desplazamiento adicional en px (con el signo de la velocidad)
 */
export function proyectar(velocidad: number, deceleracion = 0.998): number {
  return ((velocidad / 1000) * deceleracion) / (1 - deceleracion);
}

/**
 * Resistencia progresiva al pasarse de un borde.
 *
 * Frenar en seco se lee como "se colgó"; resistir cada vez más se lee como
 * "responde, pero acá se terminó". Cuanto más lejos se arrastra, menos sigue.
 *
 * @param exceso cuánto se pasó del límite, en px
 * @param dimension tamaño de referencia (normalmente el alto del contenedor)
 * @param constante 0.55 es el valor que usa iOS
 */
export function rubberband(exceso: number, dimension: number, constante = 0.55): number {
  if (dimension <= 0) return 0;
  return (exceso * dimension * constante) / (dimension + constante * Math.abs(exceso));
}

/** Acota un valor entre un mínimo y un máximo. */
export function acotar(valor: number, min: number, max: number): number {
  return Math.min(Math.max(valor, min), max);
}

/**
 * Aplica el límite con rubber-band: dentro del rango sigue al dedo 1:1,
 * fuera resiste.
 */
export function acotarElastico(
  valor: number,
  min: number,
  max: number,
  dimension: number,
): number {
  if (valor < min) return min + rubberband(valor - min, dimension);
  if (valor > max) return max + rubberband(valor - max, dimension);
  return valor;
}

/**
 * Elige a qué detent ir, proyectando primero el momento del gesto.
 *
 * @param posicion dónde quedó al soltar
 * @param velocidad px/s al soltar
 * @param detents posiciones posibles (no hace falta que estén ordenadas)
 */
export function detentDestino(
  posicion: number,
  velocidad: number,
  detents: readonly number[],
): number {
  if (detents.length === 0) return posicion;

  const proyectada = posicion + proyectar(velocidad);

  let mejor = detents[0];
  let menorDistancia = Math.abs(proyectada - mejor);

  for (const d of detents) {
    const distancia = Math.abs(proyectada - d);
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      mejor = d;
    }
  }
  return mejor;
}

/**
 * Velocidad a partir de un historial de muestras.
 *
 * Se usa una ventana corta en vez de los dos últimos puntos: un solo par de
 * eventos da una velocidad ruidosa, y si el dedo se frenó justo antes de
 * soltar hay que respetarlo (soltar quieto NO debe salir disparado).
 */
export interface Muestra {
  valor: number;
  t: number;
}

export function velocidadDesde(muestras: readonly Muestra[], ventanaMs = 100): number {
  if (muestras.length < 2) return 0;

  const ultima = muestras[muestras.length - 1];
  let primera = muestras[0];

  for (let i = muestras.length - 1; i >= 0; i--) {
    if (ultima.t - muestras[i].t > ventanaMs) break;
    primera = muestras[i];
  }

  const dt = ultima.t - primera.t;
  if (dt <= 0) return 0;

  return ((ultima.valor - primera.valor) / dt) * 1000;
}
