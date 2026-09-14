import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export interface ContactoDuenoTaller {
  email: string;
  nombreUsuario: string;
  nombreTaller: string;
}

/**
 * Obtiene el email y datos de contacto del dueño de un taller específico
 * utilizando el cliente administrativo (Service Role).
 */
export async function obtenerContactoDuenoTaller(
  admin: SupabaseClient<Database>,
  tallerId: string
): Promise<ContactoDuenoTaller | null> {
  try {
    const { data: taller } = await admin
      .from("taller")
      .select("nombre")
      .eq("id", tallerId)
      .maybeSingle();

    if (!taller) return null;

    const { data: perfil } = await admin
      .from("perfil")
      .select("user_id, nombre")
      .eq("taller_id", tallerId)
      .eq("rol", "dueno")
      .maybeSingle();

    if (!perfil?.user_id) return null;

    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(perfil.user_id);

    if (userError || !userData?.user?.email) {
      return null;
    }

    return {
      email: userData.user.email,
      nombreUsuario: perfil.nombre || "",
      nombreTaller: taller.nombre || "Mi Taller",
    };
  } catch (err) {
    console.error(`[ContactoDueno] Error obteniendo dueño de taller ${tallerId}:`, err);
    return null;
  }
}
