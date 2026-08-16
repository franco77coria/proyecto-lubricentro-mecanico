import { redirect } from "next/navigation";

import { BarraInferior } from "@/components/isla/BarraInferior";
import { Isla } from "@/components/isla/Isla";
import { IslaProvider } from "@/components/isla/IslaContext";
import { Sidebar } from "@/components/nav/Sidebar";
import { TrackerActividad } from "@/components/telemetria/TrackerActividad";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();

  if (!sesion) redirect("/login");
  if (!sesion.perfil) redirect("/onboarding");

  const supabase = await crearClienteServidor();
  const { data: taller } = await supabase
    .from("taller")
    .select("nombre")
    .eq("id", sesion.perfil.taller_id)
    .single();

  const vistasPermitidas = (sesion.perfil as { vistas_permitidas?: string[] | null }).vistas_permitidas;

  return (
    <IslaProvider>
      <TrackerActividad />

      <Sidebar
        taller={taller?.nombre ?? "Mi taller"}
        usuario={sesion.perfil.nombre || sesion.user.email?.split("@")[0] || ""}
        rol={sesion.perfil.rol}
        vistasPermitidas={vistasPermitidas}
      />

      {/* El margen deja lugar al sidebar sin que el contenido quede debajo. */}
      <div className="flex min-h-dvh flex-col lg:pl-[var(--sidebar-ancho)]">
        <Isla />
        {children}
      </div>

      <BarraInferior rol={sesion.perfil.rol} vistasPermitidas={vistasPermitidas} />
    </IslaProvider>
  );
}
