import { redirect } from "next/navigation";
import {
  obtenerEstadoSuscripcionAction,
  sincronizarSuscripcionRetornoAction,
} from "@/lib/actions/suscripcion";
import { PanelSuscripcion } from "@/components/suscripcion/PanelSuscripcion";

export const dynamic = "force-dynamic";

interface PaginaSuscripcionProps {
  searchParams: Promise<{
    status?: string;
    collection_status?: string;
    payment_id?: string;
    preapproval_id?: string;
    preference_id?: string;
  }>;
}

export default async function PaginaSuscripcion({ searchParams }: PaginaSuscripcionProps) {
  const params = await searchParams;
  let exitoReciente = false;

  const paymentId = params.payment_id;
  const preapprovalId = params.preapproval_id;
  const status = params.status || params.collection_status;

  if (status === "approved" || status === "success" || paymentId || preapprovalId) {
    const sinc = await sincronizarSuscripcionRetornoAction({
      paymentId,
      preapprovalId,
      status,
    });
    if (sinc.activada || status === "approved" || status === "success") {
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
