import { redirect } from "next/navigation";

import { BarraInferior } from "@/components/isla/BarraInferior";
import { Isla } from "@/components/isla/Isla";
import { IslaProvider } from "@/components/isla/IslaContext";
import { Sidebar } from "@/components/nav/Sidebar";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

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
 * La navegación es distinta según el tamaño, no la misma estirada:
 *   - escritorio: sidebar permanente a la izquierda
 *   - celular:    barra flotante abajo, al alcance del pulgar
 * La isla vive arriba en los dos casos y nunca se superpone con la barra: son
 * dos superficies translúcidas claras y apilarlas las vuelve ilegibles.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const sesion = await obtenerSesion();

  if (!sesion) redirect("/login");
  if (!sesion.perfil) redirect("/onboarding");

  const supabase = await crearClienteServidor();
  const { data: taller } = await supabase
    .from("taller")
    .select("nombre")
    .eq("id", sesion.perfil.taller_id)
    .single();

  return (
    <IslaProvider>
      <Sidebar
        taller={taller?.nombre ?? "Mi taller"}
        usuario={sesion.perfil.nombre || sesion.user.email?.split("@")[0] || ""}
        rol={sesion.perfil.rol}
      />

      {/* El margen deja lugar al sidebar sin que el contenido quede debajo. */}
      <div className="flex min-h-dvh flex-col lg:pl-[var(--sidebar-ancho)]">
        <Isla />
        {children}
      </div>

      <BarraInferior rol={sesion.perfil.rol} />
    </IslaProvider>
  );
}
