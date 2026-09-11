/**
 * Utilidades puras para el subsistema de trámites legales, baja y arrepentimiento.
 */

export type TipoTramiteLegal = "BAJA" | "ARREP" | "ARCO";

export function generarCodigoTramite(prefijo: TipoTramiteLegal): string {
  const anio = new Date().getFullYear();
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let aleatorio = "";
  for (let i = 0; i < 6; i++) {
    aleatorio += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return `${prefijo}-${anio}-${aleatorio}`;
}
