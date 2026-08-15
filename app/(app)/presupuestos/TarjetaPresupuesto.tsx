import Link from "next/link";
import { FileText, User } from "lucide-react";
import { PlacaPatente } from "@/components/ui/PlacaPatente";

interface ItemPresupuesto {
  cantidad: number;
  precio_unitario: number;
}

export interface PresupuestoTarjetaProps {
  presupuesto: {
    id: string;
    creado_en: string;
    items?: ItemPresupuesto[];
    vehiculo?: {
      patente: string;
      motorizacion?: {
        modelo?: {
          nombre?: string;
          marca?: { nombre?: string };
        };
      };
    } | null;
    cliente?: {
      nombre: string;
      apellido?: string | null;
    } | null;
  };
}

export function TarjetaPresupuesto({ presupuesto }: PresupuestoTarjetaProps) {
  const fecha = new Date(presupuesto.creado_en);
  const formatter = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const items = presupuesto.items || [];
  const total = items.reduce(
    (acc: number, item: ItemPresupuesto) => acc + item.precio_unitario * item.cantidad,
    0,
  );

  return (
    <Link
      href={`/presupuestos/${presupuesto.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-accent/50 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <FileText className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
          <span>Cotización</span>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
          {formatter.format(fecha)}
        </span>
      </div>

      <div className="mt-2 space-y-2">
        {presupuesto.vehiculo?.patente && (
          <div className="flex items-center gap-2 text-sm">
            <PlacaPatente patente={presupuesto.vehiculo.patente} size="sm" />
            <span className="text-xs font-semibold text-muted-foreground truncate hidden sm:inline">
              {[
                presupuesto.vehiculo.motorizacion?.modelo?.marca?.nombre,
                presupuesto.vehiculo.motorizacion?.modelo?.nombre,
              ]
                .filter(Boolean)
                .join(" ")}
            </span>
          </div>
        )}

        {presupuesto.cliente && (
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {[presupuesto.cliente.nombre, presupuesto.cliente.apellido].filter(Boolean).join(" ")}
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-border flex justify-between items-center">
        <span className="text-xs text-muted-foreground font-semibold uppercase">
          {items.length} {items.length === 1 ? "ítem" : "ítems"}
        </span>
        <span className="text-lg font-black text-accent tabular-nums">
          ${total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
        </span>
      </div>
    </Link>
  );
}
