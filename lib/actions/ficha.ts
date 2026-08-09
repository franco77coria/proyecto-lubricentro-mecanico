"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface FichaVehiculo {
  motorizacion: string;
  modelo: string;
  tiene_ficha: boolean;
  verificada: boolean;
  aceite_litros: number | null;
  aceite_viscosidad: string | null;
  aceite_norma: string | null;
  caja_tipo: string | null;
  caja_aceite: string | null;
  refrigerante: string | null;
  liquido_frenos: string | null;
  filtro_aceite: string | null;
  filtro_aire: string | null;
  filtro_combustible: string | null;
  filtro_habitaculo: string | null;
  service_km: number | null;
  service_meses: number | null;
  notas: string | null;
}

/**
 * Qué lleva este auto.
 *
 * Devuelve null si el vehículo no tiene motorización cargada: sin ese dato la
 * ficha no se puede resolver, y adivinarla por el modelo es justo el error que
 * 0018 existe para evitar (una Amarok 2.0 y una V6 no llevan lo mismo).
 */
export async function obtenerFicha(vehiculoId: string): Promise<FichaVehiculo | null> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return null;

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.rpc("ficha_de_vehiculo", { p_vehiculo: vehiculoId });
    if (error) {
      console.error("[obtenerFicha]", error.code);
      return null;
    }
    return (data as unknown as FichaVehiculo | null) ?? null;
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}

/** Quita todo lo que no sea alfanumérico: "5W-40" y "5W40" tienen que matchear. */
function soloAlfaNum(s: string) {
  return s.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export interface ResultadoCargaAceite {
  ok?: boolean;
  error?: string;
  /** Si se encontró un producto en stock con esa viscosidad. */
  productoUsado?: string;
  /** Se cargó pero sin vincular, así que no descuenta stock. */
  sinStock?: boolean;
}

/**
 * Carga el aceite del service al presupuesto, con los litros de la ficha.
 *
 * Busca en el stock un producto cuya viscosidad coincida con la de la ficha
 * comparando sin guiones ("5W-40" del envase contra "5W40" de la ficha). Si lo
 * encuentra, lo vincula y el stock se descuenta solo; si no, carga la línea
 * igual sin vincular y avisa — perder la línea del presupuesto porque falta
 * cargar el producto sería peor.
 *
 * Los filtros no se cargan automáticamente: el código varía por año dentro del
 * mismo motor, y sugerir el que no va manda a comprar la pieza equivocada.
 */
export async function cargarAceiteDeFicha(
  otId: string,
  vehiculoId: string,
): Promise<ResultadoCargaAceite> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  const ficha = await obtenerFicha(vehiculoId);
  if (!ficha?.aceite_litros || !ficha.aceite_viscosidad) {
    return { error: "Este motor todavía no tiene litros y viscosidad cargados." };
  }

  const litros = Number(ficha.aceite_litros);
  const visc = ficha.aceite_viscosidad;

  try {
    const supabase = await crearClienteServidor();

    // Se traen los aceites del taller y se compara normalizado: hacerlo en SQL
    // pediría un ilike por cada forma de escribir la viscosidad.
    const { data: candidatos } = await supabase
      .from("producto")
      .select("id, nombre, precio_venta, unidad")
      .eq("taller_id", sesion.perfil.taller_id)
      .eq("activo", true)
      .limit(500);

    const buscado = soloAlfaNum(visc);
    const producto = (candidatos ?? []).find((p) => soloAlfaNum(p.nombre).includes(buscado));

    let costoUnitario = 0;
    if (producto) {
      const { data: costo } = await supabase.rpc("costo_actual_producto", {
        p_producto: producto.id,
      });
      costoUnitario = Number(costo ?? 0);
    }

    const { error } = await supabase.from("ot_item").insert({
      taller_id: sesion.perfil.taller_id,
      ot_id: otId,
      tipo: "insumo",
      descripcion: producto
        ? `${producto.nombre} — ${litros} L`
        : `Aceite ${visc} — ${litros} L (cargar producto en stock)`,
      producto_id: producto?.id ?? null,
      cantidad: litros,
      costo_unitario: costoUnitario,
      // El precio del producto es por su unidad de venta. Cuando el aceite se
      // mide en litros coincide; si el producto es un bidón de 4 L, el precio
      // por litro no sale de acá y lo corrige el mostrador.
      precio_unitario: producto ? Number(producto.precio_venta ?? 0) : 0,
      creado_por: sesion.user.id,
    });

    if (error) {
      if (error.message?.includes("stock") || error.code === "P0001") {
        return { error: "No hay stock suficiente de ese aceite. Cargá la compra primero." };
      }
      console.error("[cargarAceiteDeFicha]", error.code);
      return { error: "No se pudo cargar el aceite." };
    }

    revalidatePath(`/ot/${otId}`);
    if (producto) revalidatePath("/stock");

    return {
      ok: true,
      productoUsado: producto?.nombre,
      sinStock: !producto,
    };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar." };
  }
}
