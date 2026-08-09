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
  presupuesto: "bg-slate-100 text-slate-700",
  aprobado: "bg-sky-50 text-sky-700",
  recibido: "bg-indigo-50 text-indigo-700",
  en_trabajo: "bg-amber-50 text-amber-800",
  esperando_repuesto: "bg-violet-50 text-violet-700",
  listo: "bg-emerald-50 text-emerald-700",
  entregado: "bg-slate-100 text-slate-600",
  cerrado: "bg-slate-900 text-white",
  anulado: "bg-red-50 text-red-700",
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
