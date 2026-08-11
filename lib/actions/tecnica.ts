"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface FichaTecnica {
  motorizacion: string;
  modelo: string;
  tiene_ficha: boolean;
  verificada: boolean;
  estado: string;
  aceite_litros: number | null;
  aceite_viscosidad: string | null;
  aceite_norma: string | null;
  filtro_aceite: string | null;
  filtro_aire: string | null;
  filtro_combustible: string | null;
  filtro_habitaculo: string | null;
  service_km: number | null;
  notas: string | null;
}

export interface EquivalenciaFiltro {
  codigo: string;
  marca: string | null;
  tipo: string | null;
}

export async function obtenerFichaDeVehiculo(vehiculoId: string): Promise<FichaTecnica | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("ficha_de_vehiculo", { p_vehiculo: vehiculoId });
  if (error || !data || !(data as any).tiene_ficha) return null;
  return data as unknown as FichaTecnica;
}

export async function obtenerFichaPorMotorizacion(motorizacionId: string): Promise<Partial<FichaTecnica> | null> {
  if (!motorizacionId) return null;
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("ficha_tecnica")
    .select("*")
    .eq("motorizacion_id", motorizacionId)
    .single();
    
  if (error || !data) return null;
  return data;
}

export async function buscarEquivalenciasFiltro(codigo: string): Promise<EquivalenciaFiltro[]> {
  if (!codigo || codigo.trim().length === 0) return [];
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("equivalencias_filtro", { p_codigo: codigo });
  if (error) {
    console.error("[buscarEquivalenciasFiltro]", error);
    return [];
  }
  return data || [];
}

const equivalenciaSchema = z.object({
  codigoA: z.string().trim().min(1, "El código A es obligatorio"),
  marcaA: z.string().trim().optional(),
  codigoB: z.string().trim().min(1, "El código B es obligatorio"),
  marcaB: z.string().trim().optional(),
  tipo: z.enum(["aceite", "aire", "combustible", "habitaculo"]).optional(),
}).refine(data => data.codigoA.toUpperCase() !== data.codigoB.toUpperCase(), {
  message: "Los códigos no pueden ser idénticos",
  path: ["codigoB"]
});

export type DatosEquivalencia = z.infer<typeof equivalenciaSchema>;

export async function agregarEquivalenciaFiltro(datos: DatosEquivalencia) {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "No autorizado" };

  const parsed = equivalenciaSchema.safeParse(datos);
  if (!parsed.success) return { error: "Datos inválidos" };

  try {
    const supabase = await crearClienteServidor();
    
    // Sort so it doesn't violate constraint
    let { codigoA, marcaA, codigoB, marcaB, tipo } = parsed.data;
    if (codigoA.toUpperCase() > codigoB.toUpperCase()) {
      [codigoA, codigoB] = [codigoB, codigoA];
      [marcaA, marcaB] = [marcaB, marcaA];
    }
    
    const { error } = await supabase.from("filtro_equivalencia").insert({
      codigo_a: codigoA,
      codigo_b: codigoB,
      marca_a: marcaA || null,
      marca_b: marcaB || null,
      tipo: tipo || null,
      taller_origen_id: sesion.perfil.taller_id,
      estado: "pendiente"
    });

    if (error) {
      if (error.code === '23505') { // unique violation
        return { error: "Esta equivalencia ya existe" };
      }
      throw error;
    }
    
    revalidatePath("/stock/equivalencias");
    return { success: true };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[agregarEquivalenciaFiltro]", err);
    return { error: "No se pudo guardar la equivalencia" };
  }
}
