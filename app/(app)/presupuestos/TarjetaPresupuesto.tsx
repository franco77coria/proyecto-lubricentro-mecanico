import Link from "next/link";
import { FileText, Car, User, Calendar } from "lucide-react";

export function TarjetaPresupuesto({ presupuesto }: { presupuesto: any }) {
  const fecha = new Date(presupuesto.creado_en);
  const formatter = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const total = presupuesto.items?.reduce((acc: number, item: any) => acc + (item.precio_unitario * item.cantidad), 0) || 0;

  return (
    <Link 
      href={`/presupuestos/${presupuesto.id}`}
      className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm hover:border-accent/50 hover:shadow-md transition-all group"
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

      <div className="mt-2 space-y-1">
        {presupuesto.vehiculo && (
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-semibold text-foreground uppercase tracking-wider">{presupuesto.vehiculo.patente}</span>
            <span className="text-muted-foreground truncate hidden sm:inline">
              — {presupuesto.vehiculo.motorizacion?.modelo?.marca?.nombre} {presupuesto.vehiculo.motorizacion?.modelo?.nombre}
            </span>
          </div>
        )}
        
        {presupuesto.cliente && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{presupuesto.cliente.nombre}</span>
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-border flex justify-between items-center">
        <span className="text-xs text-muted-foreground font-semibold uppercase">{presupuesto.items?.length || 0} ítems</span>
        <span className="text-lg font-black text-emerald-600">
          ${total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
        </span>
      </div>
    </Link>
  );
}
