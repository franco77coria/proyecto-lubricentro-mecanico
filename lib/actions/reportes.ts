"use server";

import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirVista } from "@/lib/permisos";
import {
  calcularRangoFechas,
  aFechaISO,
  type FiltroReporte,
  type DatosReporteCompleto,
  type DesgloseSemana,
  type DesgloseMes,
  type RankingMecanico,
  type OrdenDetalleReporte,
} from "@/lib/reportes-fechas";

export async function obtenerReporteCompleto(
  filtro: FiltroReporte = {},
): Promise<DatosReporteCompleto> {
  const sesion = await exigirVista("/reportes");
  const tallerId = sesion.perfil.taller_id;

  const { periodo, desdeStr, hastaStr, etiqueta } = calcularRangoFechas(filtro);
  const supabase = await crearClienteServidor();

  // 1. Llamar función nativa de Postgres para métricas globales seguras
  const [{ data: metricasRpc, error: errorRpc }, { data: horasPromedio }] =
    await Promise.all([
      supabase.rpc("metricas_taller", {
        p_desde: desdeStr,
        p_hasta: hastaStr,
      }),
      supabase.rpc("tiempo_promedio_taller"),
    ]);

  if (errorRpc) {
    console.error("[obtenerReporteCompleto] Error RPC:", errorRpc);
  }

  // 2. Traer órdenes cerradas/entregadas en el período para armar desgloses por semana y por mecánico
  const fechaFinFiltro = new Date(hastaStr);
  fechaFinFiltro.setDate(fechaFinFiltro.getDate() + 1);
  const fechaFinFiltroISO = aFechaISO(fechaFinFiltro);

  const { data: ordenesData, error: errorOrdenes } = await supabase
    .from("orden_trabajo")
    .select(`
      id,
      numero,
      total,
      total_mano_obra,
      total_repuestos,
      fecha_ingreso,
      fecha_entrega,
      estado,
      asignado_a,
      mecanico:asignado_a ( user_id, nombre, rol ),
      vehiculo:vehiculo_id ( patente, anio, marca:marca_id(nombre), modelo:modelo_id(nombre) ),
      cliente:cliente_id ( nombre, apellido, telefono )
    `)
    .eq("taller_id", tallerId)
    .in("estado", ["entregado", "cerrado"])
    .gte("fecha_ingreso", desdeStr)
    .lt("fecha_ingreso", fechaFinFiltroISO)
    .order("fecha_ingreso", { ascending: false });

  if (errorOrdenes) {
    console.error("[obtenerReporteCompleto] Error órdenes:", errorOrdenes);
  }

  const ordenes = ordenesData ?? [];

  // 3. Resumen financiero seguro
  const rpcResumen = (metricasRpc as { resumen?: Record<string, number> })?.resumen ?? {};
  const totalFacturado = Number(rpcResumen.facturado ?? ordenes.reduce((s, o) => s + Number(o.total || 0), 0));
  const totalManoObra = Number(rpcResumen.mano_obra ?? ordenes.reduce((s, o) => s + Number(o.total_mano_obra || 0), 0));
  const totalRepuestos = Number(rpcResumen.repuestos ?? ordenes.reduce((s, o) => s + Number(o.total_repuestos || 0), 0));
  const costoRepuestos = Number(rpcResumen.costo_repuestos ?? 0);
  const vehiculosAtendidos = Number(rpcResumen.ordenes ?? ordenes.length);

  const margenRepuestos = Math.max(0, totalRepuestos - costoRepuestos);
  const gananciaReal = totalManoObra + margenRepuestos;
  const porcentajeManoObra = totalFacturado > 0 ? Math.round((totalManoObra / totalFacturado) * 100) : 0;
  const porcentajeRepuestos = totalFacturado > 0 ? Math.round((totalRepuestos / totalFacturado) * 100) : 0;
  const porcentajeMargenRepuestos = totalRepuestos > 0 ? Math.round((margenRepuestos / totalRepuestos) * 100) : 0;
  const margenGananciaTotal = totalFacturado > 0 ? Math.round((gananciaReal / totalFacturado) * 100) : 0;
  const ticketPromedio = vehiculosAtendidos > 0 ? Math.round(totalFacturado / vehiculosAtendidos) : 0;

  // 4. Desglose Semanal (agrupación por lunes-domingo)
  const mapaSemanas = new Map<string, DesgloseSemana>();

  for (const ot of ordenes) {
    const d = new Date(ot.fecha_ingreso);
    // Hallar lunes de esa semana
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const lunes = new Date(d);
    lunes.setDate(d.getDate() + diff);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    const lunesStr = aFechaISO(lunes);
    const domingoStr = aFechaISO(domingo);
    const semKey = `${lunesStr}`;

    const formatoLunes = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(lunes);
    const formatoDomingo = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(domingo);

    const existente = mapaSemanas.get(semKey) ?? {
      semanaKey: semKey,
      etiqueta: `${formatoLunes} - ${formatoDomingo}`,
      fechaInicio: lunesStr,
      fechaFin: domingoStr,
      ordenes: 0,
      facturado: 0,
      manoObra: 0,
      repuestos: 0,
      gananciaEstimada: 0,
    };

    existente.ordenes += 1;
    existente.facturado += Number(ot.total || 0);
    existente.manoObra += Number(ot.total_mano_obra || 0);
    existente.repuestos += Number(ot.total_repuestos || 0);
    mapaSemanas.set(semKey, existente);
  }

  // Calcular ganancia estimada proporcional por semana
  const semanasList = Array.from(mapaSemanas.values())
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
    .map((sem) => {
      const propRepuestoMargen = totalRepuestos > 0 ? margenRepuestos / totalRepuestos : 0.35;
      const gananciaEst = sem.manoObra + sem.repuestos * propRepuestoMargen;
      return {
        ...sem,
        gananciaEstimada: Math.round(gananciaEst),
      };
    });

  // 5. Desglose Mensual
  const mapaMeses = new Map<string, DesgloseMes>();
  for (const ot of ordenes) {
    const d = new Date(ot.fecha_ingreso);
    const mesKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const etiquetaMes = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(d);

    const existente = mapaMeses.get(mesKey) ?? {
      mesKey,
      etiqueta: etiquetaMes.charAt(0).toUpperCase() + etiquetaMes.slice(1),
      ordenes: 0,
      facturado: 0,
      manoObra: 0,
      repuestos: 0,
      gananciaEstimada: 0,
    };

    existente.ordenes += 1;
    existente.facturado += Number(ot.total || 0);
    existente.manoObra += Number(ot.total_mano_obra || 0);
    existente.repuestos += Number(ot.total_repuestos || 0);
    mapaMeses.set(mesKey, existente);
  }

  const mesesList = Array.from(mapaMeses.values())
    .sort((a, b) => a.mesKey.localeCompare(b.mesKey))
    .map((mes) => {
      const propRepuestoMargen = totalRepuestos > 0 ? margenRepuestos / totalRepuestos : 0.35;
      const gananciaEst = mes.manoObra + mes.repuestos * propRepuestoMargen;
      return {
        ...mes,
        gananciaEstimada: Math.round(gananciaEst),
      };
    });

  // 6. Ranking de Mecánicos
  const mapaMecanicos = new Map<string, {
    userId: string;
    nombre: string;
    rol: string;
    ordenes: number;
    manoObra: number;
    facturado: number;
  }>();

  for (const ot of ordenes) {
    const mec = ot.mecanico as { user_id?: string; nombre?: string; rol?: string } | null;
    const uid = mec?.user_id ?? ot.asignado_a ?? "sin_asignar";
    const nombre = mec?.nombre?.trim() ? mec.nombre.trim() : (ot.asignado_a ? "Mecánico" : "Taller general");
    const rol = mec?.rol ?? "mecanico";

    const prev = mapaMecanicos.get(uid) ?? {
      userId: uid,
      nombre,
      rol,
      ordenes: 0,
      manoObra: 0,
      facturado: 0,
    };

    prev.ordenes += 1;
    prev.manoObra += Number(ot.total_mano_obra || 0);
    prev.facturado += Number(ot.total || 0);
    mapaMecanicos.set(uid, prev);
  }

  const rankingOrdenado = Array.from(mapaMecanicos.values()).sort((a, b) => b.ordenes - a.ordenes);
  const maxOrdenes = rankingOrdenado[0]?.ordenes ?? 0;

  const rankingMecanicos: RankingMecanico[] = rankingOrdenado.map((m, idx) => ({
    userId: m.userId,
    nombre: m.nombre,
    rol: m.rol,
    ordenesCerradas: m.ordenes,
    porcentajeOrdenes: vehiculosAtendidos > 0 ? Math.round((m.ordenes / vehiculosAtendidos) * 100) : 0,
    totalManoObra: m.manoObra,
    totalFacturado: m.facturado,
    esLider: idx === 0 && maxOrdenes > 0,
  }));

  // 7. Mapear vehículos detallados
  const ultimosVehiculos: OrdenDetalleReporte[] = ordenes.map((o) => {
    const v = o.vehiculo as {
      patente?: string;
      anio?: number;
      marca?: { nombre: string } | null;
      modelo?: { nombre: string } | null;
    } | null;
    const c = o.cliente as { nombre?: string; apellido?: string; telefono?: string } | null;
    const mec = o.mecanico as { nombre?: string } | null;

    const marcaStr = v?.marca?.nombre ?? "";
    const modeloStr = v?.modelo?.nombre ?? "";
    const infoAuto = [marcaStr, modeloStr, v?.anio].filter(Boolean).join(" ") || "Vehículo";
    const infoCli = [c?.nombre, c?.apellido].filter(Boolean).join(" ") || "Cliente";

    return {
      id: o.id,
      numero: o.numero,
      fechaIngreso: o.fecha_ingreso,
      fechaEntrega: o.fecha_entrega,
      patente: v?.patente ?? "",
      vehiculoInfo: infoAuto,
      clienteInfo: infoCli,
      mecanicoNombre: mec?.nombre || (o.asignado_a ? "Asignado" : "Sin asignar"),
      manoObra: Number(o.total_mano_obra || 0),
      repuestos: Number(o.total_repuestos || 0),
      total: Number(o.total || 0),
    };
  });

  const topTrabajos = (metricasRpc as { top?: { descripcion: string; tipo: string; veces: number; total: number }[] })?.top ?? [];

  return {
    periodo,
    desde: desdeStr,
    hasta: hastaStr,
    etiquetaPeriodo: etiqueta,
    resumen: {
      totalFacturado,
      totalManoObra,
      porcentajeManoObra,
      totalRepuestos,
      porcentajeRepuestos,
      costoRepuestos,
      margenRepuestos,
      porcentajeMargenRepuestos,
      gananciaReal,
      margenGananciaTotal,
      vehiculosAtendidos,
      ticketPromedio,
      horasPromedioTaller: Number(horasPromedio ?? 0),
    },
    semanas: semanasList,
    meses: mesesList,
    rankingMecanicos,
    topTrabajos,
    ultimosVehiculos,
  };
}
