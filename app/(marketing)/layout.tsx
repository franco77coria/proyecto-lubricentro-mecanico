import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { BotonWhatsAppFlotante } from "@/components/marketing/BotonWhatsAppFlotante";
import { BannerCookies } from "@/components/ui/BannerCookies";
import { obtenerSesion } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Fierros — Software de Fosa y Taller Mecánico | Lubricentro Inteligente",
  description:
    "El software definitivo para lubricentros y talleres mecánicos en Argentina. Fichas técnicas por patente (Hilux, Ranger, Amarok), órdenes de trabajo a 1 toque, control de stock de aceite y avisos por WhatsApp.",
  keywords: [
    "software para lubricentro",
    "sistema para taller mecánico",
    "órdenes de trabajo automotor",
    "ficha técnica de lubricación",
    "control de stock aceite taller",
    "programa para mecánicos argentina",
    "cédula verde ocr taller",
    "seguimiento de autos por whatsapp",
  ],
  authors: [{ name: "Fierros" }],
  creator: "Fierros",
  publisher: "Fierros",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://fierros.app",
    title: "Fierros — Software de Fosa y Taller Mecánico",
    description:
      "El control total de tu taller o lubricentro sin cuaderno de papel. Fichas de cárter por patente, stock sincronizado y avisos por WhatsApp.",
    siteName: "Fierros",
    images: [
      {
        url: "/img/marketing/hero-fosa-hilux.jpg",
        width: 1200,
        height: 630,
        alt: "Fierros - Software para Lubricentros y Talleres Mecánicos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fierros — Software para Lubricentros y Talleres Mecánicos",
    description:
      "El control total de tu taller o lubricentro sin cuaderno de papel. Fichas por patente, stock y WhatsApp.",
    images: ["/img/marketing/hero-fosa-hilux.jpg"],
  },
  alternates: {
    canonical: "https://fierros.app",
  },
};

// Sans geométrica para el marketing. Escopeado acá: el panel interno sigue
// usando --font-display (Barlow Condensed) sin cambios.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await obtenerSesion();
  const isLoggedIn = !!sesion?.perfil;

  return (
    <div
      /* Fondo base claro porcelana #f8fafc con overflow-x-clip para no romper el fixed del fondo. */
      className={`${inter.variable} ${jakarta.variable} tema-marketing min-h-screen w-full max-w-full overflow-x-clip bg-[#f8fafc] text-zinc-950 flex flex-col font-[family-name:var(--font-inter)] selection:bg-accent/20`}
    >
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Contenido */}
      <main className="flex-1 flex flex-col w-full max-w-full overflow-x-clip">
        {children}
      </main>

      {/* Botón flotante directo de WhatsApp para clientes / interesados */}
      <BotonWhatsAppFlotante />

      {/* Pie de página institucional con blindaje legal y defensa del consumidor */}
      <Footer />

      {/* Banner de consentimiento de cookies y políticas */}
      <BannerCookies />
    </div>
  );
}
