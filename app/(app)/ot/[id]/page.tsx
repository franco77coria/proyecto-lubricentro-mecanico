import { ArrowLeft, Car, User, Wrench } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BotonPDFWhatsApp, DatosOTPDF } from "@/components/ot/BotonPDFWhatsApp";
import { ChecklistEditor } from "@/components/ot/ChecklistEditor";
import { EstadoSwitcher } from "@/components/ot/EstadoSwitcher";
import { ItemsEditor } from "@/components/ot/ItemsEditor";
import { SeccionPagos } from "@/components/ot/SeccionPagos";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaginaDetalleOT({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  const { id } = await params;
  const supabase = await crearClienteServidor();

  // 1. Obtener la OT
  const { data: ot } = await supabase
    .from("orden_trabajo")
    .select(`
      *,
      vehiculo:vehiculo_id (
        id, patente, anio, color, combustible,
        marca:marca_id (nombre),
        modelo:modelo_id (nombre)
      ),
      cliente:cliente_id (
        id, nombre, apellido, telefono, email
      )
    `)
    .eq("id", id)
    .eq("taller_id", sesion.perfil.taller_id)
    .maybeSingle();

  if (!ot) notFound();

  // 2. Obtener los datos del taller
  const { data: taller } = await supabase
    .from("taller")
    .select("nombre, direccion, telefono, cuit")
    .eq("id", sesion.perfil.taller_id)
    .single();

  // 3. Obtener los ítems
  const { data: items } = await supabase
    .from("ot_item")
    .select("*")
    .eq("ot_id", ot.id)
    .order("orden", { ascending: true });

  // 4. Obtener el checklist
  const { data: checklist } = await supabase
    .from("ot_checklist")
    .select("*")
    .eq("ot_id", ot.id)
    .order("orden", { ascending: true });

  // 5. Obtener las notas / anomalías
  const { data: notas } = await supabase
    .from("ot_nota")
    .select("*")
    .eq("ot_id", ot.id)
    .order("orden", { ascending: true });

  // 6. Obtener los pagos
  const { data: pagos } = await supabase
    .from("pago")
    .select("id, metodo, monto, fecha")
    .eq("ot_id", ot.id)
    .order("fecha", { ascending: true });

  const datosPdf: DatosOTPDF = {
    id: ot.id,
    numero: ot.numero,
    fecha_ingreso: ot.fecha_ingreso,
    estado: ot.estado,
    tipo: ot.tipo,
    km_ingreso: ot.km_ingreso,
    observaciones: ot.observaciones,
    total_mano_obra: Number(ot.total_mano_obra || 0),
    total_repuestos: Number(ot.total_repuestos || 0),
    total: Number(ot.total || 0),
    taller: {
      nombre: taller?.nombre || "Taller Mecánico",
      direccion: taller?.direccion,
      telefono: taller?.telefono,
      cuit: taller?.cuit,
    },
    vehiculo: {
      patente: ot.vehiculo.patente,
      marca: ot.vehiculo.marca?.nombre,
      modelo: ot.vehiculo.modelo?.nombre,
      anio: ot.vehiculo.anio,
      color: ot.vehiculo.color,
    },
    cliente: ot.cliente,
    items: (items || []).map((it) => ({
      descripcion: it.descripcion,
      tipo: it.tipo,
      cantidad: Number(it.cantidad),
      precio_unitario: Number(it.precio_unitario),
      subtotal: Number(it.subtotal || 0),
    })),
    checklist: (checklist || []).map((chk) => ({
      etiqueta_snapshot: chk.etiqueta_snapshot,
      estado: chk.estado,
      nota: chk.nota,
    })),
  };

  const itemsMapeados = (items || []).map((it) => ({
    id: it.id,
    tipo: it.tipo,
    descripcion: it.descripcion,
    cantidad: Number(it.cantidad),
    precio_unitario: Number(it.precio_unitario),
    subtotal: Number(it.subtotal || 0),
  }));

  const pagosMapeados = (pagos || []).map((p) => ({
    id: p.id,
    metodo: p.metodo,
    monto: Number(p.monto || 0),
    fecha: p.fecha,
  }));

  const anomalias = (notas || []).filter((n) => n.tipo === "anomalia");

  return (
    <main className="flex-1 px-4 pt-[calc(var(--safe-top)+4.5rem)] pb-24 scroll-inset">
      <div className="mx-auto max-w-[32rem] space-y-6">
        {/* Nav Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/tablero"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al Tablero</span>
          </Link>
          <BotonPDFWhatsApp ot={datosPdf} />
        </div>

        {/* Encabezado OT */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-caption text-muted-foreground">Orden de Trabajo</p>
              <h1 className="text-display text-3xl font-bold tracking-tight text-foreground">
                #{ot.numero}
              </h1>
            </div>
            <EstadoSwitcher otId={ot.id} estadoActual={ot.estado} />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-caption font-semibold text-muted-foreground">
                <Car className="h-3.5 w-3.5 text-accent" />
                <span>Vehículo</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {[ot.vehiculo.marca?.nombre, ot.vehiculo.modelo?.nombre].filter(Boolean).join(" ") || "Sin modelo"}
              </p>
              <p className="text-caption font-semibold text-accent">{ot.vehiculo.patente}</p>
              {ot.km_ingreso && (
                <p className="text-caption text-muted-foreground">{ot.km_ingreso.toLocaleString()} km</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-caption font-semibold text-muted-foreground">
                <User className="h-3.5 w-3.5 text-accent" />
                <span>Cliente</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {ot.cliente ? `${ot.cliente.nombre} ${ot.cliente.apellido || ""}` : "Consumidor Final"}
              </p>
              {ot.cliente?.telefono && (
                <p className="text-caption text-muted-foreground">{ot.cliente.telefono}</p>
              )}
            </div>
          </div>
        </div>

        {/* Registro de Pagos */}
        <SeccionPagos otId={ot.id} totalOT={Number(ot.total || 0)} pagosIniciales={pagosMapeados} />

        {/* Anomalías reportadas */}
        {anomalias.length > 0 && (
          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Anomalías Reportadas por el Cliente
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-foreground font-medium">
              {anomalias.map((a) => (
                <li key={a.id}>{a.texto}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Trabajos y Repuestos */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Trabajos y Repuestos
              </h2>
            </div>
          </div>
          <ItemsEditor otId={ot.id} items={itemsMapeados} />
        </section>

        {/* Inspección / Checklist */}
        <section className="space-y-3 pt-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Checklist de Inspección
          </h2>
          <ChecklistEditor items={checklist || []} />
        </section>
      </div>
    </main>
  );
}
