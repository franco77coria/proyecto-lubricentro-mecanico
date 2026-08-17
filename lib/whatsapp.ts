import { normalizarTelefono, paraWhatsApp } from "@/lib/telefono";

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
}

export function armarLinkWhatsApp(ot: OTParaWhatsApp): string {
  const telNorm = ot.cliente?.telefono ? normalizarTelefono(ot.cliente.telefono) : null;
  const telLimpio = telNorm ? paraWhatsApp(telNorm) : "";

  const descVehiculo = [ot.vehiculo.marca, ot.vehiculo.modelo, ot.vehiculo.patente]
    .filter(Boolean)
    .join(" ");

  const saludo = ot.cliente?.nombre?.trim() ? `¡Hola ${ot.cliente.nombre.trim()}!` : "¡Hola!";

  let desglose = "";
  if (ot.totalManoObra && ot.totalManoObra > 0) {
    desglose += `\n• *Mano de obra:* $${ot.totalManoObra.toLocaleString("es-AR")}`;
  }
  if (ot.totalRepuestos && ot.totalRepuestos > 0) {
    desglose += `\n• *Repuestos:* $${ot.totalRepuestos.toLocaleString("es-AR")}`;
  }

  const mensaje = `${saludo} Te escribimos de *${ot.tallerNombre || "nuestro taller"}*.
Te compartimos el detalle de la Orden de Trabajo *#${ot.numero}* para tu vehículo *${descVehiculo}*.

🔧 *Estado:* ${ot.estado}${desglose}
💰 *Total:* $${(ot.total || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

¡Cualquier consulta quedamos a tu disposición!`;

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
}

export function armarLinkPresupuestoWhatsApp(p: PresupuestoParaWhatsApp): string {
  const telNorm = p.cliente?.telefono ? normalizarTelefono(p.cliente.telefono) : null;
  const telLimpio = telNorm ? paraWhatsApp(telNorm) : "";

  const descVehiculo = [p.vehiculo.marca, p.vehiculo.modelo, p.vehiculo.patente]
    .filter(Boolean)
    .join(" ");

  const saludo = p.cliente?.nombre?.trim() ? `¡Hola ${p.cliente.nombre.trim()}!` : "¡Hola!";
  
  let desglose = "";
  if (p.totalManoObra && p.totalManoObra > 0) {
    desglose += `\n• *Mano de obra y servicios:* $${p.totalManoObra.toLocaleString("es-AR")}`;
  }
  if (p.totalRepuestos && p.totalRepuestos > 0) {
    desglose += `\n• *Repuestos e insumos:* $${p.totalRepuestos.toLocaleString("es-AR")}`;
  }

  const obs = p.observaciones?.trim() ? `\n\n📝 *Validez / Nota:* ${p.observaciones.trim()}` : "";

  const mensaje = `${saludo} Te escribimos de *${p.tallerNombre || "nuestro taller"}*.
Te enviamos el presupuesto detallado para tu vehículo *${descVehiculo}*:

📋 *Presupuesto ${p.numero ? `#${p.numero}` : ""}*${desglose}
💰 *Total Cotizado:* $${(p.total || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${obs}

Quedamos a la espera de tu confirmación para coordinar los trabajos.`;

  return telLimpio
    ? `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}

interface RecordatorioParaWhatsApp {
  patente: string;
  descripcion: string;
  telefono: string | null;
  clienteNombre: string | null;
  tallerNombre?: string;
  vencePor: "km" | "fecha";
}

export function armarLinkRecordatorio(r: RecordatorioParaWhatsApp): string | null {
  const telNorm = r.telefono ? normalizarTelefono(r.telefono) : null;
  const telLimpio = telNorm ? paraWhatsApp(telNorm) : null;
  if (!telLimpio) return null;

  const saludo = r.clienteNombre?.trim() ? `¡Hola ${r.clienteNombre.trim()}!` : "¡Hola!";
  const motivo =
    r.vencePor === "km"
      ? "ya está en los kilómetros del próximo service"
      : "se cumplió el tiempo desde el último service";

  const mensaje = `${saludo} Te escribimos de *${r.tallerNombre || "nuestro taller"}*.
Tu *${r.descripcion}* (${r.patente}) ${motivo}.

¿Querés que te reservemos un turno? Avisanos el día que te queda cómodo y lo dejamos listo.`;

  return `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`;
}
