import { redirect } from "next/navigation";

import { obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaginaRaiz() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) {
    redirect("/login");
  } else {
    redirect("/tablero");
  }
}
