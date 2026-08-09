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
    motorizacionId: formData.get("motorizacionId") ?? "",
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
        motorizacion_id: d.motorizacionId || null,
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
          .select(
            `id, patente, anio, color, combustible, vin, km_actual,
             marca_id, modelo_id, motorizacion_id,
             marca:marca_id(nombre), modelo:modelo_id(nombre),
             motorizacion:motorizacion_id(nombre)`,
          )
          .eq("patente_norm", d.patente)
          .maybeSingle();

        if (existente) {
          // El auto ya estaba. Se COMPLETA lo que le falta y no se pisa nada de
          // lo que ya tiene: la ficha vieja puede haber sido corregida a mano y
          // una recepción apurada no tiene por qué ganarle.
          //
          // Sin esto, la motorización que el mostrador acaba de elegir se
          // descartaba en silencio — y como la columna es nueva, TODOS los autos
          // ya cargados la tienen vacía. Es decir: por este camino nunca se
          // llenaba, que es justo el dato que necesita la ficha técnica.
          const parche: ParcheVehiculo = {};
          if (d.marcaId && !existente.marca_id) parche.marca_id = d.marcaId;
          if (d.modeloId && !existente.modelo_id) parche.modelo_id = d.modeloId;
          if (d.motorizacionId && !existente.motorizacion_id) {
            parche.motorizacion_id = d.motorizacionId;
          }
          if (d.anio !== "" && existente.anio == null) parche.anio = Number(d.anio);
          if (d.color && !existente.color) parche.color = d.color;
          if (d.combustible && !existente.combustible) parche.combustible = d.combustible;

          // El kilometraje es la excepción: no se "completa", se actualiza. Pero
          // solo hacia arriba. Un odómetro no baja, así que un número menor al
          // guardado es un error de tipeo y pisarlo perdería el dato bueno.
          if (d.km !== "" && Number(d.km) > (existente.km_actual ?? -1)) {
            parche.km_actual = Number(d.km);
            parche.km_actualizado_en = new Date().toISOString();
          }

          if (Object.keys(parche).length > 0) {
            const { error: errorParche } = await supabase
              .from("vehiculo")
              .update(parche)
              .eq("id", existente.id)
              .eq("taller_id", tallerId);
            if (errorParche) console.error("[crearVehiculo/completar]", errorParche.code);
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

// El alta de marca / modelo / motorización que no están en el catálogo vive en
// `lib/actions/catalogo.ts`: la resolución de duplicados tiene que usar el
// mismo `normalizar()` que el índice único, así que corre en Postgres.
