import { Fuel, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { OdometroNumero } from "@/components/ui/OdometroNumero";

interface TelemetriaIngresoProps {
  km: number | null;
  combustible: number | null;
  className?: string;
  /** Viene del taller dueño de la orden: el portal público no tiene sesión ni
   *  contexto de idioma, así que el formato viaja por props. */
  locale?: string;
}

export function TelemetriaIngreso({
  km,
  combustible,
  className,
  locale = "es-AR",
}: TelemetriaIngresoProps) {
  if (km == null && combustible == null) return null;

  const nivel = combustible != null ? Math.min(Math.max(combustible, 0), 100) : null;

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>
      {/* Kilometraje de Ingreso */}
      {km != null && (
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
            <Gauge className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Odómetro al Ingresar
            </span>
            <div className="text-base font-black text-foreground">
              <OdometroNumero valor={km} formato="km" locale={locale} />
            </div>
          </div>
        </div>
      )}

      {/* Nivel de Combustible */}
      {nivel != null && (
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
            <Fuel className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Nivel de Combustible</span>
              <span className="text-foreground font-black">{nivel}%</span>
            </div>
            {/* Barra gráfica de nivel */}
            <div className="mt-1.5 h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  nivel <= 15 ? "bg-red-500" : nivel <= 35 ? "bg-amber-500" : "bg-emerald-500",
                )}
                style={{ width: `${nivel}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
