import { normalizarTelefono, paraWhatsApp } from "@/lib/telefono";

interface OTParaWhatsApp {
  numero: string;
  estado: string;
  total: number;
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

export function armarLinkWhatsApp(ot: OTParaWhatsApp): string | null {
  const telNorm = ot.cliente?.telefono ? normalizarTelefono(ot.cliente.telefono) : null;
  const telLimpio = telNorm ? paraWhatsApp(telNorm) : null;
  if (!telLimpio) return null;

  const descVehiculo = [ot.vehiculo.marca, ot.vehiculo.modelo, ot.vehiculo.patente]
    .filter(Boolean)
    .join(" ");

  const saludo = ot.cliente?.nombre?.trim() ? `Hola ${ot.cliente.nombre.trim()}!` : "Hola!";

  const mensaje = `${saludo} Te escribimos de *${ot.tallerNombre || "nuestro taller"}*.
Te compartimos el detalle de la Orden de Trabajo *#${ot.numero}* para tu vehículo *${descVehiculo}*.

*Estado:* ${ot.estado}
*Total:* $${(ot.total || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Cualquier consulta quedamos a disposición!`;

  return `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`;
}
