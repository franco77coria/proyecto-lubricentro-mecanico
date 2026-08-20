/**
 * Fechas del negocio.
 *
 * `new Date().toISOString().slice(0, 10)` NO es "hoy": es la fecha en UTC. En
 * el servidor de Vercel, que corre en UTC, a partir de las 21:00 de Argentina
 * ya devuelve el día siguiente. Eso partía en dos la telemetría de uso —que
 * tiene un UNIQUE por (taller, usuario, fecha)— y hacía que el panel de
 * auditoría del dueño mostrara horas repartidas en el día equivocado.
 *
 * Es la lección #80 del CLAUDE.md. `realizarCierreCaja` ya lo hacía bien con
 * Intl; el resto del código no. Acá queda una sola forma de preguntar qué día
 * es en el taller.
 */

/**
 * Zona horaria por país.
 *
 * El taller guarda el país (ISO-2, migración 0041) y no la zona, porque el
 * país es lo que alguien sabe contestar. Para los países con varias zonas se
 * elige la del centro económico, que es donde está el taller en la práctica.
 * Cuando eso no alcance, la solución es guardar la zona en `taller`, no
 * adivinar mejor acá.
 */
const ZONAS: Record<string, string> = {
  AR: "America/Argentina/Buenos_Aires",
  UY: "America/Montevideo",
  PY: "America/Asuncion",
  BO: "America/La_Paz",
  CL: "America/Santiago",
  PE: "America/Lima",
  EC: "America/Guayaquil",
  CO: "America/Bogota",
  VE: "America/Caracas",
  BR: "America/Sao_Paulo",
  MX: "America/Mexico_City",
  ES: "Europe/Madrid",
  US: "America/New_York",
};

export const ZONA_POR_DEFECTO = ZONAS.AR;

export function zonaHorariaDePais(pais?: string | null): string {
  if (!pais) return ZONA_POR_DEFECTO;
  return ZONAS[pais.trim().toUpperCase()] ?? ZONA_POR_DEFECTO;
}

/**
 * El día de hoy en el taller, como `YYYY-MM-DD`.
 *
 * Se usa el locale `en-CA` porque es el único que formatea ISO nativamente:
 * evita tener que rearmar la cadena a mano desde las partes.
 */
export function hoyEnZona(zona: string = ZONA_POR_DEFECTO): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Una fecha corrida N días desde hoy, en la zona del taller. Negativo va al
 *  pasado: `fechaDesplazada(-7)` es "hace una semana". */
export function fechaDesplazada(dias: number, zona: string = ZONA_POR_DEFECTO): string {
  const base = new Date(`${hoyEnZona(zona)}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

/**
 * El instante en que arrancó el día del taller.
 *
 * Para comparar contra columnas `timestamptz` (los cobros del día, por
 * ejemplo). Se resuelve el offset real de esa fecha en esa zona en vez de
 * escribir `-03:00` a mano, que se rompe con el horario de verano.
 */
export function inicioDelDiaEnZona(zona: string = ZONA_POR_DEFECTO, fecha?: string): Date {
  const dia = fecha ?? hoyEnZona(zona);
  const tentativa = new Date(`${dia}T00:00:00Z`);

  // Cuánto se corre esa zona respecto de UTC en ese momento exacto.
  const comoLocal = new Date(tentativa.toLocaleString("en-US", { timeZone: zona }));
  const comoUtc = new Date(tentativa.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = comoUtc.getTime() - comoLocal.getTime();

  return new Date(tentativa.getTime() + offsetMs);
}
