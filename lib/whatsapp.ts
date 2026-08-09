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

interface RecordatorioParaWhatsApp {
  patente: string;
  descripcion: string;
  telefono: string | null;
  clienteNombre: string | null;
  tallerNombre?: string;
  /** Por qué toca el service: por kilómetros o porque pasó el tiempo. */
  vencePor: "km" | "fecha";
}

/**
 * El aviso de "te toca el service".
 *
 * El mensaje dice POR QUÉ toca, y no solo que toca: "ya andás en los 95.000"
 * es un argumento, "pasaron 6 meses" es otro, y un aviso genérico sin motivo
 * se lee como publicidad y se ignora.
 *
 * No lleva precio a propósito: el precio se cotiza cuando el cliente contesta,
 * y un número en el primer mensaje es la forma más rápida de que compare por
 * teléfono y no venga.
 */
export function armarLinkRecordatorio(r: RecordatorioParaWhatsApp): string | null {
  const telNorm = r.telefono ? normalizarTelefono(r.telefono) : null;
  const telLimpio = telNorm ? paraWhatsApp(telNorm) : null;
  if (!telLimpio) return null;

  const saludo = r.clienteNombre?.trim() ? `Hola ${r.clienteNombre.trim()}!` : "Hola!";
  const motivo =
    r.vencePor === "km"
      ? "ya está en los kilómetros del próximo service"
      : "se cumplió el tiempo desde el último service";

  const mensaje = `${saludo} Te escribimos de *${r.tallerNombre || "nuestro taller"}*.
Tu *${r.descripcion}* (${r.patente}) ${motivo}.

¿Querés que te reservemos un turno? Avisanos el día que te queda cómodo y lo dejamos listo.`;

  return `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`;
}
