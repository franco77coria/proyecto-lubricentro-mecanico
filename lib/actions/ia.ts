"use server";

import { unstable_rethrow } from "next/navigation";

import { MODELO_IA, iaDisponible, motivoDeFalla, obtenerCliente } from "@/lib/ia/cliente";
import type { Json } from "@/lib/supabase/database.types";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

/**
 * IA-1 diagnóstico asistido e IA-2 traductor de descargos.
 *
 * Dos decisiones que atraviesan las dos funciones:
 *
 * 1. NADA se envía ni se guarda automáticamente. La traducción se muestra para
 *    editar antes de mandarla, y el diagnóstico es una lista de qué revisar, no
 *    una conclusión. Un sistema que le manda al cliente un texto que el taller
 *    no leyó es un accidente esperando a pasar.
 *
 * 2. No viaja ningún dato personal del cliente. Ni nombre, ni teléfono, ni
 *    patente: el modelo necesita el vehículo y la falla, no quién es el dueño.
 *    Es la diferencia entre mandar un problema mecánico y mandar la base de
 *    clientes del taller a un tercero.
 */

export interface HipotesisDiagnostico {
  causa: string;
  probabilidad: number;
  como_verificar: string;
}

export interface ResultadoDiagnostico {
  hipotesis?: HipotesisDiagnostico[];
  /** Cuántos casos del propio taller se usaron como antecedente. */
  antecedentes?: number;
  error?: string;
}

const ESQUEMA_DIAGNOSTICO = {
  type: "object",
  properties: {
    hipotesis: {
      type: "array",
      items: {
        type: "object",
        properties: {
          causa: { type: "string" },
          probabilidad: { type: "integer" },
          como_verificar: { type: "string" },
        },
        required: ["causa", "probabilidad", "como_verificar"],
        additionalProperties: false,
      },
    },
  },
  required: ["hipotesis"],
  additionalProperties: false,
} as const;

/**
 * IA-1 — qué revisar antes de desarmar.
 *
 * Se apoya en los antecedentes del PROPIO taller (0033): en vez de preguntar
 * qué le pasa a un Gol en abstracto, se le pasan los casos que este taller ya
 * resolvió en ese modelo. Ese es el conocimiento que no está en internet y lo
 * que hace que la sugerencia sirva.
 */
