
import { TableroKanban, type OTKanban } from "@/components/kanban/TableroKanban";
import { EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { COLUMNAS_KANBAN } from "@/lib/estados-ot";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirVista } from "@/lib/permisos";

export const dynamic = "force-dynamic";

export default async function PaginaKanban() {
  const sesion = await exigirVista("/kanban");

  const supabase = await crearClienteServidor();
  const { data: ordenes } = await supabase
    .from("orden_trabajo")
    .select(
      `id, numero, estado, fecha_ingreso, total, asignado_a,
       vehiculo:vehiculo_id ( patente, marca:marca_id(nombre), modelo:modelo_id(nombre) ),
       cliente:cliente_id ( nombre, apellido ),
       mecanico:asignado_a ( nombre )`,
    )
    .eq("taller_id", sesion.perfil.taller_id)
    .in("estado", [...COLUMNAS_KANBAN])
    .order("fecha_ingreso", { ascending: true })
    .limit(300);

  const lista = (ordenes || []) as unknown as OTKanban[];

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-5">
        <EncabezadoPantalla
          seccion="Tablero de fosa"
          titulo={`${lista.length} ${lista.length === 1 ? "auto" : "autos"} en el taller`}
        />

        <TableroKanban ordenes={lista} userId={sesion.user.id} rol={sesion.perfil.rol} />
      </div>
    </main>
  );
}
