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
}

/** Formatea YYYY-MM-DD a partir de un Date local */
export function aFechaISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

/** Obtiene rango de fechas exactas a partir de la opción */
export function calcularRangoFechas(filtro: FiltroReporte): {
  periodo: PeriodoPredefinido;
  desdeStr: string;
  hastaStr: string;
  etiqueta: string;
} {
  const hoy = new Date();
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
      const diaSem = hoy.getDay(); // 0 domingo, 1 lunes...
      const diffLunes = diaSem === 0 ? -6 : 1 - diaSem;
      dInicio.setDate(hoy.getDate() + diffLunes);
      dFin.setTime(hoy.getTime());
      etiqueta = "Esta semana";
      break;
    }
    case "semana_anterior": {
      const diaSem = hoy.getDay();
      const diffLunes = diaSem === 0 ? -6 : 1 - diaSem;
      dInicio.setDate(hoy.getDate() + diffLunes - 7);
      dFin.setTime(dInicio.getTime());
      dFin.setDate(dInicio.getDate() + 6);
      etiqueta = "Semana anterior";
      break;
    }
    case "este_mes": {
      dInicio.setDate(1);
      dFin.setTime(hoy.getTime());
      etiqueta = "Este mes";
      break;
    }
    case "mes_anterior": {
      const primerDiaMesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const ultimoDiaMesAnt = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      dInicio.setTime(primerDiaMesAnt.getTime());
      dFin.setTime(ultimoDiaMesAnt.getTime());
      etiqueta = "Mes anterior";
      break;
    }
    case "ultimos_30_dias": {
      dInicio.setDate(hoy.getDate() - 30);
      dFin.setTime(hoy.getTime());
      etiqueta = "Últimos 30 días";
      break;
    }
    case "ultimos_90_dias": {
      dInicio.setDate(hoy.getDate() - 90);
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
      dInicio.setDate(1);
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
