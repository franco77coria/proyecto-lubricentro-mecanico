"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { BUCKET_FOTOS, VIGENCIA_URL_SEGUNDOS } from "@/lib/storage";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface FotoCompraConUrl {
  id: string;
  compraId: string;
  path: string;
  nota: string | null;
  url: string;
  creadoEn: string;
  subidoPor: string | null;
}

export interface ResultadoFotoCompra {
  error?: string;
  id?: string;
  success?: boolean;
}

/**
 * Obtiene el ID del taller de la sesión actual.
 */
export async function obtenerTallerIdActual(): Promise<string | null> {
  const sesion = await obtenerSesion();
  return sesion?.perfil?.taller_id ?? null;
}

/**
 * Registra en la base de datos la foto de un comprobante físico o remito de compra
 * que ya fue subida al bucket de Storage.
 *
 * El aislamiento de tenant se garantiza validando que el path empiece con el taller_id
 * de la sesión activa del usuario.
 */
export async function registrarFotoCompra(
  compraId: string,
  path: string,
  nota?: string,
): Promise<ResultadoFotoCompra> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  if (sesion.perfil.rol === "mecanico") {
    return { error: "Sin permisos para gestionar comprobantes de compras" };
  }

  // Validación de seguridad de tenant: el path debe pertenecer al taller
  if (!path.startsWith(`${sesion.perfil.taller_id}/`)) {
    return { error: "Ruta de archivo inválida" };
  }

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
      .from("compra_foto")
      .insert({
        taller_id: sesion.perfil.taller_id,
        compra_id: compraId,
        path,
        nota: nota?.trim() || null,
        subido_por: sesion.user.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[registrarFotoCompra]", error.code);
      return { error: "No se pudo guardar el comprobante" };
    }

    revalidatePath("/compras");
    return { id: data.id, success: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

/**
 * Fotos / comprobantes de una compra con URLs firmadas temporales para visualización segura.
 */
export async function fotosDeCompra(compraId: string): Promise<FotoCompraConUrl[]> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return [];

  if (sesion.perfil.rol === "mecanico") return [];

  try {
    const supabase = await crearClienteServidor();

    const { data: fotos, error } = await supabase
      .from("compra_foto")
      .select("id, compra_id, path, nota, creado_en, subido_por")
      .eq("compra_id", compraId)
      .eq("taller_id", sesion.perfil.taller_id)
      .order("creado_en", { ascending: true });

    if (error || !fotos?.length) return [];

    const { data: firmadas } = await supabase.storage
      .from(BUCKET_FOTOS)
      .createSignedUrls(
        fotos.map((f) => f.path),
        VIGENCIA_URL_SEGUNDOS,
      );

    return fotos
      .map((f, i) => ({
        id: f.id,
        compraId: f.compra_id,
        path: f.path,
        nota: f.nota,
        url: firmadas?.[i]?.signedUrl ?? "",
        creadoEn: f.creado_en,
        subidoPor: f.subido_por,
      }))
      .filter((f) => Boolean(f.url));
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

/**
 * Borra una foto de comprobante de compra del bucket de Storage y de la tabla compra_foto.
 */
export async function borrarFotoCompra(
  fotoId: string,
  compraId: string,
): Promise<ResultadoFotoCompra> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };

  if (sesion.perfil.rol === "mecanico") {
    return { error: "Sin permisos para gestionar comprobantes de compras" };
  }

  try {
    const supabase = await crearClienteServidor();

    const { data: foto } = await supabase
      .from("compra_foto")
      .select("path")
      .eq("id", fotoId)
      .eq("taller_id", sesion.perfil.taller_id)
      .maybeSingle();

    if (!foto) return { error: "El comprobante no existe" };

    await supabase.storage.from(BUCKET_FOTOS).remove([foto.path]);

    const { error } = await supabase
      .from("compra_foto")
      .delete()
      .eq("id", fotoId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[borrarFotoCompra]", error.code);
      return { error: "No se pudo borrar el comprobante" };
    }

    revalidatePath("/compras");
    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}
