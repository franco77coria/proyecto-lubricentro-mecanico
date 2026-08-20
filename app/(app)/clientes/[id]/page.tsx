import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Car, Phone, FileText, User } from "lucide-react";
import { obtenerClienteDetalle } from "@/lib/actions/clientes";
import { obtenerVehiculosParaAsignar } from "@/lib/actions/vehiculos";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { SiluetaVehiculo } from "@/components/ui/SiluetaVehiculo";
import { ModalAsociarVehiculo } from "@/components/clientes/ModalAsociarVehiculo";
import { ESTADO_TONO, etiquetaEstado } from "@/lib/estados-ot";
import { exigirVista } from "@/lib/permisos";
import { obtenerAjustesTaller } from "@/lib/taller";
import { formatearFecha, formatearMoneda } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/* Plata y fechas se formatean con lo que tenga configurado el taller. */

interface VehiculoItem {
  id: string;
  desde: string;
  hasta: string | null;
  vehiculo: {
    id: string;
    patente: string;
    anio?: number | null;
    color?: string | null;
    combustible?: string | null;
    km_actual?: number | null;
    marca?: { nombre: string } | null;
    modelo?: { nombre: string } | null;
  };
}

interface OrdenItem {
  id: string;
  numero: string;
  estado: string;
  total: number;
  fecha_ingreso: string;
  fecha_entrega: string | null;
  vehiculo?: {
    patente: string;
    marca?: { nombre: string } | null;
    modelo?: { nombre: string } | null;
  } | null;
}

export default async function PaginaDetalleCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirVista("/clientes");
  const { idioma, moneda } = await obtenerAjustesTaller();
  const money = (n: number) => formatearMoneda(n, moneda, idioma);
  const fechaFormat = (iso: string) =>
    formatearFecha(iso, idioma, { day: "2-digit", month: "2-digit", year: "numeric" });

  const { id } = await params;
  const [detalle, vehiculosTaller] = await Promise.all([
    obtenerClienteDetalle(id),
    obtenerVehiculosParaAsignar(),
  ]);

  if (!detalle) return notFound();

  const { cliente, vehiculos, ordenes } = detalle;
  const listaVehiculos = vehiculos as unknown as VehiculoItem[];
  const listaOrdenes = ordenes as unknown as OrdenItem[];

  const totalFacturado = listaOrdenes
    .filter((o) => ["entregado", "cerrado"].includes(o.estado))
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <main className="flex-1 overflow-y-auto pt-[calc(var(--safe-top)+1.25rem)] pb-24 lg:pb-8">
      <div className="contenedor space-y-6 max-w-4xl">
        {/* Volver */}
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a Clientes</span>
        </Link>

        {/* Ficha Principal del Cliente */}
        <header className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent font-black text-xl border border-accent/30 shadow-sm">
                <User className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground">
                  {[cliente.nombre, cliente.apellido].filter(Boolean).join(" ")}
                </h1>
                <p className="text-xs font-semibold text-muted-foreground">
                  Cliente registrado desde {fechaFormat(cliente.creado_en)}
                </p>
              </div>
            </div>

            {cliente.telefono && (
              <a
                href={`https://wa.me/${cliente.telefono.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 active:scale-95 transition-all"
              >
                <Phone className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60 text-sm">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Teléfono
              </span>
              <span className="font-semibold text-foreground">
                {cliente.telefono || "No especificado"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Email
              </span>
              <span className="font-semibold text-foreground">
                {cliente.email || "No especificado"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Facturado Histórico
              </span>
              <span className="font-black text-accent text-base">
                {money(totalFacturado)}
              </span>
            </div>
          </div>
        </header>

        {/* Flota de Vehículos del Cliente */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Car className="h-4 w-4 text-accent" />
              Vehículos Asociados ({listaVehiculos.length})
            </h2>
            <ModalAsociarVehiculo clienteId={id} vehiculosTaller={vehiculosTaller} />
          </div>

          {listaVehiculos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
              Este cliente aún no tiene autos vinculados.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {listaVehiculos.map((v) => {
                const auto = v.vehiculo;
                const esActual = !v.hasta;
                return (
                  <Link
                    key={v.id}
                    href={`/vehiculos/${auto.patente}`}
                    className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-accent transition-all active:scale-[0.98]"
                  >
                    <SiluetaVehiculo
                      tipo={auto.modelo?.nombre || "auto"}
                      className="text-accent h-7 w-12"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <PlacaPatente patente={auto.patente} size="sm" />
                        {!esActual && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                            Histórico
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground truncate mt-1">
                        {[auto.marca?.nombre, auto.modelo?.nombre].filter(Boolean).join(" ")}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Historial de Órdenes de Trabajo del Cliente */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            Historial de Reparaciones y Servicios ({listaOrdenes.length})
          </h2>

          {listaOrdenes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
              No hay órdenes registradas para este cliente.
            </div>
          ) : (
            <ul className="divide-y divide-border/80 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
              {listaOrdenes.map((ot) => (
                <li key={ot.id}>
                  <Link
                    href={`/ot/${ot.id}`}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-black text-accent">
                          #{ot.numero || ot.id.slice(0, 8)}
                        </span>
                        {ot.vehiculo?.patente && (
                          <PlacaPatente patente={ot.vehiculo.patente} size="sm" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ingresado el {fechaFormat(ot.fecha_ingreso)}
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          ESTADO_TONO[ot.estado] || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {etiquetaEstado(ot.estado)}
                      </span>
                      <p className="text-sm font-black text-foreground tabular-nums">
                        {money(Number(ot.total || 0))}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
