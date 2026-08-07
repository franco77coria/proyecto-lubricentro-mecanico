import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";

export type PerfilUsuario = Database["public"]["Tables"]["perfil"]["Row"];

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 */
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Los Server Components no pueden escribir cookies directamente.
          }
        },
      },
    },
  );
}

/**
 * Sesión y contexto del usuario.
 *
 * Devuelve:
 * - `null` si no hay usuario autenticado.
 * - `{ user, perfil, estado: "completo" }` si el usuario tiene taller activo.
 * - `{ user, perfil: null, estado: "onboarding" }` si falta el onboarding.
 */
export async function obtenerSesion() {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfil")
    .select("taller_id, rol, nombre, activo")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!perfil || !perfil.activo) {
    return { user, perfil: null, estado: "onboarding" as const };
  }

  return { user, perfil, estado: "completo" as const };
}
