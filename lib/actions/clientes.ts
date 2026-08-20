"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { normalizarTelefono } from "@/lib/telefono";
import { hoyEnZona } from "@/lib/fechas";
import { obtenerAjustesTaller } from "@/lib/taller";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface ResultadoCliente {
  error?: string;
  id?: string;
  ok?: boolean;
}

const clienteSchema = z.object({
  nombre: z.string().trim().min(2, { message: "El nombre es obligatorio" }).max(60),
  apellido: z.string().trim().max(60).optional(),
  telefono: z.string().trim().max(30).optional(),
  email: z.string().trim().max(120).optional(),
  documento: z.string().trim().max(20).optional(),
  notas: z.string().trim().max(500).optional(),
});

function armarFila(d: z.infer<typeof clienteSchema>) {
  return {
    nombre: d.nombre,
    apellido: d.apellido ?? "",
    // A E.164 siempre: de eso depende que el link de WhatsApp arme.
    telefono: d.telefono ? normalizarTelefono(d.telefono) : null,
    email: d.email || null,
    documento: d.documento || null,
    notas: d.notas || null,
  };
}

export async function crearCliente(datos: unknown): Promise<ResultadoCliente> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  const parseado = clienteSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
      .from("cliente")
      .insert({ taller_id: sesion.perfil.taller_id, ...armarFila(parseado.data) })
      .select("id")
      .single();

    if (error) {
      console.error("[crearCliente]", error.code);
      return { error: "No se pudo guardar el cliente" };
    }

    revalidatePath("/clientes");
    return { id: data.id };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

export async function actualizarCliente(id: string, datos: unknown): Promise<ResultadoCliente> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  const parseado = clienteSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  try {
    const supabase = await crearClienteServidor();
    // RLS acota al propio taller: no hace falta filtrar por taller_id acá.
    const { error } = await supabase.from("cliente").update(armarFila(parseado.data)).eq("id", id);

    if (error) {
      console.error("[actualizarCliente]", error.code);
      return { error: "No se pudieron guardar los cambios" };
    }

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

/**
 * Cambia el dueño de un vehículo.
 *
 * No pisa el vínculo anterior: le pone fecha de fin y crea uno nuevo. El
 * historial de mantenimiento pertenece al auto, y saber quién era el dueño en
 * cada momento es parte de ese historial. Los autos se venden.
 */
export async function cambiarDuenoVehiculo(
  vehiculoId: string,
  clienteId: string,
): Promise<ResultadoCliente> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  try {
    const supabase = await crearClienteServidor();
    // Fecha del taller: este valor cierra el período de tenencia anterior
    // del vehículo, así que un día de más o de menos falsea el historial.
    const { zonaHoraria } = await obtenerAjustesTaller();
    const hoy = hoyEnZona(zonaHoraria);

    const { data: vigente } = await supabase
      .from("vehiculo_cliente")
      .select("id, cliente_id")
      .eq("vehiculo_id", vehiculoId)
      .is("hasta", null)
      .maybeSingle();

    if (vigente?.cliente_id === clienteId) return { ok: true };

    if (vigente) {
      await supabase.from("vehiculo_cliente").update({ hasta: hoy }).eq("id", vigente.id);
    }

    const { error } = await supabase.from("vehiculo_cliente").insert({
      taller_id: sesion.perfil.taller_id,
      vehiculo_id: vehiculoId,
      cliente_id: clienteId,
      desde: hoy,
    });

    if (error) {
      console.error("[cambiarDueno]", error.code);
      return { error: "No se pudo cambiar el dueño" };
    }

    revalidatePath("/vehiculos");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

const vehiculoEdicionSchema = z.object({
  anio: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  color: z.string().trim().max(30).optional(),
  vin: z.string().trim().max(30).optional(),
  km: z.coerce.number().int().min(0).max(3000000).optional().nullable(),
  combustible: z.enum(["nafta", "diesel", "gnc", "hibrido", "electrico"]).optional().or(z.literal("")),
});

/**
 * Corrige los datos de un vehículo.
 *
 * La patente NO se edita: es la identidad del auto en el sistema y cambiarla
 * dejaría el historial colgado de otra chapa. Si está mal cargada, se da de
 * alta el auto correcto.
 */
export async function actualizarVehiculo(id: string, datos: unknown): Promise<ResultadoCliente> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  const parseado = vehiculoEdicionSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  const d = parseado.data;

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("vehiculo")
      .update({
        anio: d.anio ?? null,
        color: d.color || null,
        vin: d.vin || null,
        km_actual: d.km ?? null,
        // Solo se toca la fecha si hay kilometraje: si no, quedaría diciendo
        // que se actualizó algo que sigue vacío.
        km_actualizado_en: d.km != null ? new Date().toISOString() : null,
        combustible: d.combustible || null,
      })
      .eq("id", id);

    if (error) {
      console.error("[actualizarVehiculo]", error.code);
      return { error: "No se pudieron guardar los cambios" };
    }

    revalidatePath("/vehiculos");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

export async function obtenerClienteDetalle(clienteId: string) {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return null;

  try {
    const supabase = await crearClienteServidor();

    const [{ data: cliente }, { data: vehiculosCliente }, { data: ordenes }] = await Promise.all([
      supabase
        .from("cliente")
        .select("*")
        .eq("id", clienteId)
        .single(),
      supabase
        .from("vehiculo_cliente")
        .select(`
          id, desde, hasta,
          vehiculo:vehiculo_id (
            id, patente, anio, color, combustible, km_actual,
            marca:marca_id(nombre),
            modelo:modelo_id(nombre)
          )
        `)
        .eq("cliente_id", clienteId)
        .order("desde", { ascending: false }),
      supabase
        .from("orden_trabajo")
        .select(`
          id, numero, estado, total, fecha_ingreso, fecha_entrega,
          vehiculo:vehiculo_id ( patente, marca:marca_id(nombre), modelo:modelo_id(nombre) )
        `)
        .eq("cliente_id", clienteId)
        .order("fecha_ingreso", { ascending: false }),
    ]);

    if (!cliente) return null;

    return {
      cliente,
      vehiculos: vehiculosCliente || [],
      ordenes: ordenes || [],
    };
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}

