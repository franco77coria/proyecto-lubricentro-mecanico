"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export type EstadoTurno = "pendiente" | "confirmado" | "ingresado" | "cancelado" | "no_asistio";

export interface Turno {
  id: string;
  taller_id: string;
  cliente_id: string | null;
  vehiculo_id: string | null;
  fecha_hora: string;
  motivo: string;
  notas: string | null;
  estado: EstadoTurno;
  creado_por: string;
  creado_en: string;
  
  // Joins
  vehiculo?: {
    patente: string;
    motorizacion?: {
      nombre: string;
      modelo?: {
        nombre: string;
        marca?: { nombre: string };
      };
    };
  } | null;
  cliente?: {
    nombre: string;
    telefono: string | null;
  } | null;
}

const turnoSchema = z.object({
  clienteId: z.string().uuid().optional().nullable(),
  vehiculoId: z.string().uuid().optional().nullable(),
  fechaHora: z.string().datetime(),
  motivo: z.string().min(1, "El motivo es obligatorio"),
  notas: z.string().optional().nullable(),
});

export type DatosNuevoTurno = z.infer<typeof turnoSchema>;

export async function listarTurnos(desde: Date, hasta: Date): Promise<Turno[]> {
  const supabase = (await crearClienteServidor()) as any;
  const { data, error } = await supabase
    .from("turno")
    .select(`
      *,
      cliente (nombre, telefono),
      vehiculo (
        patente,
        motorizacion (
          nombre,
          modelo (
            nombre,
            marca (nombre)
          )
        )
      )
    `)
    .gte("fecha_hora", desde.toISOString())
    .lte("fecha_hora", hasta.toISOString())
    .order("fecha_hora", { ascending: true });

  if (error) {
    console.error("[listarTurnos]", error);
    return [];
  }
  return data as Turno[];
}

export async function crearTurno(datos: DatosNuevoTurno): Promise<{ id?: string; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "No autorizado" };

  const validado = turnoSchema.safeParse(datos);
  if (!validado.success) return { error: "Datos inválidos" };

  try {
    const supabase = (await crearClienteServidor()) as any;
    const { data, error } = await supabase
      .from("turno")
      .insert({
        taller_id: sesion.perfil.taller_id,
        cliente_id: validado.data.clienteId || null,
        vehiculo_id: validado.data.vehiculoId || null,
        fecha_hora: validado.data.fechaHora,
        motivo: validado.data.motivo,
        notas: validado.data.notas || null,
        estado: "pendiente",
        creado_por: sesion.user.id,
      })
      .select("id")
      .single();

    if (error) throw error;
    
    revalidatePath("/turnos");
    return { id: data.id };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[crearTurno]", err);
    return { error: "No se pudo crear el turno" };
  }
}

export async function cambiarEstadoTurno(id: string, estado: EstadoTurno): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = (await crearClienteServidor()) as any;
    
    // 1. Obtener estado actual
    const { data: turnoActual, error: errorFetch } = await supabase
      .from("turno")
      .select("estado")
      .eq("id", id)
      .single();
      
    if (errorFetch || !turnoActual) {
      return { success: false, error: "Turno no encontrado." };
    }
    
    const estadoActual = turnoActual.estado;
    
    // 2. Validar máquina de estados
    if (estadoActual === 'cancelado' || estadoActual === 'ingresado' || estadoActual === 'no_asistio') {
      return { success: false, error: "No se puede cambiar el estado de un turno finalizado." };
    }
    
    if (estadoActual === 'pendiente' && !['confirmado', 'cancelado'].includes(estado)) {
      return { success: false, error: "Un turno pendiente solo puede pasar a confirmado o cancelado." };
    }
    
    if (estadoActual === 'confirmado' && !['ingresado', 'no_asistio', 'cancelado'].includes(estado)) {
      return { success: false, error: "Transición de estado inválida desde confirmado." };
    }
    
    // 3. Actualizar (dejando que el trigger actualice actualizado_en)
    const { data, error } = await supabase
      .from("turno")
      .update({ estado })
      .eq("id", id)
      .select("id")
      .single();
      
    if (error) throw error;
    
    revalidatePath("/turnos");
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[cambiarEstadoTurno]", err);
    return { success: false, error: "No se pudo actualizar el turno" };
  }
}
