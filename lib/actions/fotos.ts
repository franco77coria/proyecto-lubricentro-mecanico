"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";
import { BUCKET_FOTOS, VIGENCIA_URL_SEGUNDOS } from "@/lib/storage";

export type TipoFoto = "cedula" | "estado_ingreso" | "dano" | "comprobante";

export interface ResultadoFoto {
  error?: string;
  id?: string;
}

/**
 * Registra en la base una foto que ya se subió al bucket.
 *
 * La subida la hace el navegador directo contra Storage (así el archivo no
 * pasa dos veces por el servidor), pero el vínculo con la OT se escribe acá
 * para que el taller_id salga de la sesión y no de lo que mande el cliente.
 */
export async function registrarFoto(
  otId: string,
  tipo: TipoFoto,
  path: string,
  nota?: string,
): Promise<ResultadoFoto> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  // El path tiene que caer dentro de la carpeta del taller. Sin este chequeo,
  // un cliente modificado podría registrar contra la OT propia un archivo
  // guardado en la carpeta de otro taller.
  if (!path.startsWith(`${sesion.perfil.taller_id}/`)) {
    return { error: "Ruta de archivo inválida" };
  }

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
      .from("ot_foto")
      .insert({
        taller_id: sesion.perfil.taller_id,
        ot_id: otId,
        tipo,
        path,
        nota: nota?.trim() || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[registrarFoto]", error.code);
      return { error: "No se pudo guardar la foto" };
    }

    revalidatePath(`/ot/${otId}`);
    return { id: data.id };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

export async function borrarFoto(fotoId: string, otId: string): Promise<ResultadoFoto> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  try {
    const supabase = await crearClienteServidor();

    const { data: foto } = await supabase
      .from("ot_foto")
      .select("path")
      .eq("id", fotoId)
      .maybeSingle();

    // RLS ya limita a las del propio taller: si no aparece, no es de acá.
    if (!foto) return { error: "La foto no existe" };

    await supabase.storage.from(BUCKET_FOTOS).remove([foto.path]);
    const { error } = await supabase.from("ot_foto").delete().eq("id", fotoId);
    if (error) return { error: "No se pudo borrar la foto" };

    revalidatePath(`/ot/${otId}`);
    return {};
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

/**
 * Guarda la firma del cliente.
 *
 * Es un upsert porque la fila de recepción puede no existir todavía: la firma
 * a veces se toma antes de completar el resto de los datos del ingreso.
 */
export async function guardarFirma(
  otId: string,
  momento: "recepcion" | "entrega",
  path: string,
): Promise<ResultadoFoto> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };
  if (!path.startsWith(`${sesion.perfil.taller_id}/`)) return { error: "Ruta de archivo inválida" };

  try {
    const supabase = await crearClienteServidor();

    // El tipo se declara de una sola forma con los dos campos opcionales.
    // Con una clave computada (`[campo]:`) o con un spread condicional,
    // TypeScript arma un union y deja de validar la fila contra la tabla.
    const fila: {
      ot_id: string;
      taller_id: string;
      firma_recepcion_url?: string;
      firma_entrega_url?: string;
    } = { ot_id: otId, taller_id: sesion.perfil.taller_id };

    if (momento === "recepcion") fila.firma_recepcion_url = path;
    else fila.firma_entrega_url = path;

    const { error } = await supabase.from("ot_recepcion").upsert(fila, { onConflict: "ot_id" });

    if (error) {
      console.error("[guardarFirma]", error.code);
      return { error: "No se pudo guardar la firma" };
    }

    revalidatePath(`/ot/${otId}`);
    return {};
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

export interface FotoConUrl {
  id: string;
  tipo: string;
  nota: string | null;
  url: string;
}

/**
 * Fotos de una OT con URL para mostrar.
 *
 * El bucket es privado, así que no hay URL pública: cada archivo se firma. Se
 * piden todas juntas en una sola llamada en lugar de una por foto.
 */
export async function fotosDeOT(otId: string): Promise<FotoConUrl[]> {
  const supabase = await crearClienteServidor();

  const { data: fotos } = await supabase
    .from("ot_foto")
    .select("id, tipo, nota, path")
    .eq("ot_id", otId)
    .order("tipo")
    .order("orden");

  if (!fotos?.length) return [];

  const { data: firmadas } = await supabase.storage
    .from(BUCKET_FOTOS)
    .createSignedUrls(fotos.map((f) => f.path), VIGENCIA_URL_SEGUNDOS);

  return fotos
    .map((f, i) => ({
      id: f.id,
      tipo: f.tipo,
      nota: f.nota,
      url: firmadas?.[i]?.signedUrl ?? "",
    }))
    // Una firma fallida daría una imagen rota; mejor no mostrarla.
    .filter((f) => f.url);
}
