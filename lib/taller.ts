import { cache } from "react";

import { zonaHorariaDePais } from "@/lib/fechas";
import type { Idioma, Moneda } from "@/lib/i18n";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface AjustesTaller {
  nombre: string;
  pais: string;
  idioma: Idioma;
  moneda: Moneda;
  zonaHoraria: string;
}

const POR_DEFECTO: AjustesTaller = {
  nombre: "Mi taller",
  pais: "AR",
  idioma: "es",
  moneda: "ARS",
  zonaHoraria: zonaHorariaDePais("AR"),
};

/**
 * País, idioma, moneda y zona horaria del taller de la sesión.
 *
 * Es UNA sola fuente para las tres cosas que antes estaban escritas a mano en
 * cada pantalla: `es-AR`, `ARS` y el `$`. Un taller de Brasil le mostraba
 * pesos argentinos a su cliente porque el formateo estaba hardcodeado en
 * treinta lugares en vez de salir de un lado.
 *
 * Va envuelto en `cache()` de React: dentro de un mismo request se resuelve
 * una vez sola por más veces que lo pidan el layout, la página y las acciones.
 */
export const obtenerAjustesTaller = cache(async (): Promise<AjustesTaller> => {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return POR_DEFECTO;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("taller")
    .select("nombre, pais, idioma, moneda")
    .eq("id", sesion.perfil.taller_id)
    .maybeSingle();

  if (!data) return POR_DEFECTO;

  const fila = data as { nombre?: string; pais?: string; idioma?: string; moneda?: string };
  const pais = fila.pais || "AR";

  return {
    nombre: fila.nombre || POR_DEFECTO.nombre,
    pais,
    idioma: (fila.idioma || "es") as Idioma,
    moneda: (fila.moneda || "ARS") as Moneda,
    zonaHoraria: zonaHorariaDePais(pais),
  };
});
