import { redirect } from "next/navigation";
import { obtenerEstadoSuscripcionAction } from "@/lib/actions/suscripcion";
import { PanelSuscripcion } from "@/components/suscripcion/PanelSuscripcion";

export const dynamic = "force-dynamic";

export default async function PaginaSuscripcion() {
  const datos = await obtenerEstadoSuscripcionAction();

  if (!datos) {
    redirect("/login");
  }

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.5rem)] pb-16 px-4">
      <PanelSuscripcion
        estadoCalculado={datos.estadoCalculado}
        precioARS={datos.precioARS}
        esDueno={datos.esDueno}
        nombreTaller={datos.nombreTaller}
        suscripcionFin={datos.suscripcionFin}
      />
    </main>
  );
}
