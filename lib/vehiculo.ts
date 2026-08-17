/**
 * Utilidades para formateo y presentación de datos de vehículos.
 */

export interface DatosVehiculoBadge {
  marca?: string | null;
  modelo?: string | null;
  anio?: number | string | null;
  motorizacion?: string | null;
}

/**
 * Formatea el badge estándar de un auto para toda la aplicación.
 *
 * Ejemplos:
 * - "Renault Fluence (2016) · 2.0 Turbo GT2 190cv"
 * - "Toyota Hilux (2024) · 2.8 TDI 204cv"
 * - "Volkswagen Gol Trend (2012)"
 * - "Peugeot 208 · 1.6 16v VTi 115cv"
 */
export function formatearVehiculoBadge(v?: DatosVehiculoBadge | null): string {
  if (!v) return "Sin datos de vehículo";

  const modeloBase = [v.marca, v.modelo].filter(Boolean).join(" ");
  const conAnio = v.anio
    ? (modeloBase ? `${modeloBase} (${v.anio})` : `(${v.anio})`)
    : modeloBase;

  if (v.motorizacion) {
    return conAnio ? `${conAnio} · ${v.motorizacion}` : v.motorizacion;
  }

  return conAnio || "Sin modelo especificado";
}
