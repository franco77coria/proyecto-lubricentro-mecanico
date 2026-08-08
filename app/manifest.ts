import type { MetadataRoute } from "next";

/**
 * Manifest de la PWA.
 *
 * Es lo que permite instalar la app en la pantalla de inicio y que abra sin la
 * barra del navegador. Importa en un taller: el mostrador la abre veinte veces
 * por día y llegar por el navegador suma pasos cada vez.
 *
 * No incluye caché de datos: esta versión necesita internet. El modo sin
 * conexión quedó para más adelante, y prometerlo a medias es peor que no
 * tenerlo — el usuario cree que guardó algo que en realidad se perdió.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Taller — Gestión de lubricentro",
    short_name: "Taller",
    description:
      "Órdenes de trabajo, control de stock y clientes para lubricentros y talleres mecánicos.",
    start_url: "/tablero",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#0b1220",
    lang: "es-AR",
    dir: "ltr",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      // `maskable` deja que Android recorte el icono a la forma del sistema
      // sin comerse el dibujo. Sin esta variante queda un cuadrado blanco
      // detrás del ícono redondeado. El dibujo ocupa poco más de la mitad del
      // lienzo justamente para sobrevivir a ese recorte.
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Nueva orden",
        short_name: "Nueva OT",
        description: "Recibir un vehículo",
        url: "/ot/nueva",
      },
      { name: "Buscar auto", short_name: "Autos", url: "/vehiculos" },
    ],
  };
}
