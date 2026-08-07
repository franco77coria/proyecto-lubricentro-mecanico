import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresco de sesión y sincronización de cookies.
 *
 * En Next.js 16 (Proxy runtime), `setAll` debe actualizar TANTO `request.cookies`
 * como `response.cookies`. De lo contrario, los Server Components del Layout
 * leen cookies obsoletas del request y devuelven 307 de nuevo a /login.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Valida y renueva silenciosamente el token si está por caducar
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
