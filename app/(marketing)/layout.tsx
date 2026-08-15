import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Navbar } from "@/components/marketing/Navbar";
import { BotonWhatsAppFlotante } from "@/components/marketing/BotonWhatsAppFlotante";
import { obtenerSesion } from "@/lib/supabase/server";

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
      /* Sin bg propio: el fondo lo pone VideoBackdrop, que va en la capa de
         z-index negativo. Un background opaco acá lo taparía — los fondos de
         elemento se pintan por encima de esa capa. El color de base queda en
         <body>. */
      className={`${inter.variable} ${jakarta.variable} tema-marketing min-h-screen flex flex-col font-[family-name:var(--font-inter)] selection:bg-accent/20`}
    >
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Contenido */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Botón flotante directo de WhatsApp para clientes / interesados */}
      <BotonWhatsAppFlotante />

      <footer className="relative mt-8 px-4 sm:px-6 pb-6">
        <div className="mx-auto w-full max-w-6xl rounded-[2rem] bg-card border border-border backdrop-blur-xl sin-transparencia:backdrop-blur-none px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-[family-name:var(--font-jakarta)] font-bold tracking-[-0.03em] text-lg">
            Fierros
          </span>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} — Gestión para lubricentros y talleres.
          </p>
        </div>
      </footer>
    </div>
  );
}
