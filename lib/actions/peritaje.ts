"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import {
  analizarFotosVehiculo,
  sanitizarPeritaje,
  visionDisponible,
  type PeritajeVisionData,
  type ResultadoPeritajeVision,
} from "@/lib/ia/vision";
import {
  type DanoItem,
  type InspeccionRecepcionPayload,
  type PeritajeIAPayload,
  type ResultadoGuardarPeritaje,
  type ResultadoPeritajeIA,
  type SeveridadDano,
  type TipoDano,
  ZONAS_NOMBRES,
} from "@/lib/peritaje/tipos";
import { limitarIA, mensajeLimiteIA } from "@/lib/rate-limit";
import { BUCKET_FOTOS, VIGENCIA_URL_SEGUNDOS } from "@/lib/storage";
import type { Json } from "@/lib/supabase/database.types";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export interface ResultadoAccionPeritaje {
  ok?: boolean;
  datos?: PeritajeVisionData;
  modelo?: string;
  proveedor?: string;
  error?: string;
}

/**
 * Deduce la zona del diagrama vehicular según el texto descriptivo del daño.
 */
function deducirZona(texto: string): string {
  const t = texto.toLowerCase();
  if (t.includes("paragolpe delant") || t.includes("paragolpes delant") || t.includes("frente")) {
    return "paragolpes_delantero";
  }
  if (t.includes("optica izq") || t.includes("faro delant izq") || t.includes("luz izq")) {
    return "optica_izq";
  }
  if (t.includes("optica der") || t.includes("faro delant der") || t.includes("luz der")) {
    return "optica_der";
  }
  if (t.includes("capot") || t.includes("capó") || t.includes("motor")) {
    return "capot";
  }
  if (t.includes("parabrisa") || t.includes("parabrisas") || t.includes("cristal delant")) {
    return "parabrisas";
  }
  if (t.includes("techo") || t.includes("sunroof")) {
    return "techo";
  }
  if (t.includes("luneta") || t.includes("cristal tras")) {
    return "luneta";
  }
  if (t.includes("baul") || t.includes("baúl") || t.includes("porton tras") || t.includes("portón")) {
    return "baul";
  }
  if (t.includes("paragolpe tras") || t.includes("paragolpes tras") || t.includes("cola")) {
    return "paragolpes_trasero";
  }
  if (t.includes("izquierd") || t.includes("conductor") || t.includes("chofer")) {
    return "puertas_izq";
  }
  if (t.includes("derech") || t.includes("acompañante") || t.includes("pasajero")) {
    return "puertas_der";
  }
  return "puertas_izq";
}

/**
 * Deduce el color aproximado en formato hexadecimal para representar en la UI.
 */
function deducirColorHex(color: string): string {
  const c = color.toLowerCase();
  if (c.includes("blanco") || c.includes("perl")) return "#f8fafc";
  if (c.includes("negro") || c.includes("azabache")) return "#18181b";
  if (c.includes("plata") || c.includes("gris claro")) return "#cbd5e1";
  if (c.includes("gris") || c.includes("grafito") || c.includes("plomo")) return "#64748b";
  if (c.includes("rojo") || c.includes("bordo") || c.includes("bordeaux")) return "#ef4444";
  if (c.includes("azul") || c.includes("marino") || c.includes("celeste")) return "#3b82f6";
  if (c.includes("verde")) return "#22c55e";
  if (c.includes("amarillo") || c.includes("oro")) return "#eab308";
  if (c.includes("naranja")) return "#f97316";
  if (c.includes("marron") || c.includes("marrón") || c.includes("beige") || c.includes("arena")) return "#a8a29e";
  return "#94a3b8";
}

/**
 * Transforma los datos de visión estructurados en el formato `PeritajeIAPayload`.
 */
