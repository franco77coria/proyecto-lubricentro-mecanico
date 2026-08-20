import { headers } from "next/headers";

import { crearClienteServidor } from "@/lib/supabase/server";

export interface ResultadoLimite {
  permitido: boolean;
  esperaSegundos: number;
}

/**
 * IP del cliente.
 *
 * Detrás de Vercel el socket siempre es del proxy, así que la IP real viene
 * en las cabeceras. Se toma el PRIMER valor de `x-forwarded-for`: es el
 * cliente original, el resto son los proxies intermedios.
 */
async function ipCliente(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "desconocida";
}

async function chequear(clave: string, max: number, ventana: string): Promise<ResultadoLimite> {
  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.rpc("chequear_rate_limit", {
      p_clave: clave,
      p_max: max,
      p_ventana: ventana,
    });

    if (error) throw error;

    const r = data as { permitido: boolean; espera_segundos: number };
    return { permitido: r.permitido, esperaSegundos: r.espera_segundos };
  } catch (error) {
    // Falla abierta a propósito. El rate limit es defensa en profundidad, no
    // la única barrera: Supabase tiene su propio tope y las contraseñas siguen
    // siendo el control principal. Si el contador se rompe, dejar a todo el
    // taller afuera es peor que el riesgo que cubre.
    console.error("[rate-limit] no se pudo verificar:", (error as Error).message);
    return { permitido: true, esperaSegundos: 0 };
  }
}

/**
 * Dos límites con propósitos distintos.
 *
 * Por email es el estricto: protege una cuenta puntual de que le prueben
 * contraseñas. Por IP es más laxo porque en un taller varios empleados
 * comparten la misma conexión, y un tope bajo dejaría afuera al segundo que
 * intenta entrar.
 */
export async function limitarIntentoAuth(email: string): Promise<ResultadoLimite> {
  const ip = await ipCliente();

  const porEmail = await chequear(`auth:email:${email.toLowerCase()}`, 8, "15 minutes");
  if (!porEmail.permitido) return porEmail;

  return chequear(`auth:ip:${ip}`, 30, "15 minutes");
}

/** Al entrar bien se borra el contador: si no, los intentos fallidos previos
 *  siguen contando y el usuario legítimo queda bloqueado al rato sin motivo. */
export async function limpiarIntentosAuth(email: string): Promise<void> {
  try {
    const supabase = await crearClienteServidor();
    await supabase.rpc("limpiar_rate_limit", { p_clave: `auth:email:${email.toLowerCase()}` });
  } catch {
    // Sin consecuencias: los registros vencen solos al salir de la ventana.
  }
}

/**
 * Freno para las llamadas a la IA.
 *
 * Todas las funciones de IA salen por la MISMA `ANTHROPIC_API_KEY`, que paga
 * quien opera la plataforma y no el taller que la usa. Sin tope, una cuenta de
 * prueba en un bucle quema presupuesto real sin tocar nada más del sistema.
 *
 * El freno va por taller y no por usuario: si fuera por usuario, alcanzaría
 * con dar de alta empleados para multiplicar la cuota.
 *
 * Los topes son por operación porque no cuestan lo mismo. El peritaje manda
 * todas las fotos de la orden en un solo request y es el más caro con
 * diferencia; el traductor de descargos es texto corto y sale casi gratis.
 * Están calibrados sobre un día de taller ocupado, no sobre el caso promedio:
 * la idea es que nadie que trabaje normal los toque nunca.
 */
const TOPES_IA: Record<string, { max: number; ventana: string }> = {
  diagnostico: { max: 60, ventana: "1 hour" },
  traduccion: { max: 80, ventana: "1 hour" },
  peritaje: { max: 25, ventana: "1 hour" },
  cedula: { max: 60, ventana: "1 hour" },
  comprobante: { max: 60, ventana: "1 hour" },
};

export async function limitarIA(
  tallerId: string,
  operacion: keyof typeof TOPES_IA,
): Promise<ResultadoLimite> {
  const tope = TOPES_IA[operacion];
  return chequear(`ia:${operacion}:${tallerId}`, tope.max, tope.ventana);
}

/** El mensaje que ve el mecánico cuando se topó. Dice qué pasó y cuándo puede
 *  volver a intentar, sin hablar de cuotas ni de tokens. */
export function mensajeLimiteIA(esperaSegundos: number): string {
  return `El asistente se usó mucho en la última hora. Volvé a probar en ${formatearEspera(esperaSegundos)}.`;
}

/** "3 minutos" en vez de "180 segundos": nadie cuenta segundos. */
export function formatearEspera(segundos: number): string {
  if (segundos < 60) return `${segundos} segundos`;
  const min = Math.ceil(segundos / 60);
  return min === 1 ? "1 minuto" : `${min} minutos`;
}
