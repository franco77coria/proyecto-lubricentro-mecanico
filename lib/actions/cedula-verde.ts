"use server";

import { obtenerSesion } from "@/lib/supabase/server";
import { procesarOCRCedulaVerde, type ResultadoOCRCedulaVerde } from "@/lib/ia/cedula-verde";

export async function escanearCedulaVerdeAction(
  dataUriOUrl: string,
): Promise<ResultadoOCRCedulaVerde> {
  const sesion = await obtenerSesion();
  if (!sesion) return { error: "No autorizado" };

  try {
    return await procesarOCRCedulaVerde(dataUriOUrl);
  } catch (err: any) {
    console.error("Error en escanearCedulaVerdeAction:", err);
    return { error: err.message || "Error al procesar la cédula verde." };
  }
}
