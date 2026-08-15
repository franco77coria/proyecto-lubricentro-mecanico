import { MessageCircle } from "lucide-react";
import { normalizarTelefono, paraWhatsApp } from "@/lib/telefono";
import { cn } from "@/lib/utils";

interface BotonWhatsAppTallerProps {
  telefono: string | null;
  tallerNombre: string;
  otNumero: string;
  patente: string;
  className?: string;
  flotante?: boolean;
}

export function BotonWhatsAppTaller({
  telefono,
  tallerNombre,
  otNumero,
  patente,
  className,
  flotante = true,
}: BotonWhatsAppTallerProps) {
  if (!telefono) return null;

  const e164 = normalizarTelefono(telefono);
  if (!e164) return null;

  const numeroLimpio = paraWhatsApp(e164);
  const textoMensaje = `Hola ${tallerNombre}! Te consulto por mi vehículo patente ${patente} (Orden #${otNumero}).`;
  const urlWhatsApp = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(textoMensaje)}`;

  if (flotante) {
    return (
      <div className="fixed bottom-6 right-4 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <a
          href={urlWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-black text-white shadow-xl hover:bg-emerald-500 active:scale-95 transition-all border border-emerald-400/30"
          aria-label="Consultar al taller por WhatsApp"
        >
          <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
          <span>Consultar al Taller</span>
        </a>
      </div>
    );
  }

  return (
    <a
      href={urlWhatsApp}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center justify-center gap-2 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 px-4 py-3.5 text-sm font-bold text-emerald-400 hover:bg-emerald-600/25 active:scale-95 transition-all",
        className,
      )}
    >
      <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
      <span>Escribir al taller por WhatsApp</span>
    </a>
  );
}
