"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { fechaDesplazada, hoyEnZona } from "@/lib/fechas";
import { obtenerAjustesTaller } from "@/lib/taller";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export interface ResultadoEquipo {
  error?: string;
  ok?: boolean;
  token?: string;
  userId?: string;
}

const invitacionSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Revisá el email" }),
  rol: z.enum(["dueno", "mostrador", "mecanico"]),
});

const nuevoUsuarioSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 letras"),
  email: z.string().trim().toLowerCase().email({ message: "Revisá el email" }),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rol: z.enum(["dueno", "mostrador", "mecanico"]),
  vistasPermitidas: z.array(z.string()).optional(),
});

export type DatosNuevoUsuario = z.infer<typeof nuevoUsuarioSchema>;

const DIAS_VIGENCIA = 7;

/**
 * Crea directamente un usuario (mecánico, mostrador o dueño) con email y contraseña,
 * sin requerir confirmación por correo electrónico.
 */
export async function crearUsuarioEquipo(datos: unknown): Promise<ResultadoEquipo> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };
  if (sesion.perfil.rol !== "dueno") return { error: "Solo el dueño puede crear usuarios en el equipo" };

  const parseado = nuevoUsuarioSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  const { nombre, email, password, rol, vistasPermitidas } = parseado.data;
  const tallerId = sesion.perfil.taller_id;

  try {
    const admin = crearClienteAdmin();

    // 1. Crear el usuario en Supabase Auth con email confirmado
    const { data: userAuth, error: errorAuth } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
      },
    });

    if (errorAuth || !userAuth?.user) {
      console.error("[crearUsuarioEquipo] error auth:", errorAuth?.message);
      if (errorAuth?.message?.includes("already been registered") || errorAuth?.message?.includes("unique")) {
        return { error: "Ya existe un usuario registrado con ese email" };
      }
      return { error: errorAuth?.message || "No se pudo crear el usuario" };
    }

    const newUserId = userAuth.user.id;

    // 2. Insertar o actualizar el perfil con el tallerId, rol y vistas permitidas
    const { error: errorPerfil } = await admin.from("perfil").upsert({
      user_id: newUserId,
      taller_id: tallerId,
      nombre,
      rol,
      activo: true,
      vistas_permitidas: vistasPermitidas && vistasPermitidas.length > 0 ? vistasPermitidas : null,
    });

    if (errorPerfil) {
      console.error("[crearUsuarioEquipo] error perfil:", errorPerfil.message);
      return { error: "Usuario creado en auth pero falló la vinculación con el taller" };
    }

    revalidatePath("/config");
    return { ok: true, userId: newUserId };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[crearUsuarioEquipo] catch:", error);
    return { error: "Error de servidor al crear el usuario" };
  }
}

/**
 * Actualiza las vistas/pantallas autorizadas para un miembro específico.
 */
export async function actualizarVistasUsuario(
  userId: string,
  vistas: string[] | null,
): Promise<ResultadoEquipo> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };
  if (sesion.perfil.rol !== "dueno") return { error: "Solo el dueño puede modificar las vistas autorizadas" };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("perfil")
      .update({ vistas_permitidas: vistas && vistas.length > 0 ? vistas : null })
      .eq("user_id", userId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[actualizarVistasUsuario]", error.message);
      return { error: "No se pudieron actualizar las vistas" };
    }

    revalidatePath("/config");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "Error de conexión" };
  }
}

/**
 * Invita a alguien al taller generando un enlace tokenizado de 7 días.
 */
export async function invitarAlTaller(datos: unknown): Promise<ResultadoEquipo> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };
  if (sesion.perfil.rol !== "dueno") return { error: "Solo el dueño puede invitar" };

  const parseado = invitacionSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  try {
    const supabase = await crearClienteServidor();
    const token = randomBytes(24).toString("base64url");
    const expira = new Date(Date.now() + DIAS_VIGENCIA * 24 * 3600 * 1000);

    const { error } = await supabase.from("invitacion").insert({
      taller_id: sesion.perfil.taller_id,
      email: parseado.data.email,
      rol: parseado.data.rol,
      token,
      expira_en: expira.toISOString(),
    });

    if (error) {
      console.error("[invitarAlTaller]", error.code);
      return { error: "No se pudo crear la invitación" };
    }

    revalidatePath("/config");
    return { ok: true, token };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

export async function cancelarInvitacion(id: string): Promise<ResultadoEquipo> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil || sesion.perfil.rol !== "dueno") return { error: "Sin permiso" };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.from("invitacion").delete().eq("id", id);
    if (error) return { error: "No se pudo cancelar" };

    revalidatePath("/config");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

/**
 * Cambia el rol de un miembro o suspende/reactiva su acceso.
 */