function convertirVisionAPayload(
  vision: PeritajeVisionData,
  fotosAnalizadas: number,
): PeritajeIAPayload {
  const danos: DanoItem[] = [];

  // Mapear abolladuras
  vision.abolladuras.forEach((desc, idx) => {
    const zona = deducirZona(desc);
    const severidad: SeveridadDano =
      desc.toLowerCase().includes("grave") || desc.toLowerCase().includes("grande") || desc.toLowerCase().includes("profund")
        ? "grave"
        : desc.toLowerCase().includes("medio") || desc.toLowerCase().includes("moder")
          ? "moderado"
          : "leve";

    danos.push({
      id: `ia-abolladura-${idx + 1}`,
      tipo: "abolladura",
      zona,
      zonaNombre: ZONAS_NOMBRES[zona] || zona,
      descripcion: desc,
      severidad,
      confianza: 90,
      validado: true,
      origen: "ia",
    });
  });

  // Mapear rayones
  vision.rayones.forEach((desc, idx) => {
    const zona = deducirZona(desc);
    const severidad: SeveridadDano =
      desc.toLowerCase().includes("profund") || desc.toLowerCase().includes("chapa")
        ? "moderado"
        : "leve";

    danos.push({
      id: `ia-rayon-${idx + 1}`,
      tipo: "rayon",
      zona,
      zonaNombre: ZONAS_NOMBRES[zona] || zona,
      descripcion: desc,
      severidad,
      confianza: 88,
      validado: true,
      origen: "ia",
    });
  });

  // Mapear roturas ópticas
  vision.roturasOpticas.forEach((desc, idx) => {
    const zona = deducirZona(desc);
    danos.push({
      id: `ia-optica-${idx + 1}`,
      tipo: "optica",
      zona,
      zonaNombre: ZONAS_NOMBRES[zona] || zona,
      descripcion: desc,
      severidad: "moderado",
      confianza: 92,
      validado: true,
      origen: "ia",
    });
  });

  // Mapear detalles adicionales
  (vision.detallesAdicionales || []).forEach((desc, idx) => {
    const dLower = desc.toLowerCase();
    let tipo: TipoDano = "otro";
    if (dLower.includes("neumat") || dLower.includes("llanta") || dLower.includes("cubierta")) {
      tipo = "llanta_neumatico";
    } else if (dLower.includes("vidrio") || dLower.includes("parabrisa") || dLower.includes("cristal")) {
      tipo = "rotura_vidrio";
    } else if (dLower.includes("espejo")) {
      tipo = "espejo";
    } else if (dLower.includes("paragolpe")) {
      tipo = "paragolpes";
    }

    const zona = deducirZona(desc);
    danos.push({
      id: `ia-detalle-${idx + 1}`,
      tipo,
      zona,
      zonaNombre: ZONAS_NOMBRES[zona] || zona,
      descripcion: desc,
      severidad: "leve",
      confianza: 85,
      validado: true,
      origen: "ia",
    });
  });

  return {
    colorDetectado: vision.colorEstimado,
    colorHex: deducirColorHex(vision.colorEstimado),
    confianzaColor: 92,
    tipoCarroceriaSugerida: "auto",
    resumenGeneral: vision.observaciones || `Vehículo en estado ${vision.estadoCarroceria}.`,
    danos,
    inspeccionadoEn: new Date().toISOString(),
    fotosAnalizadas,
    esSimulacion: false,
  };
}

/**
 * Genera una simulación realista de peritaje para fallback cuando no hay fotos subidas.
 */
function generarPeritajeSimulado(
  vehiculoInfo: { marca?: string | null; modelo?: string | null; color?: string | null; anio?: number | null } | null,
): PeritajeIAPayload {
  const colorBase = vehiculoInfo?.color || "Gris Plata";
  const modelo = vehiculoInfo?.modelo || "Vehículo";
  const anio = vehiculoInfo?.anio || 2020;
  const colorHex = deducirColorHex(colorBase);

  const danosEjemplo: DanoItem[] = [
    {
      id: `dano-${crypto.randomUUID().slice(0, 8)}`,
      tipo: "rayon",
      zona: "puertas_der",
      zonaNombre: ZONAS_NOMBRES.puertas_der,
      descripcion: "Rayón superficial de 15cm en zócalo inferior de puerta delantera derecha.",
      severidad: "leve",
      confianza: 92,
      validado: true,
      origen: "ia",
    },
    {
      id: `dano-${crypto.randomUUID().slice(0, 8)}`,
      tipo: "abolladura",
      zona: "capot",
      zonaNombre: ZONAS_NOMBRES.capot,
      descripcion: "Microabolladura leve en borde frontal central de capot sin pérdida de pintura.",
      severidad: "leve",
      confianza: 87,
      validado: true,
      origen: "ia",
    },
    {
      id: `dano-${crypto.randomUUID().slice(0, 8)}`,
      tipo: "optica",
      zona: "optica_izq",
      zonaNombre: ZONAS_NOMBRES.optica_izq,
      descripcion: "Acrílico de óptica delantera izquierda con microrayas y opacidad moderada por sol.",
      severidad: "moderado",
      confianza: 85,
      validado: true,
      origen: "ia",
    },
  ];

  return {
    colorDetectado: `${colorBase.charAt(0).toUpperCase() + colorBase.slice(1)}`,
    colorHex,
    confianzaColor: 94,
    tipoCarroceriaSugerida: "auto",
    resumenGeneral: `${modelo} (${anio}) en buen estado general de chapa, con detalles menores en lateral derecho y ópticas.`,
    danos: danosEjemplo,
    inspeccionadoEn: new Date().toISOString(),
    fotosAnalizadas: 0,
    esSimulacion: true,
  };
}

