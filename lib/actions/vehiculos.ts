"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { vehiculoEspecialSchema, vehiculoSchema } from "@/lib/schemas/vehiculo";
import { normalizarTelefono } from "@/lib/telefono";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface ResultadoVehiculo {
  error?: string;
  /** Cuando la patente ya existe, se devuelve el auto para poder abrirlo en
   *  vez de tratarlo como un error. Cargar dos veces el mismo auto no es un
   *  fallo del usuario: es que el auto ya estuvo acá. */
  duplicado?: { id: string; patente: string; descripcion: string };
  creado?: { id: string; patente: string };
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
    anio: formData.get("anio") ?? "",
    color: formData.get("color") ?? "",
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
        anio: d.anio === "" ? null : Number(d.anio),
        color: d.color || null,
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
          .select("id, patente, anio, marca:marca_id(nombre), modelo:modelo_id(nombre)")
          .eq("patente_norm", d.patente)
          .maybeSingle();

        if (existente) {
          const partes = [
            existente.marca?.nombre,
            existente.modelo?.nombre,
            existente.anio ? String(existente.anio) : null,
          ].filter(Boolean);
          return {
            duplicado: {
              id: existente.id,
              patente: existente.patente,
              descripcion: partes.length ? partes.join(" ") : "sin datos de modelo",
            },
          };
        }
      }
      console.error("[crearVehiculo]", error.code);
      return { error: "No se pudo guardar el vehículo." };
    }

    // Cliente opcional. Si falla, el auto ya quedó cargado: se avisa pero no
    // se pierde el trabajo hecho.
    if (d.clienteNombre?.trim()) {
      const { data: cliente, error: errorCliente } = await supabase
        .from("cliente")
        .insert({
          taller_id: tallerId,
          nombre: d.clienteNombre.trim(),
          apellido: d.clienteApellido?.trim() ?? "",
          telefono: d.clienteTelefono ? normalizarTelefono(d.clienteTelefono) : null,
        })
        .select("id")
        .single();

      if (errorCliente) {
        console.error("[crearVehiculo/cliente]", errorCliente.code);
        return { creado: vehiculo, error: "El auto se guardó, pero el cliente no. Cargalo desde la ficha." };
      }

      await supabase.from("vehiculo_cliente").insert({
        taller_id: tallerId,
        vehiculo_id: vehiculo.id,
        cliente_id: cliente.id,
      });
    }

    revalidatePath("/vehiculos");
    return { creado: vehiculo };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar. Probá de nuevo." };
  }
}

/**
 * Alta de un modelo que no está en el catálogo.
 *
 * Queda como `pendiente` para que un humano lo apruebe o lo fusione después.
 * Lo importante es que no frena a nadie: el mostrador carga el auto y sigue.
 */
export async function proponerModelo(
  marcaId: string,
  nombre: string,
): Promise<{ id?: string; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  const limpio = nombre.trim();
  if (limpio.length < 1 || limpio.length > 60) return { error: "Nombre de modelo inválido" };

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
      .from("modelo")
      .insert({ marca_id: marcaId, nombre: limpio, origen: "manual", estado: "pendiente" })
      .select("id")
      .single();

    if (error) {
      // Ya existía: se usa el que hay en vez de duplicar.
      if (error.code === CODIGO_UNICIDAD) {
        const { data: existente } = await supabase
          .from("modelo")
          .select("id")
          .eq("marca_id", marcaId)
          .ilike("nombre", limpio)
          .maybeSingle();
        if (existente) return { id: existente.id };
      }
      console.error("[proponerModelo]", error.code);
      return { error: "No se pudo agregar el modelo" };
    }
    return { id: data.id };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}
