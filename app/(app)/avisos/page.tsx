
import { ListaAvisos } from "@/components/avisos/ListaAvisos";
import { EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { listarRecordatorios } from "@/lib/actions/recordatorios";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirVista } from "@/lib/permisos";

export const dynamic = "force-dynamic";

export default async function PaginaAvisos() {
  const sesion = await exigirVista("/avisos");
  // Contactar clientes es trabajo de mostrador. El mecánico no tiene la lista.

  const supabase = await crearClienteServidor();
  const [avisos, { data: taller }] = await Promise.all([
    listarRecordatorios(),
    supabase.from("taller").select("nombre").eq("id", sesion.perfil.taller_id).single(),
  ]);

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-5">
        <EncabezadoPantalla seccion="Volver a llamar" titulo="Avisos de service" />

        {avisos.length > 0 && (
          <p
            className="entrar rounded-[var(--radius-sm)] bg-muted px-3.5 py-2.5 text-sm text-foreground"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            {avisos.length} {avisos.length === 1 ? "auto" : "autos"} para contactar
          </p>
        )}

        <ListaAvisos avisos={avisos} tallerNombre={taller?.nombre ?? "el taller"} />
      </div>
    </main>
  );
}
