import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, FileText, Wrench, WrenchIcon, Layers } from "lucide-react";
import { obtenerPresupuesto } from "@/lib/actions/presupuestos";
import { BotonImprimirPresupuesto } from "@/components/presupuestos/BotonImprimirPresupuesto";
import { PlacaPatente } from "@/components/ui/PlacaPatente";

export const dynamic = "force-dynamic";

export default async function PaginaDetallePresupuesto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const presupuesto = await obtenerPresupuesto(id);

  if (!presupuesto) return notFound();

  interface ItemPresupuesto {
    id: string;
    descripcion: string;
    tipo: string;
    cantidad: number;
    precio_unitario: number;
  }

  const items = (presupuesto.items || []) as ItemPresupuesto[];
  const totalItems = items.reduce(
    (acc: number, item: ItemPresupuesto) => acc + item.precio_unitario * item.cantidad,
    0,
  );
  const total = totalItems > 0 ? totalItems : Number(presupuesto.total ?? 0);
  const totalManoObra = Number(presupuesto.total_mano_obra ?? 0);
  const totalRepuestos = Number(presupuesto.total_repuestos ?? 0);

  const fecha = new Date(presupuesto.creado_en);
  const formatter = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const vehiculo = presupuesto.vehiculo as {
    patente?: string;
    marca?: { nombre: string };
    modelo?: { nombre: string };
    motorizacion?: { nombre: string };
  } | null;

  const cliente = presupuesto.cliente as {
    nombre?: string;
    apellido?: string;
    telefono?: string;
  } | null;

  return (
    <main className="flex-1 overflow-y-auto pt-[calc(var(--safe-top)+1.25rem)] pb-24 lg:pb-8">
      <div className="contenedor-ancho space-y-6 max-w-3xl">
        {/* Navegación */}
        <div className="flex items-center justify-between">
          <Link
            href="/presupuestos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Presupuestos</span>
          </Link>
          <BotonImprimirPresupuesto />
        </div>

        {/* Encabezado */}
        <header className="space-y-4 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              <h1 className="text-xl font-black text-foreground">
                Presupuesto {presupuesto.numero ? `#${presupuesto.numero}` : `#${id.slice(0, 8)}`}
              </h1>
            </div>
            <span className="rounded-full border border-accent/30 bg-accent/15 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-accent">
              {presupuesto.estado}
            </span>
          </div>
          <p className="text-xs font-semibold text-muted-foreground capitalize">
            {formatter.format(fecha)} hs.
          </p>

          {vehiculo?.patente && (
            <div className="flex items-center gap-3 pt-3 border-t border-border/60">
              <PlacaPatente patente={vehiculo.patente} size="sm" />
              <span className="text-sm font-black text-foreground">
                {[vehiculo.marca?.nombre, vehiculo.modelo?.nombre, vehiculo.motorizacion?.nombre]
                  .filter(Boolean)
                  .join(" ") || "Vehículo del Taller"}
              </span>
            </div>
          )}

          {cliente?.nombre && (
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pt-1">
              <User className="h-4 w-4 text-accent" />
              <span className="font-bold text-foreground">
                {[cliente.nombre, cliente.apellido].filter(Boolean).join(" ")}
              </span>
              {cliente.telefono && (
                <a
                  href={`tel:${cliente.telefono.replace(/\D/g, "")}`}
                  className="flex items-center gap-1 ml-auto text-accent font-bold hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  <span>{cliente.telefono}</span>
                </a>
              )}
            </div>
          )}
        </header>

        {/* Ítems */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Wrench className="h-4 w-4 text-accent" />
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
              Detalle de Ítems y Cotización
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="space-y-4 py-2">
              {/* Desglose de totales guardados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {totalManoObra > 0 && (
                  <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4">
                    <div className="flex items-center gap-2">
                      <WrenchIcon className="h-4 w-4 text-accent" />
                      <span className="text-xs font-bold text-foreground">Mano de Obra</span>
                    </div>
                    <span className="text-sm font-black text-foreground tabular-nums">
                      ${totalManoObra.toLocaleString("es-AR")}
                    </span>
                  </div>
                )}
                {totalRepuestos > 0 && (
                  <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-accent" />
                      <span className="text-xs font-bold text-foreground">Repuestos e Insumos</span>
                    </div>
                    <span className="text-sm font-black text-foreground tabular-nums">
                      ${totalRepuestos.toLocaleString("es-AR")}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-border/60 pt-4 mt-2">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Total Cotizado
                </span>
                <span className="text-2xl font-black text-accent tabular-nums">
                  ${total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between rounded-2xl bg-muted/30 p-3.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-accent">
                        {item.tipo?.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-foreground truncate">
                      {item.descripcion}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {item.cantidad} × ${Number(item.precio_unitario).toLocaleString("es-AR")}
                    </p>
                    <p className="text-sm font-black text-foreground tabular-nums">
                      ${(item.cantidad * item.precio_unitario).toLocaleString("es-AR", {
                        minimumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center border-t border-border/60 pt-4 mt-2">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Total Presupuestado
                </span>
                <span className="text-2xl font-black text-accent tabular-nums">
                  ${total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Observaciones */}
        {presupuesto.observaciones && (
          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground mb-2">
              Observaciones &amp; Anomalías
            </h2>
            <p className="text-sm text-muted-foreground font-medium whitespace-pre-wrap leading-relaxed">
              {presupuesto.observaciones}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
