export type TipoDano =
  | "abolladura"
  | "rayon"
  | "optica"
  | "rotura_vidrio"
  | "espejo"
  | "paragolpes"
  | "llanta_neumatico"
  | "otro";

export type SeveridadDano = "leve" | "moderado" | "grave";

export interface DanoItem {
  id: string;
  tipo: TipoDano;
  zona: string;
  zonaNombre?: string;
  descripcion: string;
  severidad: SeveridadDano;
  confianza?: number;
  validado: boolean;
  origen?: "ia" | "manual";
  fotoId?: string;
}

export interface PeritajeIAPayload {
  colorDetectado?: string;
  colorHex?: string;
  confianzaColor?: number;
  tipoCarroceriaSugerida?: string;
  resumenGeneral?: string;
  danos: DanoItem[];
  inspeccionadoEn?: string;
  fotosAnalizadas?: number;
  esSimulacion?: boolean;
}

export interface InspeccionRecepcionPayload {
  colorDetectado?: string;
  colorHex?: string;
  danosValidados: DanoItem[];
  danosDescartados: DanoItem[];
  zonasAfectadas: string[];
  observaciones?: string;
  estadoGeneral?: "impecable" | "detalles_menores" | "danos_medios" | "danos_severos";
  guardadoEn?: string;
  guardadoPor?: string;
}

export interface ResultadoPeritajeIA {
  peritaje?: PeritajeIAPayload;
  error?: string;
}

export interface ResultadoGuardarPeritaje {
  ok?: boolean;
  error?: string;
}

export const ZONAS_NOMBRES: Record<string, string> = {
  paragolpes_delantero: "Paragolpes Delantero",
  optica_izq: "Óptica Izquierda",
  optica_der: "Óptica Derecha",
  capot: "Capot / Motor",
  parabrisas: "Parabrisas",
  techo: "Techo",
  luneta: "Luneta Trasera",
  baul: "Tapa de Baúl",
  paragolpes_trasero: "Paragolpes Trasero",
  puertas_izq: "Lateral Izquierdo (Conductor)",
  puertas_der: "Lateral Derecho (Acompañante)",
};
