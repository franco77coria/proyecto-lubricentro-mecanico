import type { NextConfig } from "next";

/**
 * El host de Supabase sale de la variable de entorno y no va escrito a mano:
 * así el proyecto de desarrollo y el de producción funcionan con la misma
 * configuración.
 */
const hostSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  devIndicators: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "motion", "@supabase/supabase-js"],
    serverActions: {
      bodySizeLimit: "4.5mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Sin esto, next/image rechaza las fotos del bucket y la galería queda
    // vacía. Se habilita solo el path de Storage, no el host entero.
    remotePatterns: hostSupabase
      ? [{ protocol: "https", hostname: hostSupabase, pathname: "/storage/v1/object/**" }]
      : [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
