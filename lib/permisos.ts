import { redirect } from "next/navigation";

import { puedeVerRuta } from "@/lib/navegacion";
import { obtenerSesion } from "@/lib/supabase/server";

/**
 * La puerta de cada pantalla.
 *
 * Antes esto no existía: `vistas_permitidas` solo se usaba para dibujar el
 * sidebar, así que la restricción era un adorno — escribiendo la URL a mano se
 * entraba a cualquier pantalla igual. De las veinte pantallas de (app), solo
 * tres chequeaban algo, y las tres miraban el rol, no las vistas.
 *
 * Se llama al tope de cada `page.tsx` y devuelve la sesión ya validada, así la
 * página no tiene que pedirla de nuevo:
 *
 *     const sesion = await exigirVista("/caja");
 *
 * Al mandar el href de navegación —y no la ruta del archivo— las pantallas de
 * detalle heredan el permiso de su listado: `/ot/[id]` entra por `/kanban`,
 * que es la pantalla desde la que se llega.
 *
 * El redirect va a /tablero y no a una pantalla de error a propósito: que
 * alguien pruebe una URL que no le toca no es un incidente, es curiosidad.
 * Y /tablero lo puede ver cualquiera con sesión.
 */
export async function exigirVista(href: string) {
  const sesion = await obtenerSesion();

  if (!sesion) redirect("/login");
  if (!sesion.perfil) redirect("/onboarding");

  const vistas = (sesion.perfil as { vistas_permitidas?: string[] | null }).vistas_permitidas;

  if (!puedeVerRuta(href, sesion.perfil.rol, vistas)) {
    redirect("/tablero");
  }

  return sesion;
}
