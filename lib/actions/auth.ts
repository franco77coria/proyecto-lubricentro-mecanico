"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

import { altaTallerSchema, credencialesSchema } from "@/lib/schemas/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface ResultadoAuth {
  error?: string;
}

/**
 * Convierte un error de Supabase Auth en algo que se puede mostrar.
 *
 * Devolver `error.message` crudo permite enumerar usuarios: "User already
 * registered" contra "Invalid login credentials" dice si un email existe.
 * Todo se colapsa a un mensaje único, salvo el rate limit, que el usuario
 * legítimo necesita ver para entender por qué no puede entrar.
 */
function errorOpaco(error: AuthError, generico: string): string {
  if (error.status === 429 || /rate limit|too many/i.test(error.message)) {
    return "Demasiados intentos. Esperá unos minutos y volvé a probar.";
  }
  // El detalle real va a los logs del servidor, no a la pantalla.
  console.error("[auth]", error.status, error.name);
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
    // Next señaliza redirect y notFound lanzando errores internos: sin esto,
    // el catch se los come y la página se prerenderiza estática y sin sesión.
    unstable_rethrow(error);
    return { error: "No se pudo conectar. Probá de nuevo." };
  }

  redirect("/");
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
    const { error } = await supabase.auth.signUp(parseado.data);
    if (error) return { error: errorOpaco(error, "No se pudo crear la cuenta") };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar. Probá de nuevo." };
  }

  redirect("/onboarding");
}

/**
 * Punto de entrada único del formulario de login.
 *
 * El botón es uno solo y el modo viaja en el propio form, así que la pantalla
 * no necesita dos acciones ni dos estados: el label del botón morfea y acá se
 * despacha.
 */
export async function autenticar(previo: ResultadoAuth, formData: FormData): Promise<ResultadoAuth> {
  return formData.get("modo") === "registro"
    ? crearCuenta(previo, formData)
    : iniciarSesion(previo, formData);
}

/**
 * Alta del taller. El que lo crea queda como dueño de ESE taller: no hay rol
 * global, así que no hay escalada posible.
 */
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
    const { error } = await supabase.rpc("crear_taller", {
      p_nombre: parseado.data.nombre,
      p_nombre_usuario: parseado.data.nombreUsuario ?? "",
      // La función SQL espera undefined para "sin dato", no null.
      p_telefono: parseado.data.telefono || undefined,
    });
    if (error) {
      console.error("[crear_taller]", error.code);
      return { error: "No se pudo crear el taller. Probá de nuevo." };
    }
  } catch (error) {
    unstable_rethrow(error);
    return { error: "No se pudo conectar. Probá de nuevo." };
  }

  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
