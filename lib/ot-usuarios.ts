export interface PerfilUsuarioOT {
  user_id?: string;
  nombre?: string | null;
  rol?: string | null;
}

export interface LogEstadoOT {
  id?: string;
  estado_anterior?: string | null;
  estado_nuevo: string;
  creado_en?: string;
  usuario_id?: string | null;
  usuario?: PerfilUsuarioOT | null;
}

export interface DatosOTResponsables {
  id?: string;
  numero?: string;
  estado: string;
  fecha_ingreso?: string;
  fecha_entrega?: string | null;
  asignado_a?: string | null;
  mecanico?: PerfilUsuarioOT | null;
  logs?: LogEstadoOT[] | null;
}

export interface ResponsablesOT {
  mecanicoNombre: string | null;
  mecanicoRol: string | null;
  cerradoPorNombre: string | null;
  cerradoPorRol: string | null;
  cerradoEn: string | null;
  resumen: string;
}

export function formatearRol(rol?: string | null): string {
  if (!rol) return "Taller";
  if (rol === "dueno") return "Dueño / Encargado";
  if (rol === "mecanico") return "Mecánico";
  return rol;
}

export function obtenerResponsablesOT(ot: DatosOTResponsables): ResponsablesOT {
  const mecanicoNombre = ot.mecanico?.nombre?.trim() || null;
  const mecanicoRol = ot.mecanico?.rol || (mecanicoNombre ? "mecanico" : null);

  const esCerrada = ot.estado === "cerrado" || ot.estado === "entregado";

  let cerradoPorNombre: string | null = null;
  let cerradoPorRol: string | null = null;
  let cerradoEn: string | null = null;

  if (esCerrada) {
    const logs = ot.logs ?? [];
    const logCierre = [...logs]
      .filter((l) => l.estado_nuevo === "cerrado" || l.estado_nuevo === "entregado")
      .sort((a, b) => new Date(b.creado_en ?? 0).getTime() - new Date(a.creado_en ?? 0).getTime())[0];

    if (logCierre?.usuario?.nombre?.trim()) {
      cerradoPorNombre = logCierre.usuario.nombre.trim();
      cerradoPorRol = logCierre.usuario.rol ?? null;
      cerradoEn = logCierre.creado_en ?? null;
    } else if (mecanicoNombre) {
      cerradoPorNombre = mecanicoNombre;
      cerradoPorRol = mecanicoRol;
      cerradoEn = ot.fecha_entrega ?? null;
    }
  }

  let resumen = "";
  if (esCerrada) {
    if (mecanicoNombre && cerradoPorNombre) {
      if (mecanicoNombre.toLowerCase() === cerradoPorNombre.toLowerCase()) {
        resumen = `Hecho y cerrado por ${mecanicoNombre}`;
      } else {
        resumen = `Hecho por ${mecanicoNombre} · Cerrado por ${cerradoPorNombre}`;
      }
    } else if (cerradoPorNombre) {
      resumen = `Cerrado por ${cerradoPorNombre}`;
    } else if (mecanicoNombre) {
      resumen = `Hecho por ${mecanicoNombre}`;
    } else {
      resumen = "Completado por el taller";
    }
  } else {
    if (mecanicoNombre) {
      resumen = `Mecánico asignado: ${mecanicoNombre}`;
    } else {
      resumen = "Sin mecánico asignado";
    }
  }

  return {
    mecanicoNombre,
    mecanicoRol,
    cerradoPorNombre,
    cerradoPorRol,
    cerradoEn: cerradoEn || ot.fecha_entrega || null,
    resumen,
  };
}
