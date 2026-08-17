import { redirect } from "next/navigation";

import { BarraInferior } from "@/components/isla/BarraInferior";
import { Isla } from "@/components/isla/Isla";
import { IslaProvider } from "@/components/isla/IslaContext";
import { I18nProvider } from "@/lib/i18n/I18nContext";
import type { Idioma, Moneda } from "@/lib/i18n";
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
    .select("nombre, pais, idioma, moneda")
    .eq("id", sesion.perfil.taller_id)
    .single();

  const vistasPermitidas = (sesion.perfil as { vistas_permitidas?: string[] | null }).vistas_permitidas;

  const idiomaInicial = ((taller as { idioma?: string } | null)?.idioma || "es") as Idioma;
  const monedaInicial = ((taller as { moneda?: string } | null)?.moneda || "ARS") as Moneda;

  return (
    <I18nProvider idiomaInicial={idiomaInicial} monedaInicial={monedaInicial}>
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
    </I18nProvider>
  );
}
