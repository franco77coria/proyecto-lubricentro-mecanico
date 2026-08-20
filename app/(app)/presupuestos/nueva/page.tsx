import { FormNuevoPresupuesto } from "./FormNuevoPresupuesto";
import { listarMarcas } from "@/lib/actions/catalogo";
import { exigirVista } from "@/lib/permisos";

export const dynamic = "force-dynamic";

export default async function PaginaNuevoPresupuesto() {
  const sesion = await exigirVista("/presupuestos");

  const marcas = await listarMarcas();

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor-angosto">
        <FormNuevoPresupuesto marcas={marcas} />
      </div>
    </main>
  );
}