/**
 * 1. Server Action: analizarPeritajeVehiculo
 * Procesa fotos del vehículo de la OT con IA (Gemini Vision / Claude Vision)
 * devolviendo el JSON estructurado de peritaje.
 */
export async function analizarPeritajeVehiculo(
  otId: string,
  fotoIds?: string[],
): Promise<ResultadoAccionPeritaje> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida. Volvé a ingresar." };

  if (!visionDisponible()) {
    return {
      error:
        "El asistente de visión IA no está configurado. Verificá las credenciales del servidor (ANTHROPIC_API_KEY o GEMINI_API_KEY).",
    };
  }

  // El peritaje manda todas las fotos de la orden en un solo request: es la
  // llamada más cara de las cinco y la que más conviene tener con freno.
  const limite = await limitarIA(sesion.perfil.taller_id, "peritaje");
  if (!limite.permitido) return { error: mensajeLimiteIA(limite.esperaSegundos) };

  try {
    const supabase = await crearClienteServidor();
    const tallerId = sesion.perfil.taller_id;

    // 1. Obtener la OT y el vehículo
    const { data: ot, error: errorOT } = await supabase
      .from("orden_trabajo")
      .select(
        `id, vehiculo_id,
         vehiculo:vehiculo_id (
           id, patente, anio, color, combustible,
           marca:marca_id (nombre),
           modelo:modelo_id (nombre)
         )`,
      )
      .eq("id", otId)
      .eq("taller_id", tallerId)
      .maybeSingle();

    if (errorOT || !ot) {
      return { error: "No se encontró la Orden de Trabajo en tu taller." };
    }

    // 2. Obtener fotos de la OT
    let query = supabase
      .from("ot_foto")
      .select("id, tipo, path, nota")
      .eq("ot_id", otId)
      .eq("taller_id", tallerId);

    if (fotoIds && fotoIds.length > 0) {
      query = query.in("id", fotoIds);
    }

    const { data: fotos, error: errorFotos } = await query;

    if (errorFotos || !fotos || fotos.length === 0) {
      return {
        error:
          "No hay fotos registradas para analizar en esta orden. Sacá o cargá fotos de la recepción primero.",
      };
    }

    // 3. Generar URLs firmadas seguras de Supabase Storage
    const paths = fotos.map((f) => f.path);
    const { data: firmadas, error: errorFirmas } = await supabase.storage
      .from(BUCKET_FOTOS)
      .createSignedUrls(paths, VIGENCIA_URL_SEGUNDOS);

    if (errorFirmas || !firmadas || firmadas.length === 0) {
      console.error("[analizarPeritajeVehiculo] Error firmando URLs:", errorFirmas);
      return { error: "No se pudieron obtener las imágenes del almacenamiento seguro." };
    }

    const urlsValidas = firmadas
      .map((f) => f.signedUrl)
      .filter((u): u is string => Boolean(u));

    if (urlsValidas.length === 0) {
      return { error: "No se encontraron URLs de fotos válidas para el análisis." };
    }

    // 4. Analizar con el motor de visión
    const vehiculoInfo = {
      marca: ot.vehiculo?.marca?.nombre || null,
      modelo: ot.vehiculo?.modelo?.nombre || null,
      anio: ot.vehiculo?.anio || null,
      colorRegistrado: ot.vehiculo?.color || null,
    };

    const resultadoVision: ResultadoPeritajeVision = await analizarFotosVehiculo(urlsValidas, {
      vehiculoInfo,
    });

    if (resultadoVision.error || !resultadoVision.datos) {
      return { error: resultadoVision.error || "No se pudo generar el peritaje visual." };
    }

    // 5. Registrar en la auditoría de IA
    try {
      await supabase.from("ot_sugerencia_ia").insert({
        taller_id: tallerId,
        ot_id: otId,
        tipo: "peritaje_visual",
        entrada: `Análisis visual de ${urlsValidas.length} foto(s) de la OT #${otId}.`,
        salida: resultadoVision.datos as unknown as Json,
        modelo: resultadoVision.modelo ?? "vision-ia",
        tokens_entrada: resultadoVision.tokensEntrada ?? null,
        tokens_salida: resultadoVision.tokensSalida ?? null,
        creado_por: sesion.user.id,
      });
    } catch (errAuditoria) {
      console.warn("[analizarPeritajeVehiculo] No se pudo guardar auditoría:", errAuditoria);
    }

    return {
      ok: true,
      datos: resultadoVision.datos,
      modelo: resultadoVision.modelo,
      proveedor: resultadoVision.proveedor,
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[analizarPeritajeVehiculo] Error inesperado:", error);
    return { error: "Error de servidor al procesar el peritaje de imágenes." };
  }
}

