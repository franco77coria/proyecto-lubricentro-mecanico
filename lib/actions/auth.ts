"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

import { altaTallerSchema, credencialesSchema } from "@/lib/schemas/auth";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface ResultadoAuth {
  error?: string;
}

function errorOpaco(error: AuthError, generico: string): string {
  if (error.status === 429 || /rate limit|too many/i.test(error.message)) {
    return "Demasiados intentos seguidos. Aguardá 60 segundos por seguridad y volvé a probar.";
  }
  console.error("[auth]", error.status, error.name, error.message);
  return generico;
}

export async function iniciarSesion(_previo: ResultadoAuth, formData: FormData): Promise<ResultadoAuth> {
  const parseado = credencialesSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parseado.success) {
    return { error: parseado.error.issues[0].message };
  }

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.signInWithPassword(parseado.data);
    if (error) return { error: errorOpaco(error, "Email o contraseña incorrectos") };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar. Probá de nuevo." };
  }

  revalidatePath("/", "layout");

  const sesion = await obtenerSesion();
  if (sesion?.estado === "onboarding") {
    redirect("/onboarding");
  }

  redirect("/tablero");
}

export async function crearCuenta(_previo: ResultadoAuth, formData: FormData): Promise<ResultadoAuth> {
  const parseado = credencialesSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parseado.success) {
    return { error: parseado.error.issues[0].message };
  }

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.auth.signUp(parseado.data);
    if (error) return { error: errorOpaco(error, "No se pudo crear la cuenta") };

    if (!data.session) {
      const { error: errorLogin } = await supabase.auth.signInWithPassword(parseado.data);
      if (errorLogin) {
        return { error: "Cuenta registrada. Iniciá sesión con tu email y contraseña." };
      }
    }
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar. Probá de nuevo." };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function autenticar(previo: ResultadoAuth, formData: FormData): Promise<ResultadoAuth> {
  return formData.get("modo") === "registro"
    ? crearCuenta(previo, formData)
    : iniciarSesion(previo, formData);
}

export async function crearTaller(_previo: ResultadoAuth, formData: FormData): Promise<ResultadoAuth> {
  const parseado = altaTallerSchema.safeParse({
    nombre: formData.get("nombre"),
    nombreUsuario: formData.get("nombreUsuario"),
    telefono: formData.get("telefono"),
  });
  if (!parseado.success) {
    return { error: parseado.error.issues[0].message };
  }

  try {
    const supabase = await crearClienteServidor();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    const { error } = await supabase.rpc("crear_taller", {
      p_nombre: parseado.data.nombre,
      p_nombre_usuario: parseado.data.nombreUsuario ?? "",
      p_telefono: parseado.data.telefono || undefined,
    });

    if (error) {
      console.error("[crear_taller]", error.code, error.message);
      if (error.message?.includes("ya pertenece a un taller") || error.code === "23505") {
        revalidatePath("/", "layout");
        redirect("/tablero");
      }
      if (error.message?.includes("Sesión requerida")) {
        redirect("/login");
      }
      return { error: error.message || "No se pudo crear el taller. Probá de nuevo." };
    }
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar. Probá de nuevo." };
  }

  revalidatePath("/", "layout");
  redirect("/tablero");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
