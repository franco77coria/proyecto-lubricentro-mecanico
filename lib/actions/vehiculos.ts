"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { vehiculoEspecialSchema, vehiculoSchema } from "@/lib/schemas/vehiculo";
import { normalizarTelefono } from "@/lib/telefono";
import type { Database } from "@/lib/supabase/database.types";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

/** Solo las columnas que la app puede tocar, con los tipos de la base. */
type ParcheVehiculo = Database["public"]["Tables"]["vehiculo"]["Update"];

export interface ResultadoVehiculo {
  error?: string;
  duplicado?: { id: string; patente: string; descripcion: string; clienteId?: string };
  creado?: { id: string; patente: string; clienteId?: string };
  clienteId?: string;
}

const CODIGO_UNICIDAD = "23505";

export async function crearVehiculo(
  _previo: ResultadoVehiculo,
  formData: FormData,
): Promise<ResultadoVehiculo> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida. Volvé a entrar." };

  const especial = formData.get("formatoEspecial") === "on";
  const schema = especial ? vehiculoEspecialSchema : vehiculoSchema;

  const parseado = schema.safeParse({
    patente: formData.get("patente"),
    marcaId: formData.get("marcaId") ?? "",
    modeloId: formData.get("modeloId") ?? "",
    motorizacionId: formData.get("motorizacionId") ?? "",
    anio: formData.get("anio") ?? "",
    color: formData.get("color") ?? "",
    vin: formData.get("vin") ?? "",
    combustible: formData.get("combustible") ?? "",
    km: formData.get("km") ?? "",
    clienteNombre: formData.get("clienteNombre") ?? "",
    clienteApellido: formData.get("clienteApellido") ?? "",
    clienteTelefono: formData.get("clienteTelefono") ?? "",
  });

  if (!parseado.success) return { error: parseado.error.issues[0].message };
  const d = parseado.data;
  const tallerId = sesion.perfil.taller_id;

  try {
    const supabase = await crearClienteServidor();

    const { data: vehiculo, error } = await supabase
      .from("vehiculo")
      .insert({
        taller_id: tallerId,
        patente: d.patente,
        formato_especial: especial,
        marca_id: d.marcaId || null,
        modelo_id: d.modeloId || null,
        motorizacion_id: d.motorizacionId || null,
        anio: d.anio === "" ? null : Number(d.anio),
        color: d.color || null,
        vin: d.vin || null,
        combustible: d.combustible || null,
        km_actual: d.km === "" ? null : Number(d.km),
        km_actualizado_en: d.km === "" ? null : new Date().toISOString(),
      })
      .select("id, patente")
      .single();

    if (error) {
      if (error.code === CODIGO_UNICIDAD) {
        const { data: existente } = await supabase
          .from("vehiculo")
          .select(
            `id, patente, anio, color, combustible, vin, km_actual,
             marca_id, modelo_id, motorizacion_id,
             marca:marca_id(nombre), modelo:modelo_id(nombre),
             motorizacion:motorizacion_id(nombre)`,
          )
          .eq("patente_norm", d.patente)
          .maybeSingle();

        if (existente) {
          const parche: ParcheVehiculo = {};
          if (d.marcaId && !existente.marca_id) parche.marca_id = d.marcaId;
          if (d.modeloId && !existente.modelo_id) parche.modelo_id = d.modeloId;
          if (d.motorizacionId && !existente.motorizacion_id) {
            parche.motorizacion_id = d.motorizacionId;
          }
          if (d.anio !== "" && existente.anio == null) parche.anio = Number(d.anio);
          if (d.color && !existente.color) parche.color = d.color;
          if (d.vin && !existente.vin) parche.vin = d.vin;
          if (d.combustible && !existente.combustible) parche.combustible = d.combustible;

          if (d.km !== "" && Number(d.km) > (existente.km_actual ?? -1)) {
            parche.km_actual = Number(d.km);
            parche.km_actualizado_en = new Date().toISOString();
          }

          if (Object.keys(parche).length > 0) {
            await supabase
              .from("vehiculo")
              .update(parche)
              .eq("id", existente.id)
              .eq("taller_id", tallerId);
          }

          // Resolver cliente (deduplicar si se pasó un nombre o teléfono)
          let resolvedClienteId: string | undefined = undefined;
          if (d.clienteNombre?.trim() || d.clienteTelefono?.trim()) {
            resolvedClienteId = await resolverOCrearCliente(supabase, tallerId, {
              nombre: d.clienteNombre || "",
              apellido: d.clienteApellido || "",
              telefono: d.clienteTelefono || "",
            });

            if (resolvedClienteId) {
              await cambiarDuenoVehiculo(existente.id, resolvedClienteId);
            }
          } else {
            const { data: vc } = await supabase
              .from("vehiculo_cliente")
              .select("cliente_id")
              .eq("vehiculo_id", existente.id)
              .is("hasta", null)
              .maybeSingle();
            resolvedClienteId = vc?.cliente_id;
          }

          const partes = [
            existente.marca?.nombre,
            existente.modelo?.nombre,
            existente.motorizacion?.nombre,
            existente.anio ? String(existente.anio) : null,
          ].filter(Boolean);

          return {
            duplicado: {
              id: existente.id,
              patente: existente.patente,
              descripcion: partes.length ? partes.join(" ") : "sin datos de modelo",
              clienteId: resolvedClienteId,
            },
            clienteId: resolvedClienteId,
          };
        }
      }
      console.error("[crearVehiculo]", error.code);
      return { error: "No se pudo guardar el vehículo." };
    }

    // Si es un auto nuevo y se pasaron datos de cliente, resolver o crear sin duplicar
    let nuevoClienteId: string | undefined = undefined;
    if (d.clienteNombre?.trim() || d.clienteTelefono?.trim()) {
      nuevoClienteId = await resolverOCrearCliente(supabase, tallerId, {
        nombre: d.clienteNombre || "",
        apellido: d.clienteApellido || "",
        telefono: d.clienteTelefono || "",
      });

      if (nuevoClienteId) {
        await supabase.from("vehiculo_cliente").insert({
          taller_id: tallerId,
          vehiculo_id: vehiculo.id,
          cliente_id: nuevoClienteId,
        });
      }
    }

    revalidatePath("/vehiculos");
    return {
      creado: {
        id: vehiculo.id,
        patente: vehiculo.patente,
        clienteId: nuevoClienteId,
      },
      clienteId: nuevoClienteId,
    };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar con el servidor." };
  }
}

