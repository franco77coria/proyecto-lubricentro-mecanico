import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fierros.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/seguimiento", "/seguimiento/*"],
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
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
