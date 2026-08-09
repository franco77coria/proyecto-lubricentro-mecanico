/**
 * Lectura de códigos (PDF417 de la cédula, códigos de barras del stock).
 *
 * Todo pasa en el navegador con ZXing compilado a WebAssembly: no sale ninguna
 * imagen del dispositivo, no hay costo por uso y funciona sin conexión. Es la
 * razón por la que se eligió esto y no un OCR con IA en la nube.
 *
 * El .wasm se sirve desde `/public` y NO desde el CDN de jsDelivr, que es el
 * default de la librería. Dos motivos, en orden de importancia:
 *   - El taller tiene señal mala. Un lector que necesita bajar 1 MB de un CDN
 *     ajeno antes de leer la primera cédula no sirve al lado de la fosa.
 *   - Es un origen externo más al que pedirle permiso el día que se sume una CSP.
 *
 * El archivo se copia en `postinstall` (ver package.json): si se actualiza
 * zxing-wasm y el .wasm queda viejo, el módulo no instancia. Mejor que se
 * regenere solo que acordarse de copiarlo a mano.
 */

import { prepareZXingModule, readBarcodes, type ReaderOptions } from "zxing-wasm/reader";

export type FormatosCodigo = NonNullable<ReaderOptions["formats"]>;

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

let preparado = false;
let binarioWasm: ArrayBuffer | null = null;

/**
 * Entrega el .wasm ya leído en vez de dejar que el módulo lo busque solo.
 *
 * Existe para los tests: el build de ZXing es para navegador y trae el .wasm
 * con `fetch`, que en Node no resuelve rutas del filesystem. Pasando los bytes
 * el test puede ejercitar ESTA `leerCodigo` y no una copia — sin eso la lectura
 * quedaría sin cubrir y el día que la librería cambie de API nos enteraríamos
 * en el taller, con el auto arriba del elevador.
 *
 * En el navegador no se llama nunca: ahí alcanza con la ruta de `/public`.
 */
export function usarWasmBinario(binario: ArrayBuffer) {
  binarioWasm = binario;
  preparado = false;
}

/**
 * Apunta el módulo al .wasm local. Idempotente y perezoso: solo registra de
 * dónde sacarlo, la instanciación real ocurre en la primera lectura.
 */
function prepararModulo() {
  if (preparado) return;
  prepareZXingModule({
    overrides: binarioWasm
      ? { wasmBinary: binarioWasm }
      : {
          locateFile: (path: string, prefix: string) =>
            path.endsWith(".wasm") ? "/zxing_reader.wasm" : prefix + path,
        },
  });
  preparado = true;
}

/**
 * Busca un código en una imagen y devuelve su texto, o null si no encontró
 * nada legible.
 *
 * `tryHarder` va prendido porque la foto de una cédula se saca torcida, con
 * reflejo del plástico y con el auto de fondo. La diferencia de velocidad no se
 * nota cuando el usuario está apuntando la cámara; el fallo sí.
 */
export async function leerCodigo(
  imagen: ImageData | Blob,
  formatos: FormatosCodigo,
): Promise<string | null> {
  prepararModulo();
  const resultados = await readBarcodes(imagen, {
    formats: formatos,
    tryHarder: true,
    tryRotate: true,
    tryInvert: true,
    maxNumberOfSymbols: 1,
  });
  const texto = resultados.find((r) => r.isValid && r.text)?.text;
  return texto?.trim() || null;
}
