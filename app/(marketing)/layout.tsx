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
      /* Fondo base sólido #060608 para garantizar que nunca asome el blanco en overscroll
         o dispositivos móviles, con overflow-x contenido en toda la página. */
      className={`${inter.variable} ${jakarta.variable} tema-marketing min-h-screen w-full max-w-full overflow-x-hidden bg-[#060608] flex flex-col font-[family-name:var(--font-inter)] selection:bg-accent/20`}
    >
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Contenido */}
      <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
        {children}
      </main>

      {/* Botón flotante directo de WhatsApp para clientes / interesados */}
      <BotonWhatsAppFlotante />

      <footer className="relative mt-8 px-3.5 sm:px-6 pb-6 w-full max-w-full overflow-x-hidden">
        <div className="mx-auto w-full max-w-6xl rounded-[1.5rem] sm:rounded-[2rem] bg-card border border-border backdrop-blur-xl sin-transparencia:backdrop-blur-none px-6 sm:px-8 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <span className="font-[family-name:var(--font-jakarta)] font-bold tracking-[-0.03em] text-lg">
            Fierros
          </span>
          <p className="text-xs sm:text-sm text-muted-foreground">
            © {new Date().getFullYear()} — Gestión para lubricentros y talleres.
          </p>
        </div>
      </footer>
    </div>
  );
}
