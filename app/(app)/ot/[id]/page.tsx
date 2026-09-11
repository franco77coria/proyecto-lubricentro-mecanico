import { ArrowLeft, Ban, Car, CheckCircle2, User, Wrench } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AnularOrden } from "@/components/ot/AnularOrden";
import { AsistenteIA } from "@/components/ot/AsistenteIA";
import { CompartirSeguimiento } from "@/components/ot/CompartirSeguimiento";
import { BotonCrearPresupuesto } from "@/components/ot/BotonCrearPresupuesto";
import { BotonPDFWhatsApp, DatosOTPDF } from "@/components/ot/BotonPDFWhatsApp";
import { BotonWhatsAppDirecto } from "@/components/ot/BotonWhatsAppDirecto";
import { CapturaFotos } from "@/components/ot/CapturaFotos";
import { ChecklistEditor } from "@/components/ot/ChecklistEditor";
import { EditorNotas } from "@/components/ot/EditorNotas";
import { EstadoSwitcher } from "@/components/ot/EstadoSwitcher";
import { FirmaCliente } from "@/components/ot/FirmaCliente";
import { ItemsEditor } from "@/components/ot/ItemsEditor";
import { PanelFicha } from "@/components/ot/PanelFicha";
import { SeccionPagos } from "@/components/ot/SeccionPagos";
import { SelectorMecanico } from "@/components/ot/SelectorMecanico";
import { ValoresManoObraRepuestos } from "@/components/ot/ValoresManoObraRepuestos";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { FijarOTActiva } from "@/components/ot/FijarOTActiva";
import { PeritajeVehiculoIA } from "@/components/ot/PeritajeVehiculoIA";
import { fotosDeOT } from "@/lib/actions/fotos";
import { obtenerFicha } from "@/lib/actions/ficha";
import { asistenteHabilitado } from "@/lib/actions/ia";
import { listarServicios } from "@/lib/actions/servicios";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirVista } from "@/lib/permisos";
import { obtenerResponsablesOT, formatearRol, type DatosOTResponsables } from "@/lib/ot-usuarios";
import { obtenerAjustesTaller } from "@/lib/taller";
import { formatearFecha } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PaginaDetalleOT({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirVista("/kanban");
  const esDueno = sesion.perfil.rol === "dueno";

  const { id } = await params;
  const supabase = await crearClienteServidor();

  // 1. Obtener la OT
  const { data: ot } = await supabase
    .from("orden_trabajo")
    .select(`
      *,
      mecanico:asignado_a (
        user_id, nombre, rol
      ),
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

  // 2. Obtener ajustes del taller y datos para comprobante
  const [{ data: taller }, { idioma }] = await Promise.all([
    supabase
      .from("taller")
      .select("nombre, direccion, telefono, cuit, logo_url")
      .eq("id", sesion.perfil.taller_id)
      .single(),
    obtenerAjustesTaller(),
  ]);

  // 3. Obtener ítems, checklist, notas, pagos y logs de estado
  const [{ data: items }, { data: checklist }, { data: notas }, { data: pagos }, { data: logsEstado }] = await Promise.all([
    supabase.from("ot_item").select("id, tipo, descripcion, producto_id, cantidad, precio_unitario, subtotal, orden").eq("ot_id", ot.id).order("orden", { ascending: true }),
    supabase.from("ot_checklist").select("id, item_id, etiqueta_snapshot, orden, estado, nota, actualizado_por, actualizado_en").eq("ot_id", ot.id).order("orden", { ascending: true }),
    supabase.from("ot_nota").select("id, tipo, texto, precio_estimado, orden, creado_en, visible_cliente, responde_a_id, creado_por").eq("ot_id", ot.id).order("orden", { ascending: true }),
    supabase.from("pago").select("id, metodo, monto, fecha").eq("ot_id", ot.id).order("fecha", { ascending: true }),
    supabase
      .from("ot_estado_log")
      .select(`
        id, estado_anterior, estado_nuevo, creado_en, usuario_id,
        usuario:usuario_id ( user_id, nombre, rol )
      `)
      .eq("ot_id", ot.id)
      .order("creado_en", { ascending: false }),
  ]);

  const resp = obtenerResponsablesOT({
    ...ot,
    logs: logsEstado,
  } as unknown as DatosOTResponsables);

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
      logo_url: taller?.logo_url,
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
    visible_cliente: n.visible_cliente,
  }));

  // Fotos, firma y los catálogos que alimentan el editor de ítems y miembros.
  const [fotos, { data: recepcion }, servicios, ficha, hayIA, { data: productos }, { data: miembros }] = await Promise.all([
    fotosDeOT(ot.id),
    supabase.from("ot_recepcion").select("firma_recepcion_url").eq("ot_id", ot.id).maybeSingle(),
    listarServicios(),
    obtenerFicha(ot.vehiculo.id),
    asistenteHabilitado(),
    supabase
      .from("producto")
      .select("id, nombre, precio_venta, stock, unidad")
      .eq("taller_id", sesion.perfil.taller_id)
      .eq("activo", true)
      .order("nombre", { ascending: true })
      .limit(500),
    supabase
      .from("perfil")
      .select("user_id, nombre, rol")
      .eq("taller_id", sesion.perfil.taller_id)
      .eq("activo", true),
  ]);

  const productosOpcion = (productos ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precioVenta: Number(p.precio_venta ?? 0),
    stock: Number(p.stock ?? 0),
    unidad: p.unidad,
  }));

  const miembrosOpcion = (miembros ?? []) as { user_id: string; nombre: string | null; rol: string }[];

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+var(--isla-height)+0.75rem)] pb-8 scroll-inset">
      <FijarOTActiva
        otId={ot.id}
        numero={ot.numero}
        patente={ot.vehiculo.patente}
        estado={ot.estado}
        telefonoCliente={ot.cliente?.telefono}
      />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 md:px-6">
        {/* Nav Back */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/tablero"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al Tablero</span>
          </Link>
          <div className="flex items-center gap-2">
            <BotonWhatsAppDirecto
              numero={ot.numero}
              estado={ot.estado}
              total={Number(ot.total || 0)}
              totalManoObra={Number(ot.total_mano_obra || 0)}
              totalRepuestos={Number(ot.total_repuestos || 0)}
              vehiculo={{
                patente: ot.vehiculo.patente,
                marca: ot.vehiculo.marca?.nombre,
                modelo: ot.vehiculo.modelo?.nombre,
              }}
              cliente={ot.cliente}
              tallerNombre={taller?.nombre}
            />
            <BotonCrearPresupuesto otId={ot.id} estadoActual={ot.estado} />
            <BotonPDFWhatsApp ot={datosPdf} />
          </div>
        </div>

        {/* Encabezado OT */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider">Orden de Trabajo</p>
              <h1 className="text-display text-3xl font-black tracking-tight text-foreground">
                #{ot.numero}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SelectorMecanico otId={ot.id} asignadoA={ot.asignado_a} miembros={miembrosOpcion} />
              <EstadoSwitcher otId={ot.id} estadoActual={ot.estado} />
            </div>
          </div>

          {resp.cerradoPorNombre && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" aria-hidden />
              <div>
                <span className="font-bold text-foreground">Orden completada y cerrada:</span>{" "}
                <span>
                  Cerrada por <strong className="font-semibold text-foreground">{resp.cerradoPorNombre}</strong> ({formatearRol(resp.cerradoPorRol)})
                </span>
                {resp.cerradoEn && (
                  <span className="text-muted-foreground ml-1.5 font-medium">
                    el {formatearFecha(resp.cerradoEn, idioma, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-caption font-semibold text-muted-foreground">
                <Car className="h-4 w-4 text-accent" />
                <span>Vehículo</span>
              </div>
              <div className="flex items-center gap-2.5">
                <PlacaPatente patente={ot.vehiculo.patente} size="sm" />
                <p className="text-sm font-bold text-foreground truncate">
                  {[ot.vehiculo.marca?.nombre, ot.vehiculo.modelo?.nombre].filter(Boolean).join(" ") || "Sin modelo"}
                </p>
              </div>
              {ot.km_ingreso && (
                <p className="text-caption text-muted-foreground font-mono">{ot.km_ingreso.toLocaleString()} km de ingreso</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-caption font-semibold text-muted-foreground">
                <User className="h-4 w-4 text-accent" />
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

        {/* En desktop se aprovecha el ancho con dos columnas: la principal
            (trabajo técnico) más ancha, y una lateral con lo administrativo
            (seguimiento, pagos, firma). En mobile se apilan en el mismo orden. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          <div className="space-y-6 lg:col-span-2">
            {/* Los tres bloques de texto de la orden. Antes las anomalías eran
                de solo lectura y no había forma de cargar el diagnóstico ni un
                presupuesto de lo no autorizado desde la ficha. */}
            <EditorNotas otId={ot.id} tipo="anomalia" notas={notasEditor} />
            <EditorNotas otId={ot.id} tipo="descargo" notas={notasEditor} />
            <EditorNotas otId={ot.id} tipo="recomendado" notas={notasEditor} />

            {/* El asistente solo aparece si el taller tiene la clave configurada:
                un botón que falla siempre es peor que no tenerlo. */}
            {hayIA && (
              <AsistenteIA
                otId={ot.id}
                patente={ot.vehiculo.patente}
                telefonoCliente={ot.cliente?.telefono ?? null}
                nombreCliente={ot.cliente?.nombre ?? null}
                tallerNombre={taller?.nombre ?? "el taller"}
              />
            )}

            {/* Lo que lleva este motor. Va antes de los ítems porque es lo que se
                consulta para armarlos. */}
            <PanelFicha ficha={ficha} otId={ot.id} vehiculoId={ot.vehiculo.id} />

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

            {/* Inspección / Checklist — el panel que se completa antes de cerrar */}
            <section className="space-y-3 pt-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Checklist de Inspección
              </h2>
              <ChecklistEditor items={checklist || []} otId={ot.id} />
              <ValoresManoObraRepuestos otId={ot.id} />
            </section>

            {/* Recepción: fotos del estado del auto y conformidad del cliente.
                Van juntas porque son las dos caras de lo mismo: dejar constancia
                de cómo entró el vehículo. */}
            <CapturaFotos otId={ot.id} tallerId={sesion.perfil.taller_id} fotos={fotos} />

            {/* Peritaje IA de Carrocería, Daños y Color */}
            <PeritajeVehiculoIA
              otId={ot.id}
              tallerId={sesion.perfil.taller_id}
              fotos={fotos}
              peritajeIA={ot.peritaje_ia}
              inspeccionRecepcion={ot.inspeccion_recepcion}
              vehiculo={{
                id: ot.vehiculo.id,
                patente: ot.vehiculo.patente,
                marca: ot.vehiculo.marca?.nombre,
                modelo: ot.vehiculo.modelo?.nombre,
                anio: ot.vehiculo.anio,
                color: ot.vehiculo.color,
              }}
            />
          </div>

          <div className="space-y-6 lg:col-span-1">
            {/* El link para el cliente. Va arriba del detalle porque en una orden en
                presupuesto es la acción que sigue: mandarlo para que apruebe. */}
            <CompartirSeguimiento
              otId={ot.id}
              patente={ot.vehiculo.patente}
              tokenExistente={ot.token_publico}
              telefonoCliente={ot.cliente?.telefono ?? null}
              nombreCliente={ot.cliente?.nombre ?? null}
              tallerNombre={taller?.nombre ?? "el taller"}
            />

            {/* Registro de Pagos (Solo dueño) */}
            {esDueno && (
              <SeccionPagos otId={ot.id} totalOT={Number(ot.total || 0)} pagosIniciales={pagosMapeados} />
            )}

            {ot.estado === "anulado" ? (
              <p className="tarjeta flex items-start gap-2.5 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <Ban className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  <strong>Orden anulada.</strong>{" "}
                  {ot.motivo_anulacion || "Sin motivo registrado."}
                </span>
              </p>
            ) : (
              <div className="flex lg:justify-end">
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
        </div>
      </div>
    </main>
  );
}
