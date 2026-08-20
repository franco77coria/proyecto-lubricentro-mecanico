import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, FileText } from "lucide-react";
import { obtenerPresupuesto } from "@/lib/actions/presupuestos";
import { BotonCompartirPresupuesto } from "@/components/presupuestos/BotonCompartirPresupuesto";
import { BotonConvertirOT } from "@/components/presupuestos/BotonConvertirOT";
import { BotonPDFWhatsApp } from "@/components/ot/BotonPDFWhatsApp";
import { ItemsEditor } from "@/components/ot/ItemsEditor";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { listarServicios } from "@/lib/actions/servicios";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirVista } from "@/lib/permisos";
import { obtenerAjustesTaller } from "@/lib/taller";
import { formatearMoneda, localeDe } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PaginaDetallePresupuesto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await exigirVista("/presupuestos");
  const { idioma, moneda } = await obtenerAjustesTaller();
  const money = (n: number) => formatearMoneda(n, moneda, idioma);
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const [presupuesto, servicios, { data: productosRaw }, { data: taller }] = await Promise.all([
    obtenerPresupuesto(id),
    listarServicios(),
    supabase
      .from("producto")
      .select("id, nombre, precio_venta, stock, unidad")
      .eq("taller_id", sesion?.perfil?.taller_id || "")
      .eq("activo", true)
      .order("nombre", { ascending: true })
      .limit(500),
    supabase
      .from("taller")
      .select("nombre, direccion, telefono, cuit")
      .eq("id", sesion?.perfil?.taller_id || "")
      .maybeSingle(),
  ]);

  if (!presupuesto) return notFound();

  const productos = (productosRaw || []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precioVenta: Number(p.precio_venta),
    stock: Number(p.stock),
    unidad: p.unidad,
  }));

  interface ItemPresupuesto {
    id: string;
    descripcion: string;
    tipo: "repuesto" | "mano_obra" | "servicio" | "insumo" | "tercero";
    cantidad: number;
    precio_unitario: number;
    subtotal?: number;
  }

  const rawItems = (presupuesto.items || []) as ItemPresupuesto[];
  const items = rawItems.map((it) => ({
    ...it,
    subtotal: it.subtotal ?? it.cantidad * it.precio_unitario,
  }));

  const totalItems = items.reduce(
    (acc: number, item: ItemPresupuesto) => acc + item.precio_unitario * item.cantidad,
    0,
  );
  const total = totalItems > 0 ? totalItems : Number(presupuesto.total ?? 0);
  const totalManoObra = items
    .filter((it) => it.tipo === "mano_obra" || it.tipo === "servicio")
    .reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0) || Number(presupuesto.total_mano_obra ?? 0);
  const totalRepuestos = items
    .filter((it) => it.tipo === "repuesto" || it.tipo === "insumo" || it.tipo === "tercero")
    .reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0) || Number(presupuesto.total_repuestos ?? 0);

  const fecha = new Date(presupuesto.creado_en);
  const formatter = new Intl.DateTimeFormat(localeDe(idioma), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const vehiculo = presupuesto.vehiculo as {
    id?: string;
    patente: string;
    anio?: number | null;
    color?: string | null;
    km_actual?: number | null;
    marca?: { nombre: string } | null;
    modelo?: { nombre: string } | null;
    motorizacion?: { nombre: string } | null;
  } | null;

  const cliente = presupuesto.cliente as {
    id?: string;
    nombre?: string;
    apellido?: string;
    telefono?: string;
  } | null;

  const esPresupuesto = presupuesto.estado === "presupuesto";

  return (
    <main className="flex-1 overflow-y-auto pt-[calc(var(--safe-top)+1.25rem)] pb-24 lg:pb-8">
      <div className="contenedor-ancho space-y-6 max-w-3xl">
        {/* Navegación y Acciones Rápidas */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/presupuestos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Presupuestos</span>
          </Link>
          <div className="flex items-center gap-2">
            <BotonCompartirPresupuesto
              numero={presupuesto.numero || id.slice(0, 8)}
              total={total}
              totalManoObra={totalManoObra}
              totalRepuestos={totalRepuestos}
              vehiculo={{
                patente: vehiculo?.patente || "",
                marca: vehiculo?.marca?.nombre,
                modelo: vehiculo?.modelo?.nombre,
              }}
              cliente={cliente}
              observaciones={presupuesto.observaciones}
            />
            <BotonPDFWhatsApp
              ot={{
                id: presupuesto.id,
                numero: presupuesto.numero || id.slice(0, 8),
                estado: "Presupuesto",
                tipo: presupuesto.tipo || "mecanica",
                fecha_ingreso: presupuesto.fecha_ingreso || presupuesto.creado_en,
                total,
                total_mano_obra: totalManoObra,
                total_repuestos: totalRepuestos,
                observaciones: presupuesto.observaciones,
                km_ingreso: presupuesto.km_ingreso,
                taller: {
                  nombre: taller?.nombre || "Taller Mecánico",
                  direccion: taller?.direccion,
                  telefono: taller?.telefono,
                  cuit: taller?.cuit,
                },
                vehiculo: {
                  patente: vehiculo?.patente || "",
                  marca: vehiculo?.marca?.nombre,
                  modelo: vehiculo?.modelo?.nombre,
                  anio: vehiculo?.anio,
                  color: vehiculo?.color,
                },
                cliente: cliente ? {
                  nombre: cliente.nombre || "Cliente",
                  apellido: cliente.apellido || "",
                  telefono: cliente.telefono || "",
                } : null,
                items: items.map((it) => ({
                  descripcion: it.descripcion,
                  tipo: it.tipo,
                  cantidad: it.cantidad,
                  precio_unitario: it.precio_unitario,
                  subtotal: it.subtotal,
                })),
                checklist: [],
                anomalias: [],
                descargos: [],
                recomendados: [],
              }}
            />
          </div>
        </div>

        {/* Botón de conversión rápida */}
        {esPresupuesto && (
          <BotonConvertirOT presupuestoId={presupuesto.id} />
        )}

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

        {/* Editor de ítems editable in-situ */}
        <section className="space-y-4">
          <ItemsEditor
            otId={presupuesto.id}
            items={items}
            servicios={servicios}
            productos={productos}
          />
        </section>

        {/* Resumen de totales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-2xl bg-card border border-border p-4 shadow-xs">
            <span className="text-xs font-bold text-muted-foreground">Mano de Obra &amp; Servicios:</span>
            <span className="text-sm font-black text-foreground tabular-nums">{money(totalManoObra)}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-card border border-border p-4 shadow-xs">
            <span className="text-xs font-bold text-muted-foreground">Repuestos &amp; Insumos:</span>
            <span className="text-sm font-black text-foreground tabular-nums">{money(totalRepuestos)}</span>
          </div>
        </div>

        {/* Observaciones */}
        {presupuesto.observaciones && (
          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground mb-2">
              Observaciones &amp; Validez
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
