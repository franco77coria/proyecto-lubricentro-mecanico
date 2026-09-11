/**
 * Escapa un término de búsqueda de usuario para meterlo adentro de un filtro
 * `.or("campo.ilike.%valor%,...")` de PostgREST.
 *
 * `,`, `(` y `)` son caracteres estructurales de ese mini-lenguaje (separan
 * condiciones y delimitan el grupo del propio `or(...)`). Si el texto que
 * escribió el usuario los trae sin escapar — un teléfono tipeado como
 * "(11) 4555-6677", que es la forma más natural de escribirlo — la consulta
 * queda mal formada. Supabase la devuelve como error, el código no lo mira
 * (`const { data } = await query`) y la pantalla muestra "sin resultados"
 * como si de verdad no hubiera nadie.
 */
export function escaparParaFiltroOr(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/[,()]/g, "\\$&");
}
