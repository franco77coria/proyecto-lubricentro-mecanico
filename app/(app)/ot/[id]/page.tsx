import { ArrowLeft, Ban, Car, User, Wrench } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AnularOrden } from "@/components/ot/AnularOrden";
import { BotonPDFWhatsApp, DatosOTPDF } from "@/components/ot/BotonPDFWhatsApp";
import { CapturaFotos } from "@/components/ot/CapturaFotos";
import { ChecklistEditor } from "@/components/ot/ChecklistEditor";
import { EditorNotas } from "@/components/ot/EditorNotas";
import { EstadoSwitcher } from "@/components/ot/EstadoSwitcher";
import { FirmaCliente } from "@/components/ot/FirmaCliente";
import { ItemsEditor } from "@/components/ot/ItemsEditor";
import { SeccionPagos } from "@/components/ot/SeccionPagos";
import { fotosDeOT } from "@/lib/actions/fotos";
import { listarServicios } from "@/lib/actions/servicios";
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
    // Los tres bloques de texto van separados en el comprobante: lo que dijo
    // el cliente, lo que encontró el taller, y lo que queda presupuestado.
    anomalias: (notas || [])
      .filter((n) => n.tipo === "anomalia")
      .map((n) => ({ texto: n.texto })),
    descargos: (notas || [])
      .filter((n) => n.tipo === "descargo")
      .map((n) => ({ texto: n.texto })),
    recomendados: (notas || [])
      .filter((n) => n.tipo === "recomendado")
      .map((n) => ({ texto: n.texto, precio_estimado: n.precio_estimado })),
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

  const notasEditor = (notas || []).map((n) => ({
    id: n.id,
    tipo: n.tipo,
    texto: n.texto,
    precio_estimado: n.precio_estimado,
  }));

  // Fotos, firma y los dos catálogos que alimentan el editor de ítems. Todo en
  // paralelo: son consultas independientes y encadenarlas solo suma latencia.
  const [fotos, { data: recepcion }, servicios, { data: productos }] = await Promise.all([
    fotosDeOT(ot.id),
    supabase.from("ot_recepcion").select("firma_recepcion_url").eq("ot_id", ot.id).maybeSingle(),
    listarServicios(),
    supabase
      .from("producto")
      .select("id, nombre, precio_venta, stock, unidad")
      .eq("taller_id", sesion.perfil.taller_id)
      .eq("activo", true)
      .order("nombre", { ascending: true })
      .limit(500),
  ]);

  const productosOpcion = (productos ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precioVenta: Number(p.precio_venta ?? 0),
    stock: Number(p.stock ?? 0),
    unidad: p.unidad,
  }));

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor-angosto space-y-6">
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

        {/* Los tres bloques de texto de la orden. Antes las anomalías eran
            de solo lectura y no había forma de cargar el diagnóstico ni un
            presupuesto de lo no autorizado desde la ficha. */}
        <EditorNotas otId={ot.id} tipo="anomalia" notas={notasEditor} />
        <EditorNotas otId={ot.id} tipo="descargo" notas={notasEditor} />
        <EditorNotas otId={ot.id} tipo="recomendado" notas={notasEditor} />

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
          <ItemsEditor
            otId={ot.id}
            items={itemsMapeados}
            servicios={servicios}
            productos={productosOpcion}
          />
        </section>

        {/* Inspección / Checklist */}
        <section className="space-y-3 pt-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Checklist de Inspección
          </h2>
          <ChecklistEditor items={checklist || []} />
        </section>

        {/* Recepción: fotos del estado del auto y conformidad del cliente.
            Van juntas porque son las dos caras de lo mismo: dejar constancia
            de cómo entró el vehículo. */}
        <CapturaFotos otId={ot.id} tallerId={sesion.perfil.taller_id} fotos={fotos} />

        {ot.estado === "anulado" ? (
          <p className="tarjeta flex items-start gap-2.5 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <Ban className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              <strong>Orden anulada.</strong>{" "}
              {ot.motivo_anulacion || "Sin motivo registrado."}
            </span>
          </p>
        ) : (
          <div className="flex justify-end">
            <AnularOrden otId={ot.id} estadoActual={ot.estado} />
          </div>
        )}

        <FirmaCliente
          otId={ot.id}
          tallerId={sesion.perfil.taller_id}
          momento="recepcion"
          yaFirmada={Boolean(recepcion?.firma_recepcion_url)}
        />
      </div>
    </main>
  );
}
