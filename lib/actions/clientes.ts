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
  nombre: z.string().trim().min(2, { message: "El nombre es obligatorio (mínimo 2 letras)" }).max(60),
  apellido: z.string().trim().max(60).optional().nullable(),
  telefono: z.string().trim().max(30).optional().nullable(),
  email: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null))
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "El correo electrónico no es válido.",
    }),
  documento: z.string().trim().max(20).optional().nullable(),
  notas: z.string().trim().max(500).optional().nullable(),
});

function armarFila(d: z.infer<typeof clienteSchema>) {
  return {
    nombre: d.nombre.trim(),
    apellido: d.apellido?.trim() || "",
    // A E.164 siempre: de eso depende que el link de WhatsApp arme.
    telefono: d.telefono?.trim() ? normalizarTelefono(d.telefono) : null,
    email: d.email ? d.email.trim() : null,
    documento: d.documento?.trim() || null,
    notas: d.notas?.trim() || null,
  };
}

export async function crearCliente(datos: unknown): Promise<ResultadoCliente> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  const parseado = clienteSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  if (parseado.data.telefono?.trim() && !normalizarTelefono(parseado.data.telefono)) {
    return { error: "El teléfono no es válido. Ingresá un número con código de área (ej: 11 4455-6677)." };
  }

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
      .from("cliente")
      .insert({ taller_id: sesion.perfil.taller_id, ...armarFila(parseado.data) })
      .select("id")
      .single();

    if (error) {
      console.error("[crearCliente]", error.code, error.message);
      if (error.code === "23505") {
        return { error: "Ya existe un cliente con esos datos." };
      }
      return { error: "No se pudo guardar el cliente en el sistema." };
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

  if (parseado.data.telefono?.trim() && !normalizarTelefono(parseado.data.telefono)) {
    return { error: "El teléfono no es válido. Ingresá un número con código de área (ej: 11 4455-6677)." };
  }

  try {
    const supabase = await crearClienteServidor();
    const { data: actualizado, error } = await supabase
      .from("cliente")
      .update(armarFila(parseado.data))
      .eq("id", id)
      .eq("taller_id", sesion.perfil.taller_id)
      .select("id");

    if (error) {
      console.error("[actualizarCliente]", error.code);
      return { error: "No se pudieron guardar los cambios" };
    }

    if (!actualizado || actualizado.length === 0) {
      return { error: "Cliente no encontrado en este taller" };
    }

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

export async function archivarCliente(id: string): Promise<ResultadoCliente> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("cliente")
      .update({ archivado: true })
      .eq("id", id)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[archivarCliente]", error.code);
      return { error: "No se pudo eliminar o archivar el cliente" };
    }

    revalidatePath("/clientes");
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
      .eq("taller_id", sesion.perfil.taller_id)
      .is("hasta", null)
      .maybeSingle();

    if (vigente?.cliente_id === clienteId) return { ok: true };

    if (vigente) {
      await supabase
        .from("vehiculo_cliente")
        .update({ hasta: hoy })
        .eq("id", vigente.id)
        .eq("taller_id", sesion.perfil.taller_id);
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
    const { data: actualizado, error } = await supabase
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
      .eq("id", id)
      .eq("taller_id", sesion.perfil.taller_id)
      .select("id");

    if (error) {
      console.error("[actualizarVehiculo]", error.code);
      return { error: "No se pudieron guardar los cambios" };
    }

    if (!actualizado || actualizado.length === 0) {
      return { error: "Vehículo no encontrado en este taller" };
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

    const tallerId = sesion.perfil.taller_id;
    const [{ data: cliente }, { data: vehiculosCliente }, { data: ordenes }] = await Promise.all([
      supabase
        .from("cliente")
        .select("id, taller_id, nombre, apellido, telefono, email, documento, notas, archivado, creado_en")
        .eq("id", clienteId)
        .eq("taller_id", tallerId)
        .maybeSingle(),
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
        .eq("taller_id", tallerId)
        .order("desde", { ascending: false }),
      supabase
        .from("orden_trabajo")
        .select(`
          id, numero, estado, total, fecha_ingreso, fecha_entrega, asignado_a,
          mecanico:asignado_a ( user_id, nombre, rol ),
          logs:ot_estado_log (
            id, estado_anterior, estado_nuevo, creado_en, usuario_id,
            usuario:usuario_id ( user_id, nombre, rol )
          ),
          vehiculo:vehiculo_id ( patente, marca:marca_id(nombre), modelo:modelo_id(nombre) )
        `)
        .eq("cliente_id", clienteId)
        .eq("taller_id", tallerId)
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

export interface ClienteOmniResultado {
  id: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  documento: string | null;
  vehiculos: {
    id: string;
    patente: string;
    anio?: number | null;
    marca?: string | null;
    modelo?: string | null;
    color?: string | null;
    km_actual?: number | null;
  }[];
}

/**
 * Búsqueda unificada omnicanal de clientes y vehículos para autocompletado en recepción.
 *
 * Permite encontrar a un cliente existente por:
 * - Nombre o Apellido
 * - Teléfono / WhatsApp
 * - DNI o CUIT
 * - Chapa Patente de cualquier vehículo que haya atendido
 */
export async function buscarClientesOmni(termino: string): Promise<ClienteOmniResultado[]> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return [];

  const q = termino.trim();
  if (q.length < 2) return [];

  try {
    const supabase = await crearClienteServidor();
    const tallerId = sesion.perfil.taller_id;

    // 1. Buscar clientes directos por texto
    const { data: clientesPorTexto } = await supabase
      .from("cliente")
      .select("id, nombre, apellido, telefono, documento")
      .eq("taller_id", tallerId)
      .or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,telefono.ilike.%${q}%,documento.ilike.%${q}%`)
      .limit(12);

    // 2. Buscar vehículos por patente para deducir clientes
    const patenteNormalizada = q.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const { data: vehiculosMatch } = await supabase
      .from("vehiculo")
      .select(`
        id, patente, anio, color, km_actual,
        marca:marca_id(nombre),
        modelo:modelo_id(nombre),
        vinculos:vehiculo_cliente (
          cliente:cliente_id (id, nombre, apellido, telefono, documento)
        )
      `)
      .eq("taller_id", tallerId)
      .ilike("patente", `%${patenteNormalizada || q}%`)
      .limit(8);

    const mapClientes = new Map<string, ClienteOmniResultado>();

    for (const c of clientesPorTexto || []) {
      mapClientes.set(c.id, {
        id: c.id,
        nombre: c.nombre,
        apellido: c.apellido,
        telefono: c.telefono,
        documento: c.documento,
        vehiculos: [],
      });
    }

    for (const v of vehiculosMatch || []) {
      const vinculos = (v.vinculos || []) as unknown as Array<{
        cliente?: { id: string; nombre: string; apellido: string | null; telefono: string | null; documento: string | null } | null;
      }>;
      for (const vinculo of vinculos) {
        if (vinculo.cliente && !mapClientes.has(vinculo.cliente.id)) {
          mapClientes.set(vinculo.cliente.id, {
            id: vinculo.cliente.id,
            nombre: vinculo.cliente.nombre,
            apellido: vinculo.cliente.apellido,
            telefono: vinculo.cliente.telefono,
            documento: vinculo.cliente.documento,
            vehiculos: [],
          });
        }
      }
    }

    if (mapClientes.size === 0) return [];

    const idsClientes = Array.from(mapClientes.keys());

    // 3. Cargar los vehículos de los clientes encontrados
    const { data: vehiculosClientes } = await supabase
      .from("vehiculo_cliente")
      .select(`
        cliente_id,
        vehiculo:vehiculo_id (
          id, patente, anio, color, km_actual,
          marca:marca_id(nombre),
          modelo:modelo_id(nombre)
        )
      `)
      .in("cliente_id", idsClientes);

    for (const vc of vehiculosClientes || []) {
      const c = mapClientes.get(vc.cliente_id);
      if (c && vc.vehiculo) {
        const v = vc.vehiculo as unknown as {
          id: string;
          patente: string;
          anio?: number | null;
          color?: string | null;
          km_actual?: number | null;
          marca?: { nombre: string } | null;
          modelo?: { nombre: string } | null;
        };
        if (!c.vehiculos.some((existente) => existente.id === v.id)) {
          c.vehiculos.push({
            id: v.id,
            patente: v.patente,
            anio: v.anio,
            color: v.color,
            km_actual: v.km_actual,
            marca: v.marca?.nombre,
            modelo: v.modelo?.nombre,
          });
        }
      }
    }

    return Array.from(mapClientes.values());
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}


