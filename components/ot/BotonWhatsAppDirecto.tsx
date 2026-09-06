"use client";

import { MessageCircle } from "lucide-react";
import { armarLinkWhatsApp } from "@/lib/whatsapp";
import { useI18n } from "@/lib/i18n/I18nContext";

export interface BotonWhatsAppDirectoProps {
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

export function BotonWhatsAppDirecto(props: BotonWhatsAppDirectoProps) {
  const { idioma, moneda } = useI18n();
  const link = armarLinkWhatsApp({
    ...props,
    idioma,
    moneda,
  });

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 hover:bg-emerald-500"
      title="Contactar al cliente por WhatsApp"
    >
      <MessageCircle className="h-4 w-4" aria-hidden />
      <span>WhatsApp</span>
    </a>
  );
}
