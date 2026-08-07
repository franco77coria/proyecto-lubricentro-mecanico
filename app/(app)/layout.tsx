import { redirect } from "next/navigation";

import { BarraInferior } from "@/components/isla/BarraInferior";
import { Isla } from "@/components/isla/Isla";
import { IslaProvider } from "@/components/isla/IslaContext";
import { obtenerSesion } from "@/lib/supabase/server";

/**
 * Chrome de la aplicación y puerta de entrada a todo lo privado.
 *
 * Es un Server Component con `await` de la sesión a propósito: si la
 * validación viviera en un componente cliente, Next prerenderizaría estas
 * páginas como estáticas y el HTML con los datos se serviría antes de que
 * nadie revise la sesión. En la tabla de rutas estas páginas tienen que
 * figurar como `ƒ` (dinámicas), nunca como `○`.
 *
 * Esto no reemplaza a RLS: es la capa de UX (mandar al login en vez de mostrar
 * una pantalla vacía). La barrera real de datos está en Postgres.
 *
 * La isla vive arriba y la barra abajo, y nunca se superponen: son dos
 * superficies translúcidas claras y apilarlas vuelve ilegibles a las dos.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const sesion = await obtenerSesion();

  if (!sesion) redirect("/login");
  // Usuario válido que todavía no completó el alta del taller.
  if (!sesion.perfil) redirect("/onboarding");

  return (
    <IslaProvider>
      <Isla />
      {children}
      <BarraInferior />
    </IslaProvider>
  );
}
