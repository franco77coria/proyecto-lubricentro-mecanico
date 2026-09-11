import { hoyEnZona, ZONA_POR_DEFECTO } from "@/lib/fechas";

export type PeriodoPredefinido =
  | "esta_semana"
  | "semana_anterior"
  | "este_mes"
  | "mes_anterior"
  | "ultimos_30_dias"
  | "ultimos_90_dias"
  | "personalizado";

export interface FiltroReporte {
  periodo?: PeriodoPredefinido;
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
}

export interface DesgloseSemana {
  semanaKey: string;
  etiqueta: string;
  fechaInicio: string;
  fechaFin: string;
  ordenes: number;
  facturado: number;
  manoObra: number;
  repuestos: number;
  gananciaEstimada: number;
}

export interface DesgloseMes {
  mesKey: string;
  etiqueta: string;
  ordenes: number;
  facturado: number;
  manoObra: number;
  repuestos: number;
  gananciaEstimada: number;
}

export interface RankingMecanico {
  userId: string;
  nombre: string;
  rol: string;
  ordenesCerradas: number;
  porcentajeOrdenes: number;
  totalManoObra: number;
  totalFacturado: number;
  esLider: boolean;
}

export interface OrdenDetalleReporte {
  id: string;
  numero: string;
  fechaIngreso: string;
  fechaEntrega: string | null;
  patente: string;
  vehiculoInfo: string;
  clienteInfo: string;
  mecanicoNombre: string;
  manoObra: number;
  repuestos: number;
  total: number;
}

export interface DatosReporteCompleto {
  periodo: PeriodoPredefinido;
  desde: string;
  hasta: string;
  etiquetaPeriodo: string;
  resumen: {
    totalFacturado: number;
    totalManoObra: number;
    porcentajeManoObra: number;
    totalRepuestos: number;
    porcentajeRepuestos: number;
    costoRepuestos: number;
    margenRepuestos: number;
    porcentajeMargenRepuestos: number;
    gananciaReal: number;
    margenGananciaTotal: number;
    vehiculosAtendidos: number;
    ticketPromedio: number;
    horasPromedioTaller: number;
  };
  semanas: DesgloseSemana[];
  meses: DesgloseMes[];
  rankingMecanicos: RankingMecanico[];
  topTrabajos: { descripcion: string; tipo: string; veces: number; total: number }[];
  ultimosVehiculos: OrdenDetalleReporte[];
  /** La RPC de métricas agregadas falló: el costo de repuestos y la ganancia
   *  real de `resumen` no están confirmados (quedan en su valor de reserva,
   *  no en 0 real). La pantalla lo tiene que avisar, no mostrar un margen
   *  perfecto como si fuera un dato genuino. */
  margenesParciales?: boolean;
}

/** Formatea YYYY-MM-DD a partir de un Date anclado a mediodía UTC (ver
 *  `aFechaAnclada`) — `toISOString` no se corre de día porque nunca cruza
 *  medianoche al aplicar el offset. */
export function aFechaISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Un `timestamptz` (con hora) → el día calendario que fue en la zona del
 * taller, anclado a mediodía UTC para poder agruparlo por semana/mes con los
 * getters `getUTC*` sin que el huso horario del servidor lo corra un día.
 *
 * Una OT cargada a las 22:30 en Argentina es, para el servidor en UTC, ya el
 * día siguiente — sin esto, esa orden cae en la semana o el mes equivocado
 * en los desgloses, aunque el total general (que sale de la RPC) esté bien.
 */
export function fechaLocalDelTaller(fechaConHora: string, zona: string): Date {
  const soloFecha = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(fechaConHora));
  return aFechaAnclada(soloFecha);
}

/** `YYYY-MM-DD` → `Date` a mediodía UTC, para poder sumar/restar días con
 *  `setUTCDate` sin que el huso horario del servidor corra el resultado un
 *  día (la lección #80 del CLAUDE.md: `new Date()` en el servidor es UTC). */
export function aFechaAnclada(fechaISO: string): Date {
  return new Date(`${fechaISO}T12:00:00Z`);
}

/** Obtiene rango de fechas exactas a partir de la opción.
 *
 * `zona` es la del TALLER (`obtenerAjustesTaller().zonaHoraria`), no la del
 * servidor: "hoy" para un taller en Argentina y el servidor en UTC pueden
 * ser días distintos después de las 21:00. */
export function calcularRangoFechas(filtro: FiltroReporte, zona: string = ZONA_POR_DEFECTO): {
  periodo: PeriodoPredefinido;
  desdeStr: string;
  hastaStr: string;
  etiqueta: string;
} {
  const hoy = aFechaAnclada(hoyEnZona(zona));
  let periodo = filtro.periodo ?? "este_mes";

  if (filtro.desde && filtro.hasta) {
    periodo = "personalizado";
    const esMismoDia = filtro.desde === filtro.hasta;
    return {
      periodo: "personalizado",
      desdeStr: filtro.desde,
      hastaStr: filtro.hasta,
      etiqueta: esMismoDia
        ? `Día ${filtro.desde}`
        : `${filtro.desde} al ${filtro.hasta}`,
    };
  }

  const dInicio = new Date(hoy);
  const dFin = new Date(hoy);
  let etiqueta = "Este mes";

  switch (periodo) {
    case "esta_semana": {
      // Lunes de esta semana
      const diaSem = hoy.getUTCDay(); // 0 domingo, 1 lunes...
      const diffLunes = diaSem === 0 ? -6 : 1 - diaSem;
      dInicio.setUTCDate(hoy.getUTCDate() + diffLunes);
      dFin.setTime(hoy.getTime());
      etiqueta = "Esta semana";
      break;
    }
    case "semana_anterior": {
      const diaSem = hoy.getUTCDay();
      const diffLunes = diaSem === 0 ? -6 : 1 - diaSem;
      dInicio.setUTCDate(hoy.getUTCDate() + diffLunes - 7);
      dFin.setTime(dInicio.getTime());
      dFin.setUTCDate(dInicio.getUTCDate() + 6);
      etiqueta = "Semana anterior";
      break;
    }
    case "este_mes": {
      dInicio.setUTCDate(1);
      dFin.setTime(hoy.getTime());
      etiqueta = "Este mes";
      break;
    }
    case "mes_anterior": {
      const primerDiaMesAnt = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - 1, 1, 12));
      const ultimoDiaMesAnt = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 0, 12));
      dInicio.setTime(primerDiaMesAnt.getTime());
      dFin.setTime(ultimoDiaMesAnt.getTime());
      etiqueta = "Mes anterior";
      break;
    }
    case "ultimos_30_dias": {
      dInicio.setUTCDate(hoy.getUTCDate() - 30);
      dFin.setTime(hoy.getTime());
      etiqueta = "Últimos 30 días";
      break;
    }
    case "ultimos_90_dias": {
      dInicio.setUTCDate(hoy.getUTCDate() - 90);
      dFin.setTime(hoy.getTime());
      etiqueta = "Últimos 90 días";
      break;
    }
    case "personalizado": {
      if (filtro.desde && filtro.hasta) {
        return {
          periodo: "personalizado",
          desdeStr: filtro.desde,
          hastaStr: filtro.hasta,
          etiqueta: `${filtro.desde} al ${filtro.hasta}`,
        };
      }
      dInicio.setUTCDate(1);
      dFin.setTime(hoy.getTime());
      etiqueta = "Período actual";
      break;
    }
  }

  return {
    periodo,
    desdeStr: aFechaISO(dInicio),
    hastaStr: aFechaISO(dFin),
    etiqueta,
  };
}
