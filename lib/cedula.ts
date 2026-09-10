/**
 * Lectura del código de la cédula del vehículo.
 *
 * Las cédulas del Mercosur traen un código (QR o PDF417) con los datos del
 * auto. Leerlo evita tipear la patente y el chasis a mano, que es donde se
 * cometen los errores que después dejan un auto duplicado en el sistema.
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
  dni?: string;
  /** El contenido tal cual vino, para depurar formatos nuevos. */
  crudo: string;
}

/** Una patente suelta dentro de un texto, en cualquiera de los formatos AR. */
const RE_PATENTE = /\b([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{3}\d{3}|[A-Z]\d{3}[A-Z]{3}|\d{3}[A-Z]{3})\b/;
/** El chasis es alfanumérico de 17 sin I, O ni Q. */
const RE_VIN = /\b([A-HJ-NPR-Z0-9]{17})\b/;
const RE_ANIO = /\b(19\d{2}|20\d{2})\b/;
const RE_DNI = /\b(\d{7,8})\b/;

export function interpretarCedula(texto: string): DatosCedula {
  const crudo = texto.trim();
  const datos: DatosCedula = { crudo };
  const arriba = crudo.toUpperCase();

  // 1. Forma clave:valor, una por línea.
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
    if (esPatenteValida(norm)) datos.patente = norm;
  }

  datos.marca = buscar("MARCA");
  datos.modelo = buscar("MODELO");
  datos.titular = buscar("TITULAR", "APELLIDO", "NOMBRE");
  datos.motor = buscar("MOTOR");
  datos.dni = buscar("DNI", "DOCUMENTO");

  const vinDirecto = buscar("CHASIS", "VIN") ?? arriba.match(RE_VIN)?.[1];
  if (vinDirecto) datos.vin = vinDirecto.toUpperCase();

  const anioTexto = buscar("AÑO", "ANIO", "MODELO AÑO") ?? arriba.match(RE_ANIO)?.[1];
  const anio = anioTexto ? Number(anioTexto.match(/\d{4}/)?.[0]) : NaN;
  if (Number.isFinite(anio) && anio >= 1900 && anio <= new Date().getFullYear() + 2) {
    datos.anio = anio;
  }

  // 2. Forma separada por comas (PDF417 / Cédula física Mercosur DNRPA)
  if (crudo.includes(",")) {
    const campos = crudo.split(",").map((c) => c.trim()).filter(Boolean);

    for (let i = 0; i < campos.length; i++) {
      const campo = campos[i];
      const norm = normalizarPatente(campo);

      if (!datos.patente && esPatenteValida(norm)) {
        datos.patente = norm;
        continue;
      }

      if (!datos.vin && RE_VIN.test(campo.toUpperCase())) {
        datos.vin = campo.toUpperCase();
        continue;
      }

      if (!datos.anio && RE_ANIO.test(campo)) {
        const numAnio = Number(campo);
        if (numAnio >= 1900 && numAnio <= new Date().getFullYear() + 2) {
          datos.anio = numAnio;
          continue;
        }
      }

      // Titular: campo con texto alfabético de al menos 5 caracteres sin dígitos
      if (
        !datos.titular &&
        /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]{5,50}$/.test(campo) &&
        !/\d/.test(campo) &&
        campo.toUpperCase() !== datos.marca?.toUpperCase() &&
        campo.toUpperCase() !== datos.modelo?.toUpperCase() &&
        !["AUTO", "SEDAN", "RURAL", "PICKUP", "UTILITARIO", "HATCHBACK", "COUPE"].includes(campo.toUpperCase())
      ) {
        datos.titular = campo.toUpperCase();
      }

      // DNI
      if (!datos.dni && RE_DNI.test(campo) && campo !== String(datos.anio)) {
        datos.dni = campo;
      }
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
  if (d.titular) partes.push(d.titular);
  return partes.join(" · ");
}

/**
 * Desglosa y capitaliza el titular de una cédula (ej: "CORIA, FRANCO EZEQUIEL" o "CORIA FRANCO EZEQUIEL")
 * en apellido ("Coria") y nombre ("Franco Ezequiel").
 */
export function desglosarTitular(titular?: string | null): { nombre: string; apellido: string } {
  if (!titular?.trim()) return { nombre: "", apellido: "" };
  const limpio = titular.trim().replace(/\s+/g, " ");

  // 1. Formato con coma: "CORIA, FRANCO EZEQUIEL" o "DE LA VEGA, CARLOS"
  if (limpio.includes(",")) {
    const [ape, ...rest] = limpio.split(",");
    const nom = rest.join(" ").trim();
    return {
      apellido: capitalizarTexto(ape.trim()),
      nombre: capitalizarTexto(nom),
    };
  }

  // 2. Formato sin comas
  const partes = limpio.split(" ");
  if (partes.length === 1) {
    return { nombre: capitalizarTexto(partes[0]), apellido: "" };
  }
  if (partes.length === 2) {
    // Ej: "CORIA FRANCO" -> Apellido: "Coria", Nombre: "Franco"
    return { apellido: capitalizarTexto(partes[0]), nombre: capitalizarTexto(partes[1]) };
  }

  // 3 o más palabras (ej: "CORIA FRANCO EZEQUIEL"): en Argentina el primer token es el apellido
  return {
    apellido: capitalizarTexto(partes[0]),
    nombre: capitalizarTexto(partes.slice(1).join(" ")),
  };
}

function capitalizarTexto(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((palabra) => (palabra.length > 0 ? palabra[0].toUpperCase() + palabra.slice(1) : ""))
    .join(" ");
}