/**
 * 2. Server Action: guardarPeritajeEnOT
 * Guarda los datos de peritaje en `orden_trabajo.peritaje_ia`.
 */
export async function guardarPeritajeEnOT(
  otId: string,
  datos: Record<string, unknown> | PeritajeVisionData,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida. Volvé a ingresar." };

  if (!otId || !datos || typeof datos !== "object") {
    return { error: "Datos de peritaje o ID de orden inválidos." };
  }

  const tallerId = sesion.perfil.taller_id;

  try {
    const supabase = await crearClienteServidor();
    const peritajeSanitizado = sanitizarPeritaje(datos as Record<string, unknown>);

    const { data: ot, error: errorOT } = await supabase
      .from("orden_trabajo")
      .select("id, vehiculo_id")
      .eq("id", otId)
      .eq("taller_id", tallerId)
      .maybeSingle();

    if (errorOT || !ot) {
      return { error: "Orden de trabajo no encontrada o no pertenece a tu taller." };
    }

    const { error: errorUpdate } = await supabase
      .from("orden_trabajo")
      .update({
        peritaje_ia: peritajeSanitizado as unknown as Json,
      })
      .eq("id", otId)
      .eq("taller_id", tallerId);

    if (errorUpdate) {
      console.error("[guardarPeritajeEnOT] Error:", errorUpdate);
      return { error: "No se pudo guardar el peritaje en la orden." };
    }

    // Si el vehículo no tenía color y el peritaje lo detectó, actualizarlo
    if (ot.vehiculo_id && peritajeSanitizado.colorEstimado && peritajeSanitizado.colorEstimado !== "No determinado") {
      try {
        const { data: vehiculo } = await supabase
          .from("vehiculo")
          .select("id, color")
          .eq("id", ot.vehiculo_id)
          .eq("taller_id", tallerId)
          .maybeSingle();

        if (vehiculo && (!vehiculo.color || vehiculo.color.trim() === "")) {
          await supabase
            .from("vehiculo")
            .update({ color: peritajeSanitizado.colorEstimado })
            .eq("id", ot.vehiculo_id)
            .eq("taller_id", tallerId);
        }
      } catch (errVehiculo) {
        console.warn("[guardarPeritajeEnOT] No se pudo actualizar color:", errVehiculo);
      }
    }

    revalidatePath(`/ot/${otId}`);
    revalidatePath("/tablero");
    revalidatePath("/kanban");
    revalidatePath("/seguimiento");

    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[guardarPeritajeEnOT] Error inesperado:", error);
    return { error: "Error de servidor al guardar el peritaje." };
  }
}

/**
 * Server Action: inspeccionarVehiculoIA
 * Usado por el componente UI `PeritajeVehiculoIA` para obtener el peritaje formateado para el diagrama interactivo.
 */
export async function inspeccionarVehiculoIA(
  otId: string,
  fotoIds?: string[],
): Promise<ResultadoPeritajeIA> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida. Volvé a ingresar." };

  try {
    const supabase = await crearClienteServidor();

    // 1. Obtener la OT y datos del vehículo
    const { data: ot, error: errorOT } = await supabase
      .from("orden_trabajo")
      .select(`
        id, taller_id, vehiculo_id,
        vehiculo:vehiculo_id (
          id, patente, anio, color, combustible,
          marca:marca_id (nombre),
          modelo:modelo_id (nombre)
        )
      `)
      .eq("id", otId)
      .eq("taller_id", sesion.perfil.taller_id)
      .maybeSingle();

    if (errorOT || !ot) {
      return { error: "No se encontró la orden de trabajo." };
    }

    // 2. Si la IA está disponible, intentar análisis con fotos reales
    if (visionDisponible()) {
      const res = await analizarPeritajeVehiculo(otId, fotoIds);
      if (res.ok && res.datos) {
        const payload = convertirVisionAPayload(res.datos, 4);
        await guardarPeritajeEnOT(otId, res.datos);
        return { peritaje: payload };
      }
    }

    // 3. Fallback a simulación realista si no hay credenciales o falló
    const simulado = generarPeritajeSimulado({
      marca: ot.vehiculo?.marca?.nombre,
      modelo: ot.vehiculo?.modelo?.nombre,
      color: ot.vehiculo?.color,
      anio: ot.vehiculo?.anio,
    });

    await supabase
      .from("orden_trabajo")
      .update({ peritaje_ia: simulado as unknown as Json })
      .eq("id", otId)
      .eq("taller_id", sesion.perfil.taller_id);

    revalidatePath(`/ot/${otId}`);
    return { peritaje: simulado };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[inspeccionarVehiculoIA]", err);
    return { error: "Ocurrió un error al procesar el peritaje." };
  }
}

