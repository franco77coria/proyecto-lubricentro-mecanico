import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertOctagon, LogIn } from "lucide-react";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Aceptación de una invitación al taller.
 *
 * Vive fuera de los grupos (app) y (auth) porque es el único punto que tiene
 * que funcionar en los dos estados: con sesión acepta y entra, sin sesión
 * guarda el token y manda a registrarse.
 */
export default async function AceptarInvitacion({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const sesion = await obtenerSesion();

  if (!sesion) {
    // El token viaja en la URL del login y vuelve acá al terminar. No se
    // guarda en una cookie porque un Server Component no puede escribirlas:
    // intentarlo devolvía un 500 y rompía el flujo entero.
    const volver = `/invitacion/${encodeURIComponent(token)}`;

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[22rem] flex-col justify-center gap-5 px-5 py-8 text-center">
        <h1 className="t-pantalla text-foreground">Te invitaron a un taller</h1>
        <p className="text-sm text-muted-foreground">
          Creá tu cuenta o iniciá sesión y quedás adentro automáticamente.
        </p>
        <Link
          href={`/login?volver=${encodeURIComponent(volver)}`}
          className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-accent text-sm font-semibold text-accent-foreground"
        >
          <LogIn className="h-4 w-4" aria-hidden />
          Continuar
        </Link>
      </main>
    );
  }

  // Ya pertenece a un taller: la invitación no aplica.
  if (sesion.perfil) redirect("/tablero");

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("aceptar_invitacion", { p_token: token });

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[22rem] flex-col justify-center gap-4 px-5 py-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertOctagon className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="text-xl font-semibold text-foreground">No pudimos usar esta invitación</h1>
        {/* Mensaje único a propósito: distinguir "no existe" de "venció" o de
            "es para otro email" le diría a quien prueba tokens cuáles
            existieron alguna vez. */}
        <p className="text-sm text-muted-foreground">
          Puede haber vencido, ya haber sido usada, o estar dirigida a otro email.
          Pedile al taller que te mande una nueva.
        </p>
        <Link
          href="/onboarding"
          className="flex min-h-12 items-center justify-center rounded-[var(--radius-sm)] bg-muted text-sm font-semibold text-foreground"
        >
          Crear mi propio taller
        </Link>
      </main>
    );
  }

  redirect("/tablero");
}
