/**
 * Lectura del código de la cédula del vehículo.
 *
 * Las cédulas del Mercosur traen un código (QR o PDF417) con los datos del
 * auto. Leerlo evita tipear la patente y el chasis a mano, que es donde se
 * cometen los errores que después dejan un auto duplicado en el sistema.
 *
 * Todo ocurre en el navegador: no sale ninguna foto del dispositivo, no hay
 * costo por uso y funciona sin conexión. Es la razón por la que se eligió
 * esto y no un OCR con IA.
 *
 * IMPORTANTE: el formato del payload no está estandarizado entre provincias
 * ni entre versiones de la cédula. Por eso el parseo intenta varias formas y
 * devuelve solo lo que reconoce con confianza; lo que no entiende queda como
 * texto crudo para poder revisarlo. La carga manual sigue siendo el camino
 * garantizado — esto es un acelerador, nunca un requisito.
 */

import { normalizarPatente, esPatenteValida } from "./patente.ts";

export interface DatosCedula {
  patente?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  vin?: string;
  motor?: string;
  titular?: string;
  /** El contenido tal cual vino, para depurar formatos nuevos. */
  crudo: string;
}

/** Una patente suelta dentro de un texto, en cualquiera de los formatos AR. */
const RE_PATENTE = /\b([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{3}\d{3}|[A-Z]\d{3}[A-Z]{3}|\d{3}[A-Z]{3})\b/;
/** El chasis es alfanumérico de 17 sin I, O ni Q. */
const RE_VIN = /\b([A-HJ-NPR-Z0-9]{17})\b/;
const RE_ANIO = /\b(19[5-9]\d|20[0-4]\d)\b/;

/**
 * Interpreta el contenido del código.
 *
 * Se conocen dos formas: separada por comas (la más común en las cédulas
 * Mercosur argentinas) y `clave:valor` por línea. Si no coincide con ninguna,
 * se buscan los patrones sueltos en el texto: sacar la patente aunque el
 * resto no se entienda ya ahorra la mitad del trabajo.
 */
export function interpretarCedula(texto: string): DatosCedula {
  const crudo = texto.trim();
  const datos: DatosCedula = { crudo };
  const arriba = crudo.toUpperCase();

  // Forma clave:valor, una por línea.
  const pares = new Map<string, string>();
  for (const linea of crudo.split(/[\r\n]+/)) {
    const m = linea.match(/^\s*([A-Za-zÁÉÍÓÚÑ ]+)\s*[:=]\s*(.+?)\s*$/);
    if (m) pares.set(m[1].trim().toUpperCase(), m[2].trim());
  }

  const buscar = (...claves: string[]) => {
    for (const c of claves) {
      for (const [k, v] of pares) if (k.includes(c)) return v;
    }
    return undefined;
  };

  const patenteDirecta = buscar("DOMINIO", "PATENTE");
  const candidataPatente = patenteDirecta ?? arriba.match(RE_PATENTE)?.[1];
  if (candidataPatente) {
    const norm = normalizarPatente(candidataPatente);
    // Solo se acepta si es una patente válida de verdad: una cadena
    // cualquiera del código no puede terminar cargada como dominio.
    if (esPatenteValida(norm)) datos.patente = norm;
  }

  datos.marca = buscar("MARCA");
  datos.modelo = buscar("MODELO");
  datos.titular = buscar("TITULAR", "APELLIDO", "NOMBRE");
  datos.motor = buscar("MOTOR");

  const vin = buscar("CHASIS", "VIN") ?? arriba.match(RE_VIN)?.[1];
  if (vin) datos.vin = vin.toUpperCase();

  const anioTexto = buscar("AÑO", "ANIO", "MODELO AÑO") ?? arriba.match(RE_ANIO)?.[1];
  const anio = anioTexto ? Number(anioTexto.match(/\d{4}/)?.[0]) : NaN;
  if (Number.isFinite(anio)) datos.anio = anio;

  // Forma separada por comas: se recorren los campos buscando lo reconocible
  // por su forma, sin asumir un orden que cambia entre provincias.
  if (!datos.patente && crudo.includes(",")) {
    for (const campo of crudo.split(",").map((c) => c.trim())) {
      const norm = normalizarPatente(campo);
      if (!datos.patente && esPatenteValida(norm)) datos.patente = norm;
      if (!datos.vin && RE_VIN.test(campo.toUpperCase())) datos.vin = campo.toUpperCase();
    }
  }

  return datos;
}

/** Qué se pudo reconocer, para decírselo al usuario sin que tenga que mirar. */
export function resumirCedula(d: DatosCedula): string {
  const partes: string[] = [];
  if (d.patente) partes.push(d.patente);
  if (d.marca) partes.push(d.marca);
  if (d.modelo) partes.push(d.modelo);
  if (d.anio) partes.push(String(d.anio));
  return partes.join(" · ");
}
