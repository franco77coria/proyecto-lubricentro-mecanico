/**
 * Estados de una orden de trabajo: nombre y color.
 *
 * Vive en un solo archivo porque el estado aparece en el tablero, en la ficha
 * de la orden, en el historial del auto y en el PDF. Cuando cada pantalla
 * define su propio color, el mismo estado termina de un color distinto en cada
 * lugar y deja de servir para reconocerlo de un vistazo.
 *
 * Los tonos son claros con texto oscuro a propósito: el taller tiene el portón
 * abierto y con sol los fondos saturados se vuelven ilegibles.
 */

export const ESTADO_LABEL: Record<string, string> = {
  presupuesto: "Presupuesto",
  aprobado: "Aprobado",
  recibido: "Recibido",
  en_trabajo: "En trabajo",
  esperando_repuesto: "Esperando repuesto",
  listo: "Listo para entregar",
  entregado: "Entregado",
  cerrado: "Cerrado",
  anulado: "Anulado",
};

export const ESTADO_TONO: Record<string, string> = {
  presupuesto: "bg-slate-500/15 text-slate-300 border border-slate-500/30",
  aprobado: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
  recibido: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
  en_trabajo: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  esperando_repuesto: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
  listo: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  entregado: "bg-zinc-800 text-zinc-300 border border-zinc-700/50",
  cerrado: "bg-zinc-900 text-zinc-400 border border-zinc-800",
  anulado: "bg-red-500/15 text-red-400 border border-red-500/30",
};

/** Orden real del flujo, para las pantallas que lo muestran como progreso. */
export const FLUJO_ESTADOS = [
  "presupuesto",
  "aprobado",
  "recibido",
  "en_trabajo",
  "esperando_repuesto",
  "listo",
  "entregado",
  "cerrado",
] as const;

export type EstadoDb = (typeof FLUJO_ESTADOS)[number];

/**
 * Las columnas del tablero de pared.
 *
 * Termina en `listo` y no incluye entregado ni cerrado: el tablero muestra lo
 * que HAY en el taller. Un auto entregado ya no está, y dejarlo en una columna
 * hace que el tablero crezca para siempre hasta volverse ilegible — que es
 * exactamente lo que le pasa al pizarrón de verdad.
 */
export const COLUMNAS_KANBAN: readonly EstadoDb[] = [
  "presupuesto",
  "aprobado",
  "recibido",
  "en_trabajo",
  "esperando_repuesto",
  "listo",
];

export function etiquetaEstado(estado: string): string {
  return ESTADO_LABEL[estado] ?? estado;
}