export async function cambiarRolMiembro(
  userId: string,
  rol: "dueno" | "mostrador" | "mecanico",
  activo = true,
): Promise<ResultadoEquipo> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida" };
  if (sesion.perfil.rol !== "dueno") return { error: "Solo el dueño puede cambiar roles" };

  try {
    const supabase = await crearClienteServidor();

    const dejaDeSerDueno = userId === sesion.user.id && (rol !== "dueno" || !activo);
    if (dejaDeSerDueno) {
      const { count } = await supabase
        .from("perfil")
        .select("user_id", { count: "exact", head: true })
        .eq("taller_id", sesion.perfil.taller_id)
        .eq("rol", "dueno")
        .eq("activo", true);

      if ((count ?? 0) <= 1) {
        return { error: "Sos el único dueño: nombrá otro antes de cambiar tu rol" };
      }
    }

    // El filtro por taller va explícito además de la política de RLS. RLS ya
    // lo impide, pero el signOut de abajo corre con el cliente admin, que la
    // saltea: si el id no se validó acá, un dueño podría desloguear a alguien
    // de otro taller.
    const { error } = await supabase
      .from("perfil")
      .update({ rol, activo })
      .eq("user_id", userId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) {
      console.error("[cambiarRolMiembro]", error.code);
      return { error: "No se pudo actualizar" };
    }

    // Suspender tiene que sacar a la persona AHORA.
    //
    // Poner activo = false no cierra nada por sí solo: el access token que ya
    // tiene sigue siendo válido hasta que venza, y `taller_actual()` lee el
    // claim taller_id del token antes de mirar la tabla. Sin esto, un empleado
    // suspendido seguía trabajando hasta el próximo refresh.
    //
    // El signOut global invalida también el refresh token, así que no puede
    // renovarlo. Si falla, se avisa: dar por suspendido a alguien que sigue
    // adentro es peor que un error en pantalla.
    if (!activo) {
      const { error: errorSalida } = await crearClienteAdmin().auth.admin.signOut(userId, "global");
      if (errorSalida) {
        console.error("[cambiarRolMiembro/signOut]", errorSalida.message);
        return {
          error:
            "Se marcó como suspendido, pero no se pudo cerrar su sesión activa. Volvé a intentar.",
        };
      }
    }

    revalidatePath("/config");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar" };
  }
}

export interface RegistroAuditoria {
  userId: string;
  nombre: string | null;
  rol: string;
  activo: boolean;
  vistasPermitidas?: string[] | null;
  minutosHoy: number;
  minutosSemana: number;
  estaOnline: boolean;
  ultimaActividad: string | null;
  pantallasHoy: string[];
}

/**
 * Obtiene la auditoría de tiempo de uso activo en el taller para todos los miembros.
 */
export async function obtenerAuditoriaEquipo(): Promise<RegistroAuditoria[]> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil || sesion.perfil.rol !== "dueno") return [];

  try {
    const supabase = await crearClienteServidor();
    const tallerId = sesion.perfil.taller_id;

    // 1. Obtener perfiles del taller
    const { data: perfiles } = await supabase
      .from("perfil")
      .select("user_id, nombre, rol, activo, vistas_permitidas")
      .eq("taller_id", tallerId);

    if (!perfiles?.length) return [];

    // 2. Obtener actividad de los últimos 7 días, contados en la zona del
    //    taller. Si la ventana se calcula en UTC no coincide con las fechas
    //    que escribe registrarPulsoActividad y el corte queda desfasado.
    const { zonaHoraria } = await obtenerAjustesTaller();
    const fechaInicio = fechaDesplazada(-7, zonaHoraria);
    const hoyStr = hoyEnZona(zonaHoraria);

    const { data: actividad } = await supabase
      .from("registro_actividad_usuario")
      .select("user_id, fecha, segundos_activos, ultima_actividad, online_hasta, pantallas_visitadas")
      .eq("taller_id", tallerId)
      .gte("fecha", fechaInicio);

    const ahora = new Date();

    const mapa = new Map<string, { hoy: number; semana: number; online: boolean; ult: string | null; pantallas: Set<string> }>();

    for (const act of actividad || []) {
      const uId = act.user_id;
      if (!mapa.has(uId)) {
        mapa.set(uId, { hoy: 0, semana: 0, online: false, ult: null, pantallas: new Set() });
      }
      const item = mapa.get(uId)!;
      const mins = Math.round(act.segundos_activos / 60);
      item.semana += mins;

      if (act.fecha === hoyStr) {
        item.hoy += mins;
        if (new Date(act.online_hasta) > ahora) {
          item.online = true;
        }
        if (act.pantallas_visitadas?.length) {
          act.pantallas_visitadas.forEach((p: string) => item.pantallas.add(p));
        }
      }

      if (!item.ult || new Date(act.ultima_actividad) > new Date(item.ult)) {
        item.ult = act.ultima_actividad;
      }
    }

    return perfiles.map((p) => {
      const stats = mapa.get(p.user_id) || { hoy: 0, semana: 0, online: false, ult: null, pantallas: new Set() };
      return {
        userId: p.user_id,
        nombre: p.nombre,
        rol: p.rol,
        activo: p.activo,
        vistasPermitidas: p.vistas_permitidas,
        minutosHoy: stats.hoy,
        minutosSemana: stats.semana,
        estaOnline: stats.online,
        ultimaActividad: stats.ult,
        pantallasHoy: Array.from(stats.pantallas),
      };
    });
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}
