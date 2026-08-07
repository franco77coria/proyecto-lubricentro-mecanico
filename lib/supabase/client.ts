import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Cliente para componentes del navegador.
 *
 * Usa la clave publicable, que es pública por diseño: lo que protege los datos
 * es RLS, no esconder la clave. Cada consulta viaja con el JWT del usuario y
 * Postgres filtra por `taller_actual()`.
 */
export function crearClienteNavegador() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
