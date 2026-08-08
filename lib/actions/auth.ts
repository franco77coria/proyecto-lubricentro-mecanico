"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

import { altaTallerSchema, credencialesSchema } from "@/lib/schemas/auth";
import { formatearEspera, limitarIntentoAuth, limpiarIntentosAuth } from "@/lib/rate-limit";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface ResultadoAuth {
  error?: string;
}

/**
 * Traduce errores de Supabase Auth a algo que se pueda mostrar.
 *
 * El detalle real va SIEMPRE al log del servidor y nunca a la pantalla.
 * Devolver `error.message` —o interpolarlo en el texto— tiene dos problemas:
 * permite averiguar qué emails existen comparando respuestas ("User already
 * registered" contra "Invalid login credentials"), y filtra detalles internos
 * del proveedor a cualquiera que mire la pantalla.
 *
 * Los mensajes de acá siguen siendo útiles sin confirmar nada: "email o
 * contraseña incorrectos" no dice cuál de los dos falló, y el de registro
 * sugiere iniciar sesión sin afirmar que la cuenta exista.
 */
function errorOpaco(error: AuthError, generico: string): string {
  console.error("[auth]", error.status, error.name, error.message);

  if (error.status === 429 || /rate limit|too many/i.test(error.message)) {
    return "Demasiados intentos. Esperá unos minutos y volvé a probar.";
  }

  if (/user already registered|already registered|email_exists/i.test(error.message)) {
    return "No se pudo crear la cuenta. Si ya tenés una, entrá desde Iniciar sesión.";
  }

  if (/invalid login credentials|invalid credentials/i.test(error.message)) {
    return "Email o contraseña incorrectos.";
  }

  if (/password/i.test(error.message) && /weak|short|least|characters/i.test(error.message)) {
    return "La contraseña es demasiado corta o insegura.";
  }

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

  // El freno va ANTES de tocar Supabase: si no, cada intento de fuerza bruta
  // igual llega al proveedor y el límite no sirve de mucho.
  const limite = await limitarIntentoAuth(parseado.data.email);
  if (!limite.permitido) {
    return {
      error: `Demasiados intentos fallidos. Probá de nuevo en ${formatearEspera(limite.esperaSegundos)}.`,
    };
  }

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.signInWithPassword(parseado.data);
    if (error) return { error: errorOpaco(error, "Email o contraseña incorrectos") };

    // Entró bien: se borra el contador. Si no, los fallos previos lo dejarían
    // bloqueado más tarde sin motivo.
    await limpiarIntentosAuth(parseado.data.email);
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

  // Crear cuentas también se limita: sin esto se puede llenar la base de
  // usuarios basura desde un script.
  const limite = await limitarIntentoAuth(parseado.data.email);
  if (!limite.permitido) {
    return {
      error: `Demasiados intentos. Probá de nuevo en ${formatearEspera(limite.esperaSegundos)}.`,
    };
  }

  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.auth.signUp(parseado.data);
    if (error) return { error: errorOpaco(error, "No se pudo crear la cuenta") };

    if (!data.session) {
      const { error: errorLogin } = await supabase.auth.signInWithPassword(parseado.data);
      if (errorLogin) {
        return { error: "Cuenta creada. Por favor, cambiá a 'Iniciar Sesión' e ingresá tus datos." };
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