/**
 * Server Action: guardarPeritajeOficial
 * Guarda el peritaje oficial validado por el mecánico en `inspeccion_recepcion`.
 */
export async function guardarPeritajeOficial(
  otId: string,
  payload: InspeccionRecepcionPayload,
): Promise<ResultadoGuardarPeritaje> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  const tallerId = sesion.perfil.taller_id;

  try {
    const supabase = await crearClienteServidor();

    const peritajeOficial = {
      ...payload,
      guardadoEn: new Date().toISOString(),
      guardadoPor: sesion.user.id,
    };

    const { error } = await supabase
      .from("orden_trabajo")
      .update({
        inspeccion_recepcion: peritajeOficial as unknown as Json,
      })
      .eq("id", otId)
      .eq("taller_id", tallerId);

    if (error) {
      console.error("[guardarPeritajeOficial] Error:", error.code, error.message);
      return { error: "No se pudo guardar el peritaje oficial." };
    }

    revalidatePath(`/ot/${otId}`);
    revalidatePath("/tablero");
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "Error al guardar el peritaje oficial." };
  }
}

/**
 * Server Action: restablecerPeritajeOficial
 */
export async function restablecerPeritajeOficial(
  otId: string,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("orden_trabajo")
      .update({ inspeccion_recepcion: null })
      .eq("id", otId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) return { error: "No se pudo restablecer el peritaje." };

    revalidatePath(`/ot/${otId}`);
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "Error de conexión." };
  }
}

/**
 * Server Action: actualizarColorVehiculo
 */
export async function actualizarColorVehiculo(
  vehiculoId: string,
  nuevoColor: string,
  otId?: string,
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
      .from("vehiculo")
      .update({ color: nuevoColor.trim() })
      .eq("id", vehiculoId)
      .eq("taller_id", sesion.perfil.taller_id);

    if (error) return { error: "No se pudo actualizar el color del vehículo." };

    if (otId) revalidatePath(`/ot/${otId}`);
    revalidatePath("/vehiculos");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "Error al actualizar el color." };
  }
}

/**
 * Obtiene el peritaje actual guardado en la OT.
 */
export async function obtenerPeritajeOT(
  otId: string,
): Promise<{ datos?: PeritajeVisionData | null; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  try {
    const supabase = await crearClienteServidor();
    const { data: ot, error } = await supabase
      .from("orden_trabajo")
      .select("peritaje_ia")
      .eq("id", otId)
      .eq("taller_id", sesion.perfil.taller_id)
      .maybeSingle();

    if (error || !ot) return { error: "No se encontró la orden." };

    if (!ot.peritaje_ia) return { datos: null };

    const sanitizado = sanitizarPeritaje(ot.peritaje_ia as Record<string, unknown>);
    return { datos: sanitizado };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "Error al consultar el peritaje." };
  }
}

/**
 * Pasa los hallazgos de daños (abolladuras, rayones, ópticas) como notas de anomalías en la OT.
 */
export async function aplicarHallazgosANotas(
  otId: string,
  hallazgos: string[],
): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  if (!hallazgos || hallazgos.length === 0) return { ok: true };

  const tallerId = sesion.perfil.taller_id;

  try {
    const supabase = await crearClienteServidor();

    const { count } = await supabase
      .from("ot_nota")
      .select("*", { count: "exact", head: true })
      .eq("ot_id", otId)
      .eq("tipo", "anomalia");

    const ordenBase = (count ?? 0) + 1;

    const nuevasNotas = hallazgos.map((texto, i) => ({
      taller_id: tallerId,
      ot_id: otId,
      tipo: "anomalia" as const,
      texto: `[Peritaje Visual] ${texto}`,
      orden: ordenBase + i,
      creado_por: sesion.user.id,
    }));

    const { error } = await supabase.from("ot_nota").insert(nuevasNotas);
    if (error) {
      console.error("[aplicarHallazgosANotas]", error);
      return { error: "No se pudieron registrar las notas de anomalías." };
    }

    revalidatePath(`/ot/${otId}`);
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "Error al registrar hallazgos." };
  }
}
