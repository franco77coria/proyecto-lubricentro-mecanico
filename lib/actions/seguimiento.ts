"use server";

import { unstable_rethrow } from "next/navigation";

import { crearClienteAnonimo } from "@/lib/supabase/server";
import { BUCKET_FOTOS, VIGENCIA_URL_SEGUNDOS } from "@/lib/storage";

export interface NotaPublica {
  tipo: "anomalia" | "descargo" | "recomendado";
  texto: string;
  precio: number | null;
  fecha: string;
}

export interface ItemPublico {
  descripcion: string;
  tipo: string;
  cantidad: number;
  subtotal: number;
}

export interface FotoPublica {
  id: string;
  tipo: "estado_ingreso" | "dano" | "comprobante";
  path: string;
  nota: string | null;
  creado_en: string;
  url?: string;
}

export interface TelemetriaPublica {
  km: number | null;
  combustible: number | null;
}

export interface SeguimientoOT {
  numero: string;
  estado: string;
  fecha_ingreso: string;
  fecha_entrega: string | null;
  patente: string;
  vehiculo: string | null;
  total: number;
  total_mano_obra: number;
  total_repuestos: number;
  aprobado_en: string | null;
  taller: { nombre: string; telefono: string | null; direccion: string | null };
  telemetria?: TelemetriaPublica;
  notas: NotaPublica[];
  items: ItemPublico[];
  fotos?: FotoPublica[];
  historial: { estado: string; fecha: string }[];
}

/**
 * Todo el seguimiento entra como `anon`, sin importar quién esté mirando.
 *
 * Las funciones de 0030/0037 son la única puerta: `anon` no tiene privilegios sobre
 * ninguna tabla y las observaciones internas no se exponen jamás.
 */
export async function obtenerSeguimiento(token: string): Promise<SeguimientoOT | null> {
  try {
    const supabase = crearClienteAnonimo();
    const { data, error } = await supabase.rpc("seguimiento_por_token", { p_token: token });
    if (error) {
      console.error("[obtenerSeguimiento]", error.code);
      return null;
    }

    const ot = (data as unknown as SeguimientoOT | null) ?? null;
    if (!ot) return null;

    // Firmar URLs de fotos si existen
    if (ot.fotos && ot.fotos.length > 0) {
      try {
        const paths = ot.fotos.map((f) => f.path);
        const { data: firmadas } = await supabase.storage
          .from(BUCKET_FOTOS)
          .createSignedUrls(paths, VIGENCIA_URL_SEGUNDOS);

        if (firmadas?.length) {
          ot.fotos = ot.fotos
            .map((f, idx) => ({
              ...f,
              url: firmadas[idx]?.signedUrl ?? "",
            }))
            .filter((f) => !!f.url);
        }
      } catch (err) {
        console.error("[obtenerSeguimiento:fotos]", err);
      }
    }

    return ot;
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}

export interface EstadoPorPatente {
  encontrado: boolean;
  estado?: string;
  patente?: string;
  vehiculo?: string | null;
  taller?: string;
  demasiadas_consultas?: boolean;
  espera_segundos?: number;
}

/**
 * Consulta por patente. Devuelve SOLO el estado.
 */
export async function consultarPorPatente(patente: string): Promise<EstadoPorPatente> {
  try {
    const supabase = crearClienteAnonimo();
    const { data, error } = await supabase.rpc("seguimiento_por_patente", {
      p_patente: patente,
    });
    if (error) {
      console.error("[consultarPorPatente]", error.code);
      return { encontrado: false };
    }
    return (data as unknown as EstadoPorPatente) ?? { encontrado: false };
  } catch (error) {
    unstable_rethrow(error);
    return { encontrado: false };
  }
}

export async function aprobarPresupuestoPublico(
  token: string,
): Promise<{ ok: boolean; yaEstaba?: boolean; motivo?: string }> {
  try {
    const supabase = crearClienteAnonimo();
    const { data, error } = await supabase.rpc("aprobar_presupuesto_publico", {
      p_token: token,
    });
    if (error) {
      console.error("[aprobarPresupuestoPublico]", error.code);
      return { ok: false, motivo: "error" };
    }
    const r = data as unknown as { ok: boolean; ya_estaba?: boolean; motivo?: string };
    return { ok: r.ok, yaEstaba: r.ya_estaba, motivo: r.motivo };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, motivo: "error" };
  }
}

/**
 * Genera (o rota) el link que se le manda al cliente.
 */
export async function generarLinkSeguimiento(
  otId: string,
): Promise<{ token?: string; error?: string }> {
  const { crearClienteServidor, obtenerSesion } = await import("@/lib/supabase/server");
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.rpc("generar_token_seguimiento", {
      p_ot: otId,
      p_dias: 90,
    });
    if (error) {
      console.error("[generarLinkSeguimiento]", error.code);
      return { error: "No se pudo generar el link." };
    }
    return { token: data as unknown as string };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar." };
  }
}
