import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login"],
        disallow: [
          "/tablero",
          "/ot",
          "/ot/*",
          "/presupuestos",
          "/presupuestos/*",
          "/clientes",
          "/clientes/*",
          "/vehiculos",
          "/vehiculos/*",
          "/stock",
          "/stock/*",
          "/caja",
          "/caja/*",
          "/turnos",
          "/turnos/*",
          "/compras",
          "/compras/*",
          "/reportes",
          "/reportes/*",
          "/config",
          "/config/*",
          "/invitacion/*",
          "/onboarding",
          "/onboarding/*",
          "/api/*",
        ],
      },
    ],
  };
}