export async function sugerirDiagnostico(otId: string): Promise<ResultadoDiagnostico> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  const cliente = obtenerCliente();
  if (!cliente) return { error: "El asistente no está configurado en este taller." };

  try {
    const supabase = await crearClienteServidor();

    const { data: ot } = await supabase
      .from("orden_trabajo")
      .select(
        `id, km_ingreso, vehiculo_id,
         vehiculo:vehiculo_id (
           anio, combustible,
           marca:marca_id(nombre), modelo:modelo_id(nombre),
           motorizacion:motorizacion_id(nombre, cilindrada_cc, potencia_cv)
         )`,
      )
      .eq("id", otId)
      .eq("taller_id", sesion.perfil.taller_id)
      .maybeSingle();

    if (!ot) return { error: "No se encontró la orden." };

    const { data: notas } = await supabase
      .from("ot_nota")
      .select("texto")
      .eq("ot_id", otId)
      .eq("tipo", "anomalia")
      .order("orden");

    const anomalias = (notas ?? []).map((n) => n.texto).filter(Boolean);
    if (anomalias.length === 0) {
      return { error: "Cargá primero qué síntoma reportó el cliente." };
    }

    const { data: antecedentes } = await supabase.rpc("antecedentes_modelo", {
      p_vehiculo: ot.vehiculo_id,
      p_limite: 8,
    });

    const vehiculo = [
      ot.vehiculo?.marca?.nombre,
      ot.vehiculo?.modelo?.nombre,
      ot.vehiculo?.motorizacion?.nombre,
      ot.vehiculo?.anio ? String(ot.vehiculo.anio) : null,
      ot.vehiculo?.combustible,
    ]
      .filter(Boolean)
      .join(" ");

    // Los antecedentes van sin patente: el modelo necesita el par
    // síntoma → causa, no de qué auto era.
    const historial = (antecedentes ?? [])
      .filter((a) => a.anomalia && a.descargo)
      .map((a) => `- Síntoma: ${a.anomalia}\n  Resultó ser: ${a.descargo}`)
      .join("\n");

    const entrada = [
      `Vehículo: ${vehiculo || "sin datos de modelo"}`,
      ot.km_ingreso ? `Kilometraje: ${ot.km_ingreso.toLocaleString("es-AR")} km` : null,
      `Síntoma que reporta el cliente: ${anomalias.join(" / ")}`,
      historial ? `\nCasos que este taller ya resolvió en el mismo modelo:\n${historial}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const respuesta = await cliente.beta.messages.create({
      model: MODELO_IA,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: ESQUEMA_DIAGNOSTICO },
      },
      system: `Sos un mecánico argentino con treinta años en el oficio, ayudando a un colega que tiene el auto arriba del elevador.

Devolvé exactamente 3 hipótesis, de más a menos probable, con probabilidades que sumen 100.

Reglas:
- Usá el vocabulario del taller argentino (bujías, bobina, cuerpo de mariposa, rótulas, bieletas, tren delantero, correa de distribución).
- "como_verificar" tiene que ser una comprobación concreta y barata que se pueda hacer AHORA, antes de desarmar: qué medir, qué escuchar, qué mirar. No "llevar al especialista".
- Priorizá las causas frecuentes y baratas antes que las raras y caras.
- Si el taller ya resolvió el mismo síntoma en este modelo, eso pesa más que cualquier regla general: mencionalo.
- Esto ORIENTA la revisión, no la reemplaza. No afirmes una causa como certeza.`,
      messages: [{ role: "user", content: entrada }],
    });

    // Un refusal es un 200: hay que chequear antes de leer el contenido.
    if (respuesta.stop_reason === "refusal" || respuesta.stop_reason === "max_tokens") {
      return { error: motivoDeFalla(respuesta.stop_reason) };
    }

    const texto = respuesta.content.find((b) => b.type === "text")?.text;
    if (!texto) return { error: motivoDeFalla(respuesta.stop_reason) };

    const parseado = JSON.parse(texto) as { hipotesis: HipotesisDiagnostico[] };

    await supabase.from("ot_sugerencia_ia").insert({
      taller_id: sesion.perfil.taller_id,
      ot_id: otId,
      tipo: "diagnostico",
      entrada,
      // El cast es en la frontera con la base: `Json` pide índice de string y
      // ensuciar la interfaz con uno solo para esto la haría peor de usar.
      salida: parseado as unknown as Json,
      modelo: respuesta.model,
      tokens_entrada: respuesta.usage.input_tokens,
      tokens_salida: respuesta.usage.output_tokens,
      creado_por: sesion.user.id,
    });

    return {
      hipotesis: parseado.hipotesis,
      antecedentes: (antecedentes ?? []).length,
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[sugerirDiagnostico]", error instanceof Error ? error.name : "desconocido");
    return { error: "No se pudo consultar el asistente. Probá de nuevo." };
  }
}

export interface ResultadoTraduccion {
  texto?: string;
  error?: string;
}

/**
 * IA-2 — el descargo técnico, contado al cliente.
 *
 * El mecánico escribe "cambio reten bancada, rectifiqué disco y bulbo aceite" y
 * esto devuelve algo que el cliente entienda. Nunca se envía solo: se muestra
 * para editar y el taller decide.
 */
export async function traducirDescargo(otId: string): Promise<ResultadoTraduccion> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  const cliente = obtenerCliente();
  if (!cliente) return { error: "El asistente no está configurado en este taller." };

  try {
    const supabase = await crearClienteServidor();

    const { data: ot } = await supabase
      .from("orden_trabajo")
      .select(
        `id, vehiculo:vehiculo_id ( marca:marca_id(nombre), modelo:modelo_id(nombre) )`,
      )
      .eq("id", otId)
      .eq("taller_id", sesion.perfil.taller_id)
      .maybeSingle();

    if (!ot) return { error: "No se encontró la orden." };

    const { data: notas } = await supabase
      .from("ot_nota")
      .select("tipo, texto")
      .eq("ot_id", otId)
      .in("tipo", ["anomalia", "descargo"])
      .order("orden");

    const descargos = (notas ?? []).filter((n) => n.tipo === "descargo").map((n) => n.texto);
    if (descargos.length === 0) {
      return { error: "Cargá primero el descargo del taller." };
    }
    const anomalias = (notas ?? []).filter((n) => n.tipo === "anomalia").map((n) => n.texto);

    const vehiculo = [ot.vehiculo?.marca?.nombre, ot.vehiculo?.modelo?.nombre]
      .filter(Boolean)
      .join(" ");

    const entrada = [
      vehiculo ? `Vehículo: ${vehiculo}` : null,
      anomalias.length ? `El cliente había reportado: ${anomalias.join(" / ")}` : null,
      `Notas técnicas del mecánico: ${descargos.join(" / ")}`,
    ]
      .filter(Boolean)
      .join("\n");

    const respuesta = await cliente.beta.messages.create({
      model: MODELO_IA,
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: `Convertís las notas técnicas de un mecánico en un mensaje de WhatsApp para el dueño del auto, en castellano rioplatense.

Reglas:
- Explicá QUÉ se hizo y POR QUÉ importaba, en palabras que entienda alguien que no sabe de mecánica. "Se rectificaron los discos" → "se corrigió la superficie de los discos para que el freno agarre parejo".
- Tres o cuatro oraciones. Es un WhatsApp, no un informe.
- Tono de taller de barrio: cordial y directo. Sin "estimado cliente" ni lenguaje corporativo.
- No inventes NADA que no esté en las notas: ni trabajos, ni precios, ni garantías, ni plazos. Si una nota es ambigua, describila en general en vez de suponer.
- No pongas saludo ni firma: los agrega el sistema.
- Devolvé solo el texto del mensaje.`,
      messages: [{ role: "user", content: entrada }],
    });

    if (respuesta.stop_reason === "refusal" || respuesta.stop_reason === "max_tokens") {
      return { error: motivoDeFalla(respuesta.stop_reason) };
    }

    const texto = respuesta.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    if (!texto) return { error: motivoDeFalla(respuesta.stop_reason) };

    await supabase.from("ot_sugerencia_ia").insert({
      taller_id: sesion.perfil.taller_id,
      ot_id: otId,
      tipo: "traduccion",
      entrada,
      salida: { texto },
      modelo: respuesta.model,
      tokens_entrada: respuesta.usage.input_tokens,
      tokens_salida: respuesta.usage.output_tokens,
      creado_por: sesion.user.id,
    });

    return { texto };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[traducirDescargo]", error instanceof Error ? error.name : "desconocido");
    return { error: "No se pudo consultar el asistente. Probá de nuevo." };
  }
}

/** Si el taller tiene el asistente habilitado. Lo consulta la pantalla. */
export async function asistenteHabilitado(): Promise<boolean> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return false;
  return iaDisponible();
}
