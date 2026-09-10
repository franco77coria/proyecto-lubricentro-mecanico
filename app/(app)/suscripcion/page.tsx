import { redirect } from "next/navigation";
import {
  obtenerEstadoSuscripcionAction,
  sincronizarSuscripcionRetornoAction,
} from "@/lib/actions/suscripcion";
import { PanelSuscripcion } from "@/components/suscripcion/PanelSuscripcion";

export const dynamic = "force-dynamic";

interface PaginaSuscripcionProps {
  searchParams: Promise<{ status?: string; preapproval_id?: string }>;
}

export default async function PaginaSuscripcion({ searchParams }: PaginaSuscripcionProps) {
  const params = await searchParams;
  let exitoReciente = false;

  if (params.status === "success" || params.preapproval_id) {
    const sinc = await sincronizarSuscripcionRetornoAction(params.preapproval_id);
    if (sinc.activada || params.status === "success") {
      exitoReciente = true;
    }
  }

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
        exitoReciente={exitoReciente}
      />
    </main>
  );
}
