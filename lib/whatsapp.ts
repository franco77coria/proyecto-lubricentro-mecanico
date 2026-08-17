import { normalizarTelefono, paraWhatsApp } from "@/lib/telefono";
import { obtenerDiccionario, formatearMoneda, type Idioma, type Moneda } from "@/lib/i18n";

interface OTParaWhatsApp {
  numero: string;
  estado: string;
  total: number;
  totalManoObra?: number;
  totalRepuestos?: number;
  vehiculo: {
    patente: string;
    marca?: string | null;
    modelo?: string | null;
  };
  cliente?: {
    nombre?: string | null;
    telefono?: string | null;
  } | null;
  tallerNombre?: string;
  idioma?: Idioma;
  moneda?: Moneda;
}

export function armarLinkWhatsApp(ot: OTParaWhatsApp): string {
  const idioma = ot.idioma || "es";
  const moneda = ot.moneda || "ARS";
  const t = obtenerDiccionario(idioma).whatsapp;

  const telNorm = ot.cliente?.telefono ? normalizarTelefono(ot.cliente.telefono) : null;
  const telLimpio = telNorm ? paraWhatsApp(telNorm) : "";

  const descVehiculo = [ot.vehiculo.marca, ot.vehiculo.modelo, ot.vehiculo.patente]
    .filter(Boolean)
    .join(" ");

  const saludo = ot.cliente?.nombre?.trim()
    ? t.saludoNombre.replace("{nombre}", ot.cliente.nombre.trim())
    : t.saludoGenerico;

  let desglose = "";
  if (ot.totalManoObra && ot.totalManoObra > 0) {
    desglose += `\n• *${t.manoDeObra}:* ${formatearMoneda(ot.totalManoObra, moneda, idioma)}`;
  }
  if (ot.totalRepuestos && ot.totalRepuestos > 0) {
    desglose += `\n• *${t.repuestos}:* ${formatearMoneda(ot.totalRepuestos, moneda, idioma)}`;
  }

  const mensaje = `${saludo} ${t.teEscribimosDe.replace("{taller}", ot.tallerNombre || t.nuestroTaller)}
${t.detalleOt.replace("{numero}", ot.numero).replace("{vehiculo}", descVehiculo)}

🔧 *${t.estado}:* ${ot.estado}${desglose}
💰 *${t.total}:* ${formatearMoneda(ot.total || 0, moneda, idioma)}

${t.despedida}`;

  return telLimpio
    ? `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}

interface PresupuestoParaWhatsApp {
  numero?: string;
  total: number;
  totalManoObra?: number;
  totalRepuestos?: number;
  vehiculo: {
    patente: string;
    marca?: string | null;
    modelo?: string | null;
  };
  cliente?: {
    nombre?: string | null;
    telefono?: string | null;
  } | null;
  tallerNombre?: string;
  observaciones?: string | null;
  idioma?: Idioma;
  moneda?: Moneda;
}

export function armarLinkPresupuestoWhatsApp(p: PresupuestoParaWhatsApp): string {
  const idioma = p.idioma || "es";
  const moneda = p.moneda || "ARS";
  const t = obtenerDiccionario(idioma).whatsapp;

  const telNorm = p.cliente?.telefono ? normalizarTelefono(p.cliente.telefono) : null;
  const telLimpio = telNorm ? paraWhatsApp(telNorm) : "";

  const descVehiculo = [p.vehiculo.marca, p.vehiculo.modelo, p.vehiculo.patente]
    .filter(Boolean)
    .join(" ");

  const saludo = p.cliente?.nombre?.trim()
    ? t.saludoNombre.replace("{nombre}", p.cliente.nombre.trim())
    : t.saludoGenerico;

  let desglose = "";
  if (p.totalManoObra && p.totalManoObra > 0) {
    desglose += `\n• *${t.manoDeObra}:* ${formatearMoneda(p.totalManoObra, moneda, idioma)}`;
  }
  if (p.totalRepuestos && p.totalRepuestos > 0) {
    desglose += `\n• *${t.repuestos}:* ${formatearMoneda(p.totalRepuestos, moneda, idioma)}`;
  }

  const obs = p.observaciones?.trim() ? `\n\n📝 *Nota:* ${p.observaciones.trim()}` : "";

  const mensaje = `${saludo} ${t.teEscribimosDe.replace("{taller}", p.tallerNombre || t.nuestroTaller)}
${t.detallePresupuesto.replace("{numero}", p.numero || "").replace("{vehiculo}", descVehiculo)}
${desglose}
💰 *${t.total}:* ${formatearMoneda(p.total || 0, moneda, idioma)}${obs}

${t.despedida}`;

  return telLimpio
    ? `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}

interface RecordatorioTurnoWhatsApp {
  clienteNombre?: string | null;
  clienteTelefono?: string | null;
  vehiculo: {
    patente: string;
    marca?: string | null;
    modelo?: string | null;
  };
  fecha: string;
  hora: string;
  tallerNombre?: string;
  idioma?: Idioma;
}

export function armarLinkRecordatorioTurno(r: RecordatorioTurnoWhatsApp): string {
  const idioma = r.idioma || "es";
  const t = obtenerDiccionario(idioma).whatsapp;

  const telNorm = r.clienteTelefono ? normalizarTelefono(r.clienteTelefono) : null;
  const telLimpio = telNorm ? paraWhatsApp(telNorm) : "";

  const descVehiculo = [r.vehiculo.marca, r.vehiculo.modelo, r.vehiculo.patente]
    .filter(Boolean)
    .join(" ");

  const saludo = r.clienteNombre?.trim()
    ? t.saludoNombre.replace("{nombre}", r.clienteNombre.trim())
    : t.saludoGenerico;

  const mensaje = `${saludo} ${t.teEscribimosDe.replace("{taller}", r.tallerNombre || t.nuestroTaller)}
${t.recordatorioTurno.replace("{vehiculo}", descVehiculo).replace("{fecha}", r.fecha).replace("{hora}", r.hora)}

${t.despedida}`;

  return telLimpio
    ? `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}

interface RecordatorioAvisoWhatsApp {
  patente: string;
  descripcion: string;
  telefono?: string | null;
  clienteNombre?: string | null;
  tallerNombre?: string;
  vencePor?: "km" | "fecha";
  idioma?: Idioma;
}

export function armarLinkRecordatorio(r: RecordatorioAvisoWhatsApp): string | null {
  if (!r.telefono) return null;
  const idioma = r.idioma || "es";
  const t = obtenerDiccionario(idioma).whatsapp;

  const telNorm = normalizarTelefono(r.telefono);
  if (!telNorm) return null;
  const telLimpio = paraWhatsApp(telNorm);

  const saludo = r.clienteNombre?.trim()
    ? t.saludoNombre.replace("{nombre}", r.clienteNombre.trim())
    : t.saludoGenerico;

  const descVehiculo = `${r.descripcion} (${r.patente})`;

  const mensaje = `${saludo} ${t.teEscribimosDe.replace("{taller}", r.tallerNombre || t.nuestroTaller)}
${t.avisoKm.replace("{vehiculo}", descVehiculo).replace("{km}", "próximo")}

${t.despedida}`;

  return `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`;
}

