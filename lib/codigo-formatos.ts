/**
 * Formatos de códigos y tipos livianos para evitar el bundling
 * prematuro de zxing-wasm en componentes que solo necesitan las constantes.
 */

export type FormatoCodigo =
  | "Aztec"
  | "Codabar"
  | "Code39"
  | "Code93"
  | "Code128"
  | "DataBar"
  | "DataBarExpanded"
  | "DataMatrix"
  | "EAN8"
  | "EAN13"
  | "ITF"
  | "MaxiCode"
  | "PDF417"
  | "QRCode"
  | "UPCA"
  | "UPCE"
  | "MicroQRCode"
  | "RMQRCode"
  | "rMQRCode";

export type FormatosCodigo = FormatoCodigo[];

/** Los dos formatos que traen las cédulas del Mercosur. */
export const FORMATOS_CEDULA: FormatosCodigo = ["PDF417", "QRCode"];

/** Lo que trae pegado un bidón de aceite o la caja de un filtro. */
export const FORMATOS_PRODUCTO: FormatosCodigo = [
  "EAN13",
  "EAN8",
  "UPCA",
  "UPCE",
  "Code128",
  "Code39",
  "ITF",
  "QRCode",
  "DataMatrix",
];
