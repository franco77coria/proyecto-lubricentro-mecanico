import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { BarraInferior } from "@/components/isla/BarraInferior";
import { Isla } from "@/components/isla/Isla";
import { IslaProvider } from "@/components/isla/IslaContext";
import { I18nProvider } from "@/lib/i18n/I18nContext";
import type { Idioma, Moneda } from "@/lib/i18n";
import { Sidebar } from "@/components/nav/Sidebar";
import { SidebarProvider } from "@/components/nav/SidebarContext";
import { LayoutPrincipal } from "@/components/nav/LayoutPrincipal";
import { TrackerActividad } from "@/components/telemetria/TrackerActividad";
import { BannerTrial } from "@/components/suscripcion/BannerTrial";
import { calcularEstadoSuscripcion } from "@/lib/suscripcion";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();

  if (!sesion) redirect("/login");
  if (!sesion.perfil) redirect("/onboarding");

  const supabase = await crearClienteServidor();
  const { data: taller } = await supabase
    .from("taller")
    .select("nombre, pais, idioma, moneda, estado_suscripcion, trial_fin, suscripcion_fin, mp_subscription_status")
    .eq("id", sesion.perfil.taller_id)
    .single();

  const estadoSub = calcularEstadoSuscripcion(taller);
  const cabeceras = await headers();
  const rutaActual = cabeceras.get("x-pathname") || "";

  // Guard de Suscripción: Si venció el trial de 7 días y no tiene suscripción activa,
  // se restringe el acceso a las funciones operativas y se redirige a /suscripcion.
  if (!estadoSub.tieneAcceso && !rutaActual.startsWith("/suscripcion")) {
    redirect("/suscripcion");
  }

  const vistasPermitidas = (sesion.perfil as { vistas_permitidas?: string[] | null }).vistas_permitidas;

  const idiomaInicial = ((taller as { idioma?: string } | null)?.idioma || "es") as Idioma;
  const monedaInicial = ((taller as { moneda?: string } | null)?.moneda || "ARS") as Moneda;

  return (
    <I18nProvider idiomaInicial={idiomaInicial} monedaInicial={monedaInicial}>
      <IslaProvider>
        <SidebarProvider>
          <TrackerActividad />

          <Sidebar
            taller={taller?.nombre ?? "Mi taller"}
            usuario={sesion.perfil.nombre || sesion.user.email?.split("@")[0] || ""}
            rol={sesion.perfil.rol}
            vistasPermitidas={vistasPermitidas}
          />

          <LayoutPrincipal
            bannerTrial={
              estadoSub.enTrial ? (
                <BannerTrial
                  diasRestantes={estadoSub.diasRestantesTrial}
                  esDueno={sesion.perfil.rol === "dueno"}
                />
              ) : undefined
            }
            isla={<Isla />}
          >
            {children}
          </LayoutPrincipal>

          <BarraInferior
            taller={taller?.nombre ?? "Mi taller"}
            usuario={sesion.perfil.nombre || sesion.user.email?.split("@")[0] || ""}
            rol={sesion.perfil.rol}
            vistasPermitidas={vistasPermitidas}
          />
        </SidebarProvider>
      </IslaProvider>
    </I18nProvider>
  );
}
