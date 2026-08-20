
import { FormNuevaOT } from "./FormNuevaOT";
import { listarMarcas } from "@/lib/actions/catalogo";
import { exigirVista } from "@/lib/permisos";

export const dynamic = "force-dynamic";

export default async function PaginaNuevaOT() {
  const sesion = await exigirVista("/kanban");

  // Antes esto traía las marcas con `.limit(100)`, que con el catálogo ampliado
  // (108 marcas) empezaba a cortar justo las últimas del alfabeto sin avisar.
  const marcas = await listarMarcas();

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor-angosto">
        <FormNuevaOT marcas={marcas} />
      </div>
    </main>
  );
}
