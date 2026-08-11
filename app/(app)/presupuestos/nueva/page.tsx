import { redirect } from "next/navigation";
import { FormNuevoPresupuesto } from "./FormNuevoPresupuesto";
import { listarMarcas } from "@/lib/actions/catalogo";
import { obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaginaNuevoPresupuesto() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  const marcas = await listarMarcas();

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor-angosto">
        <FormNuevoPresupuesto marcas={marcas} />
      </div>
    </main>
  );
}
