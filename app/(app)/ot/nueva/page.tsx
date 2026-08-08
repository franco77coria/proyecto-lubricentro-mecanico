import { redirect } from "next/navigation";

import { FormNuevaOT } from "./FormNuevaOT";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaginaNuevaOT() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  const supabase = await crearClienteServidor();
  const { data: marcas } = await supabase
    .from("marca")
    .select("id, nombre")
    .eq("activa", true)
    .order("nombre", { ascending: true })
    .limit(100);

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor-angosto">
        <FormNuevaOT marcas={marcas || []} />
      </div>
    </main>
  );
}
