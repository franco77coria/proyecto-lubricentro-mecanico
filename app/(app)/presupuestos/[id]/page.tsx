import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Car, User, Phone, FileText, Wrench, Printer } from "lucide-react";
import { obtenerPresupuesto } from "@/lib/actions/presupuestos";

export const dynamic = "force-dynamic";

export default async function PaginaDetallePresupuesto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const presupuesto = await obtenerPresupuesto(id);

  if (!presupuesto) return notFound();

  const items = presupuesto.items || [];
  const total = items.reduce((acc: number, item: any) => acc + (item.precio_unitario * item.cantidad), 0);
  const fecha = new Date(presupuesto.creado_en);
  const formatter = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const vehiculo = presupuesto.vehiculo as any;
  const cliente = presupuesto.cliente as any;

  return (
    <main className="flex-1 overflow-y-auto pt-[calc(var(--safe-top)+1.25rem)] pb-24 lg:pb-8">
      <div className="contenedor-ancho space-y-6 max-w-3xl">
        {/* Navegación */}
        <div className="flex items-center justify-between">
          <Link
            href="/presupuestos"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Presupuestos</span>
          </Link>
          <button
            onClick={() => {}}
            className="hidden sm:flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm hover:brightness-110"
          >
            <Printer className="h-4 w-4" />
            Imprimir PDF
          </button>
        </div>

        {/* Encabezado */}
        <header className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              <h1 className="text-xl font-bold text-foreground">Presupuesto</h1>
            </div>
            <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600">
              {presupuesto.estado}
            </span>
          </div>
          <p className="text-sm text-muted-foreground capitalize">{formatter.format(fecha)}</p>

          {vehiculo && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold text-foreground uppercase tracking-wider">{vehiculo.patente}</span>
              <span className="text-sm text-muted-foreground">
                — {vehiculo.motorizacion?.modelo?.marca?.nombre} {vehiculo.motorizacion?.modelo?.nombre}
              </span>
            </div>
          )}

          {cliente && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{cliente.nombre}</span>
              {cliente.telefono && (
                <a href={`tel:${cliente.telefono.replace(/\D/g, "")}`} className="flex items-center gap-1 ml-auto text-blue-600 hover:underline">
                  <Phone className="h-3 w-3" />
                  <span>{cliente.telefono}</span>
                </a>
              )}
            </div>
          )}
        </header>

        {/* Ítems */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Wrench className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold text-foreground">Detalle de Ítems</h2>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Este presupuesto no tiene ítems cargados.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between rounded-xl bg-muted/40 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                        {item.tipo?.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground truncate">{item.descripcion}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs text-muted-foreground">{item.cantidad} × ${Number(item.precio_unitario).toLocaleString("es-AR")}</p>
                    <p className="text-sm font-bold text-foreground">
                      ${(item.cantidad * item.precio_unitario).toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
                <span className="text-sm font-semibold text-muted-foreground">Total Presupuesto</span>
                <span className="text-2xl font-black text-emerald-600">
                  ${total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Observaciones */}
        {presupuesto.observaciones && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-bold text-foreground mb-2">Observaciones</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{presupuesto.observaciones}</p>
          </section>
        )}
      </div>
    </main>
  );
}
