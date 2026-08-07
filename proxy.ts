import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresco de sesión.
 *
 * En Next 16 esto se llama `proxy.ts`, no `middleware.ts` (misma API, export
 * `proxy`), y corre en runtime Node en vez de Edge.
 *
 * Su único trabajo es renovar el token de Supabase y reescribir las cookies:
 * los Server Components no pueden escribir cookies, así que sin esto la sesión
 * se vence sola y el usuario termina deslogueado sin motivo.
 *
 * La autorización NO vive acá. Vive en el layout de (app), que valida la
 * sesión del lado del servidor, y sobre todo en las políticas RLS de Postgres.
 * Un middleware que "protege" rutas es una puerta que se puede saltear.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          for (const { name, value, options } of cookies) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Valida el token contra el servidor de auth y lo renueva si hace falta.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Todo menos assets estáticos e imágenes: renovar la sesión en cada
    // request de un .svg es gasto puro.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