/**
 * Busca un cliente existente por teléfono o nombre en el taller. Si no existe, lo crea.
 */
async function resolverOCrearCliente(
  supabase: any,
  tallerId: string,
  datos: { nombre: string; apellido: string; telefono: string },
): Promise<string | undefined> {
  const telNorm = datos.telefono ? normalizarTelefono(datos.telefono) : null;
  const nom = datos.nombre.trim();
  const ape = datos.apellido.trim();

  // 1. Buscar por teléfono si está presente
  if (telNorm) {
    const { data: porTel } = await supabase
      .from("cliente")
      .select("id")
      .eq("taller_id", tallerId)
      .eq("telefono", telNorm)
      .maybeSingle();

    if (porTel) return porTel.id;
  }

  // 2. Buscar por nombre y apellido
  if (nom) {
    const { data: porNombre } = await supabase
      .from("cliente")
      .select("id")
      .eq("taller_id", tallerId)
      .ilike("nombre", nom)
      .ilike("apellido", ape || "%")
      .maybeSingle();

    if (porNombre) return porNombre.id;
  }

  // 3. Si no existe y tiene al menos nombre, crearlo
  if (nom) {
    const { data: nuevoCliente } = await supabase
      .from("cliente")
      .insert({
        taller_id: tallerId,
        nombre: nom,
        apellido: ape,
        telefono: telNorm,
      })
      .select("id")
      .single();

    return nuevoCliente?.id;
  }

  return undefined;
}

export async function vincularVehiculoACliente(
  clienteId: string,
  vehiculoId: string,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  try {
    const supabase = await crearClienteServidor();
    const tallerId = sesion.perfil.taller_id;

    // Cerrar dueño anterior si existía
    await supabase
      .from("vehiculo_cliente")
      .update({ hasta: new Date().toISOString() })
      .eq("vehiculo_id", vehiculoId)
      .is("hasta", null);

    // Insertar nuevo vínculo
    const { error } = await supabase.from("vehiculo_cliente").insert({
      taller_id: tallerId,
      vehiculo_id: vehiculoId,
      cliente_id: clienteId,
      desde: new Date().toISOString(),
    });

    if (error) return { error: "No se pudo vincular el vehículo" };

    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath("/clientes");
    revalidatePath("/vehiculos");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "Error de servidor al vincular" };
  }
}

export async function cambiarDuenoVehiculo(
  vehiculoId: string,
  nuevoClienteId: string,
): Promise<{ error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida. Volvé a entrar." };

  try {
    const supabase = await crearClienteServidor();
    const tallerId = sesion.perfil.taller_id;

    const { error: errorCerrar } = await supabase
      .from("vehiculo_cliente")
      .update({ hasta: new Date().toISOString() })
      .eq("vehiculo_id", vehiculoId)
      .is("hasta", null);

    if (errorCerrar) {
      console.error("[cambiarDuenoVehiculo/cerrar]", errorCerrar.code);
      return { error: "No se pudo actualizar el dueño anterior." };
    }

    const { error: errorAbrir } = await supabase.from("vehiculo_cliente").insert({
      taller_id: tallerId,
      vehiculo_id: vehiculoId,
      cliente_id: nuevoClienteId,
    });

    if (errorAbrir) {
      console.error("[cambiarDuenoVehiculo/abrir]", errorAbrir.code);
      return { error: "No se pudo asignar el nuevo dueño." };
    }

    revalidatePath("/vehiculos");
    revalidatePath(`/vehiculos/${vehiculoId}`);
    return {};
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function obtenerVehiculosParaAsignar(): Promise<
  Array<{ id: string; patente: string; marca: string | null; modelo: string | null; anio: number | null; motorizacion: string | null }>
> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return [];

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("vehiculo")
    .select(`id, patente, anio, marca:marca_id(nombre), modelo:modelo_id(nombre), motorizacion:motorizacion_id(nombre)`)
    .eq("taller_id", sesion.perfil.taller_id)
    .order("creado_en", { ascending: false })
    .limit(100);

  return (data || []).map((v: any) => ({
    id: v.id,
    patente: v.patente,
    anio: v.anio || null,
    marca: v.marca?.nombre || null,
    modelo: v.modelo?.nombre || null,
    motorizacion: v.motorizacion?.nombre || null,
  }));
}

