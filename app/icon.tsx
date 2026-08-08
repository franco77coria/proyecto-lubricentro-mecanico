import { ImageResponse } from "next/og";

/**
 * Icono de la app, generado en build.
 *
 * Un solo tamaño, 512, a propósito. La variante con `generateImageMetadata`
 * para emitir 192 y 512 no funcionaba: el identificador no llegaba al
 * componente y las dos rutas salían generadas a 192, con lo cual el icono de
 * la pantalla de inicio de Android quedaba pixelado. Un único 512 evita el
 * problema — los navegadores lo escalan hacia abajo sin perder nada.
 */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Mismo gradiente que el panel de marca del login.
          background: "linear-gradient(158deg, #0b1220 0%, #171310 52%, #3b1a08 100%)",
        }}
      >
        {/* Llave de taller, dibujada a mano: ImageResponse no carga fuentes de
            iconos y con una saldría un cuadrado vacío. */}
        <svg
          width={288}
          height={288}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f97316"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </div>
    ),
    size,
  );
}
