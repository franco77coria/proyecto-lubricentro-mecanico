import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 *
 * Nunca usar la service_role acá: saltea RLS y con eso se pierde el
 * aislamiento entre talleres, que es la única barrera real del producto.
 */
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => {
          try {
            for (const { name, value, options } of cookies) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Los Server Components no pueden escribir cookies. No es un
            // error: el refresh del token lo hace el proxy, que sí puede.
          }
        },
      },
    },
  );
}

/**
 * Sesión y contexto del usuario.
 *
 * Devuelve `null` si no hay sesión, o si la hay pero el usuario todavía no
 * pertenece a ningún taller (recién se registró y no completó el onboarding).
 *
 * Usa getUser() y NO getSession(): getSession lee la cookie sin validarla
 * contra el servidor de auth, así que un token manipulado pasaría.
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

  return { user, perfil: perfil?.activo ? perfil : null };
}
