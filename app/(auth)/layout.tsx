import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/supabase/server";

/**
 * Layout de las pantallas de autenticación (Login u Onboarding).
 *
 * Si el usuario ya está completamente autenticado con taller activo,
 * lo redirige al tablero sin pasar por el login.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();

  if (sesion?.estado === "completo") {
    redirect("/tablero");
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 safe-x pt-[calc(var(--safe-top)+1rem)] pb-[calc(var(--safe-bottom)+1rem)] relative overflow-hidden bg-background">
      {/* Glow ambiental decorativo */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-accent/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px]" />
      
      {children}
    </div>
  );
}
