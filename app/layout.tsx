import type { Metadata, Viewport } from "next";
import { Barlow_Condensed } from "next/font/google";
import "./globals.css";

/* Solo para números grandes: patente, N° de OT, kilómetros, totales, tacómetro.
   El cuerpo usa la font del sistema (ver --font-sans en globals.css). */
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Taller",
  description: "Gestión de órdenes de trabajo, stock y clientes para lubricentros y talleres mecánicos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Taller",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${barlowCondensed.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
