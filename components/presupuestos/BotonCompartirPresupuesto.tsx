"use client";

import { MessageCircle } from "lucide-react";
import { armarLinkPresupuestoWhatsApp } from "@/lib/whatsapp";

interface Props {
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
  tokenPublico?: string | null;
  observaciones?: string | null;
}

export function BotonCompartirPresupuesto(props: Props) {
  const link = armarLinkPresupuestoWhatsApp(props);

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 active:scale-95 transition-all"
    >
      <MessageCircle className="h-4 w-4" />
      <span>Enviar por WhatsApp</span>
    </a>
  );
}
