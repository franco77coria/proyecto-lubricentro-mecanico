"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface ResultadoAnular {
  error?: string;
  ok?: boolean;
  devueltos?: number;
}

/**
 * Anula una orden y devuelve los repuestos al stock.
 *
 * Toda la lógica vive en la función de Postgres para que sea atómica: o se
 * anula la orden Y vuelve el stock, o no pasa nada. Acá solo se traduce el
 * error a algo que se pueda leer en pantalla.
 */
export async function anularOrden(otId: string, motivo: string): Promise<ResultadoAnular> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.rpc("anular_orden", {
      p_ot: otId,
      p_motivo: motivo,
    });

    if (error) {
      console.error("[anularOrden]", error.code, error.message);
      // Los mensajes de la función son para el usuario y explican qué hacer
      // ("quitá los pagos antes"), así que se muestran tal cual. Cualquier
      // otro error se generaliza.
      const esperado = /pagos|motivo|permiso|no existe/i.test(error.message);
      return { error: esperado ? error.message : "No se pudo anular la orden" };
    }

    const r = data as { ok: boolean; devueltos: number };
    revalidatePath(`/ot/${otId}`);
    revalidatePath("/tablero");
    revalidatePath("/stock");
    return { ok: true, devueltos: r.devueltos };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}
