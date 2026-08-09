"use server";

import { unstable_rethrow } from "next/navigation";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

/**
 * Catálogo de vehículos: marca → modelo → motorización.
 *
 * El catálogo es global (lo comparten todos los talleres) y se lee en cascada:
 * el mostrador elige la marca y recién entonces se piden sus modelos. Traer los
 * 951 modelos de golpe para que el navegador filtre 20 sería más simple de
 * escribir y peor de usar en el celular del taller.
 *
 * Se devuelven los `pendiente` junto con los `aprobado`, marcados. Si el
 * mostrador cargó "Ranger Raptor" hace diez minutos y no lo viera, lo cargaría
 * de nuevo — y el duplicado que la aprobación tiene que resolver lo generamos
 * nosotros.
 */

export interface OpcionCatalogo {
  id: string;
  nombre: string;
  /** Cargado por un taller y todavía sin aprobar. Se muestra distinto. */
  pendiente: boolean;
  /** Solo en motorizaciones: "1598cc · 110cv" para desambiguar a ojo. */
  detalle?: string;
}

export async function listarMarcas(): Promise<OpcionCatalogo[]> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return [];

  try {
    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("marca")
      .select("id, nombre, estado")
      .eq("activa", true)
      .neq("estado", "rechazado")
      .order("nombre", { ascending: true });

    return (data ?? []).map((m) => ({
      id: m.id,
      nombre: m.nombre,
      pendiente: m.estado === "pendiente",
    }));
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

export async function listarModelos(marcaId: string): Promise<OpcionCatalogo[]> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil || !marcaId) return [];

  try {
    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("modelo")
      .select("id, nombre, estado")
      .eq("marca_id", marcaId)
      .neq("estado", "rechazado")
      // Un modelo fusionado apunta al bueno: mostrarlo sería ofrecer el duplicado
      // que alguien ya se tomó el trabajo de resolver.
      .is("fusionado_en_id", null)
      .order("nombre", { ascending: true });

    return (data ?? []).map((m) => ({
      id: m.id,
      nombre: m.nombre,
      pendiente: m.estado === "pendiente",
    }));
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

export async function listarMotorizaciones(modeloId: string): Promise<OpcionCatalogo[]> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil || !modeloId) return [];

  try {
    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("motorizacion")
      .select("id, nombre, estado, cilindrada_cc, potencia_cv, combustible")
      .eq("modelo_id", modeloId)
      .neq("estado", "rechazado")
      .is("fusionado_en_id", null)
      .order("cilindrada_cc", { ascending: true, nullsFirst: false })
      .order("nombre", { ascending: true });

    return (data ?? []).map((m) => ({
      id: m.id,
      nombre: m.nombre,
      pendiente: m.estado === "pendiente",
      detalle: [
        m.cilindrada_cc ? `${m.cilindrada_cc} cc` : null,
        m.potencia_cv ? `${m.potencia_cv} cv` : null,
        m.combustible,
      ]
        .filter(Boolean)
        .join(" · "),
    }));
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

export interface ResultadoPropuesta {
  id?: string;
  error?: string;
}

/**
 * Alta de lo que no está en el catálogo (la opción OTROS).
 *
 * Queda como `pendiente` y no frena a nadie: el mostrador sigue cargando el
 * auto. Aprobarlo o fusionarlo es del dueño, desde Ajustes.
 *
 * La resolución de duplicados exactos vive en la función de Postgres, que usa
 * el mismo `normalizar()` que el índice único.
 */
export async function proponerMarca(nombre: string): Promise<ResultadoPropuesta> {
  return llamarPropuesta("proponer_marca", { p_nombre: nombre }, "la marca");
}

export async function proponerModelo(
  marcaId: string,
  nombre: string,
): Promise<ResultadoPropuesta> {
  if (!marcaId) return { error: "Elegí primero la marca" };
  return llamarPropuesta("proponer_modelo", { p_marca_id: marcaId, p_nombre: nombre }, "el modelo");
}

export async function proponerMotorizacion(
  modeloId: string,
  nombre: string,
): Promise<ResultadoPropuesta> {
  if (!modeloId) return { error: "Elegí primero el modelo" };
  return llamarPropuesta(
    "proponer_motorizacion",
    { p_modelo_id: modeloId, p_nombre: nombre },
    "la motorización",
  );
}

type NombreRpc = "proponer_marca" | "proponer_modelo" | "proponer_motorizacion";

async function llamarPropuesta(
  rpc: NombreRpc,
  args: Record<string, string>,
  queCosa: string,
): Promise<ResultadoPropuesta> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida. Volvé a entrar." };

  const nombre = args.p_nombre?.trim() ?? "";
  if (!nombre) return { error: `Escribí ${queCosa}` };

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.rpc(rpc, { ...args, p_nombre: nombre });

    if (error) {
      console.error(`[${rpc}]`, error.code);
      return { error: `No se pudo agregar ${queCosa}. Revisá el nombre.` };
    }
    return { id: data as unknown as string };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar. Probá de nuevo." };
  }
}
