import { redirect } from "next/navigation";

import { FormNuevaOT } from "./FormNuevaOT";
import { listarMarcas } from "@/lib/actions/catalogo";
import { obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaginaNuevaOT() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

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
