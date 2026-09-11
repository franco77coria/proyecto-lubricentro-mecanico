"use client";

import { formatearDistancia, formatearNumero } from "@/lib/i18n";
import { useFormato, useI18n } from "@/lib/i18n/I18nContext";
import { formatearPatente } from "@/lib/patente";
import { formatearTelefono } from "@/lib/telefono";

export interface ItemComprobante {
  descripcion: string;
  tipo: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface NotaComprobante {
  texto: string;
  precio_estimado?: number | null;
}

export interface ChecklistComprobante {
  etiqueta_snapshot: string;
  estado: "ok" | "observado" | "critico" | "no_aplica" | null;
  nota?: string | null;
}

export interface DatosComprobante {
  numero: string;
  fecha_ingreso: string;
  fecha_salida?: string | null;
  estado: string;
  km_ingreso?: number | null;
  observaciones?: string | null;
  total_mano_obra: number;
  total_repuestos: number;
  total: number;
  taller: {
    nombre: string;
    direccion?: string | null;
    telefono?: string | null;
    cuit?: string | null;
    logo_url?: string | null;
  };
  vehiculo: {
    patente: string;
    marca?: string | null;
    modelo?: string | null;
    anio?: number | null;
    color?: string | null;
  };
  cliente?: { nombre: string; apellido?: string | null; telefono?: string | null } | null;
  items: ItemComprobante[];
  checklist: ChecklistComprobante[];
  anomalias: NotaComprobante[];
  descargos: NotaComprobante[];
  recomendados: NotaComprobante[];
}

const BLOQUES = [
  { titulo: "Mano de obra y servicios", tipos: ["mano_obra", "servicio"] },
  { titulo: "Repuestos y materiales", tipos: ["repuesto", "insumo", "tercero"] },
] as const;

const ESTADO_CHECK: Record<string, { texto: string; icono: string; clase: string }> = {
  ok: { texto: "Correcto", icono: "✓", clase: "cmp-check-ok" },
  observado: { texto: "Observado", icono: "!", clase: "cmp-check-obs" },
  critico: { texto: "Crítico", icono: "✗", clase: "cmp-check-critico" },
  no_aplica: { texto: "N/A", icono: "—", clase: "cmp-check-na" },
};

const ESTADO_LABEL: Record<string, string> = {
  presupuesto: "Presupuesto",
  aprobado: "Aprobado",
  recibido: "En recepción",
  en_trabajo: "En Trabajo",
  esperando_repuesto: "Esperando repuesto",
  listo: "Listo para entrega",
  entregado: "Trabajo finalizado / Entregado",
  cerrado: "Cerrado",
};

/**
 * Isotipo vectorial de taller automotriz sobrio cuando el taller no subió su logo.
 */
function LogoTallerFallback({ nombre }: { nombre: string }) {
  return (
    <div className="cmp-logo-fallback" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="cmp-logo-svg"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
      <div className="cmp-logo-fallback-info">
        <span className="cmp-logo-siglas">{nombre.slice(0, 3).toUpperCase()}</span>
        <span className="cmp-logo-rubro">SERVICIO MECÁNICO</span>
      </div>
    </div>
  );
}

export function ComprobanteOT({ ot }: { ot: DatosComprobante }) {
  const { money, fecha: fechaLarga } = useFormato();
  const { idioma } = useI18n();
  const esPresupuesto = ot.estado === "presupuesto" || ot.numero?.startsWith("PR-");

  const totalRecomendado = ot.recomendados.reduce((s, r) => s + Number(r.precio_estimado ?? 0), 0);
  const observados = ot.checklist.filter((c) => c.estado === "observado" || c.estado === "critico");

  // Próximo service sugerido (+10.000 km)
  const proximoService = ot.km_ingreso ? Number(ot.km_ingreso) + 10000 : null;

  // Modelo del vehículo
  const modeloTexto =
    [ot.vehiculo.marca, ot.vehiculo.modelo].filter(Boolean).join(" ") || "Vehículo en servicio";

  // Cliente
  const clienteNombre = ot.cliente
    ? `${ot.cliente.nombre} ${ot.cliente.apellido ?? ""}`.trim()
    : "Consumidor Final";

  // Totales
  const totalRepuestos = Number(ot.total_repuestos || 0);
  const totalManoObra = Number(ot.total_mano_obra || 0);
  const totalGeneral = Number(ot.total || 0);

  return (
    <article className="comprobante">
      {/* ───────────────────────── BARRA TÍTULO SUPERIOR ───────────────────────── */}
      <div className="cmp-barra-titulo">
        <span className="cmp-barra-tipo">
          {esPresupuesto ? "PRESUPUESTO DE SERVICIO" : "ORDEN DE TRABAJO"}
        </span>
        <span className="cmp-barra-estado">{ESTADO_LABEL[ot.estado] ?? ot.estado}</span>
      </div>

      {/* ───────────────────────── CABECERA PRINCIPAL (2 COLUMNAS) ───────────────────────── */}
      <header className="cmp-cabecera">
        {/* Columna Izquierda: Identidad y Contacto del Taller */}
        <div className="cmp-cabecera-izq">
          {ot.taller.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={ot.taller.logo_url}
              alt={`Logo ${ot.taller.nombre}`}
              className="cmp-logo"
            />
          ) : (
            <LogoTallerFallback nombre={ot.taller.nombre} />
          )}

          <div className="cmp-taller-info">
            <h1 className="cmp-taller">{ot.taller.nombre}</h1>
            {ot.taller.direccion && (
              <p className="cmp-taller-dato">
                <strong>Dirección:</strong> {ot.taller.direccion}
              </p>
            )}
            {ot.taller.telefono && (
              <p className="cmp-taller-dato">
                <strong>Contacto / WhatsApp:</strong> {formatearTelefono(ot.taller.telefono)}
              </p>
            )}
            {ot.taller.cuit && (
              <p className="cmp-taller-dato">
                <strong>CUIT:</strong> {ot.taller.cuit}
              </p>
            )}
          </div>
        </div>

        {/* Columna Derecha: Recuadro estructurado "Datos del Vehículo" */}
        <div className="cmp-cabecera-der">
          <div className="cmp-cuadro-vehiculo">
            <div className="cmp-cuadro-titulo">Datos del vehículo y orden</div>
            <div className="cmp-cuadro-grid">
              <span className="cmp-campo-label">Marca / Modelo:</span>
              <span className="cmp-campo-valor cmp-bold">{modeloTexto}</span>

              <span className="cmp-campo-label">Patente:</span>
              <span className="cmp-campo-valor cmp-patente-box">
                {formatearPatente(ot.vehiculo.patente)}
              </span>

              <span className="cmp-campo-label">Cliente:</span>
              <span className="cmp-campo-valor">{clienteNombre}</span>

              {ot.cliente?.telefono && (
                <>
                  <span className="cmp-campo-label">Teléfono:</span>
                  <span className="cmp-campo-valor">{formatearTelefono(ot.cliente.telefono)}</span>
                </>
              )}

              <span className="cmp-campo-label">Fecha entrada:</span>
              <span className="cmp-campo-valor">
                {fechaLarga(ot.fecha_ingreso, { day: "2-digit", month: "2-digit", year: "numeric" })}
              </span>

              {ot.km_ingreso != null && Number(ot.km_ingreso) > 0 && (
                <>
                  <span className="cmp-campo-label">Kilometraje:</span>
                  <span className="cmp-campo-valor tabular-nums">
                    {formatearDistancia(Number(ot.km_ingreso), idioma)}
                  </span>

                  {proximoService && (
                    <>
                      <span className="cmp-campo-label">Próximo Service:</span>
                      <span className="cmp-campo-valor tabular-nums cmp-accent-text">
                        {formatearDistancia(proximoService, idioma)}
                      </span>
                    </>
                  )}
                </>
              )}

              <span className="cmp-campo-label">N° de Trabajo:</span>
              <span className="cmp-campo-valor cmp-numero-destacado">{ot.numero}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ───────────────────────── ANOMALÍAS Y DESCARGOS DEL TALLER ───────────────────────── */}
      {(ot.anomalias.length > 0 || ot.descargos.length > 0) && (
        <section className="cmp-bloque-anomalias">
          <div className="cmp-seccion-barra">Diagnóstico y Descargo Técnico</div>
          <div className="cmp-anomalias-grid">
            {ot.anomalias.length > 0 && (
              <div className="cmp-anomalia-card">
                <span className="cmp-subseccion-label">Anomalía reportada por el cliente:</span>
                <ul className="cmp-lista-limpia">
                  {ot.anomalias.map((a, i) => (
                    <li key={i}>{a.texto}</li>
                  ))}
                </ul>
              </div>
            )}

            {ot.descargos.length > 0 && (
              <div className="cmp-descargo-card">
                <span className="cmp-subseccion-label">Descargo y trabajo del taller:</span>
                <ul className="cmp-lista-limpia">
                  {ot.descargos.map((d, i) => (
                    <li key={i}>{d.texto}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ───────────────────────── CHECKLIST DE INSPECCIÓN TÉCNICA ───────────────────────── */}
      {ot.checklist.length > 0 && (
        <section className="cmp-bloque-checklist">
          <div className="cmp-seccion-barra">
            Inspección Técnica de Seguridad &amp; Fluidos ({ot.checklist.length} puntos)
          </div>
          <div className="cmp-checklist-grid">
            {ot.checklist.map((c, i) => {
              const conf = c.estado ? ESTADO_CHECK[c.estado] : ESTADO_CHECK.no_aplica;
              return (
                <div key={i} className="cmp-check-item">
                  <span className={`cmp-check-box ${conf?.clase ?? ""}`}>
                    {conf?.icono ?? "—"}
                  </span>
                  <div className="cmp-check-cuerpo">
                    <span className="cmp-check-nombre">{c.etiqueta_snapshot}</span>
                    {c.nota && <span className="cmp-check-descargo">— {c.nota}</span>}
                  </div>
                  <span className={`cmp-check-estado-tag ${conf?.clase ?? ""}`}>
                    {conf?.texto ?? "Revisado"}
                  </span>
                </div>
              );
            })}
          </div>

          {observados.length > 0 && (
            <div className="cmp-alerta-obs">
              <strong>Atención / Puntos observados:</strong>{" "}
              {observados.map((o) => `${o.etiqueta_snapshot}${o.nota ? ` (${o.nota})` : ""}`).join("; ")}.
            </div>
          )}
        </section>
      )}

      {/* ───────────────────────── DETALLE VALORIZADO DE TRABAJOS Y REPUESTOS ───────────────────────── */}
      {ot.items.length > 0 && (
        <section className="cmp-bloque-items">
          <div className="cmp-seccion-barra">Detalle de Trabajos y Repuestos Utilizados</div>
          {BLOQUES.map((bloque) => {
            const items = ot.items.filter((i) => bloque.tipos.includes(i.tipo as never));
            if (items.length === 0) return null;
            const subtotal = items.reduce((s, i) => s + Number(i.subtotal), 0);

            return (
              <div key={bloque.titulo} className="cmp-subbloque">
                <div className="cmp-subbloque-titulo">{bloque.titulo}</div>
                <table className="cmp-tabla">
                  <thead>
                    <tr>
                      <th className="cmp-th-desc">Descripción</th>
                      <th className="cmp-th-cant">Cant.</th>
                      <th className="cmp-th-precio">P. Unitario</th>
                      <th className="cmp-th-subtotal">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="cmp-td-desc">{i.descripcion}</td>
                        <td className="cmp-td-cant">{Number(i.cantidad) > 0 ? Number(i.cantidad) : 1}</td>
                        <td className="cmp-td-precio">{money(Number(i.precio_unitario))}</td>
                        <td className="cmp-td-subtotal">{money(Number(i.subtotal))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="cmp-td-subtotal-lbl">Subtotal {bloque.titulo}</td>
                      <td className="cmp-td-subtotal-val">{money(subtotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })}
        </section>
      )}

      {/* ───────────────────────── TRABAJOS ADICIONALES SUGERIDOS ───────────────────────── */}
      {ot.recomendados.length > 0 && (
        <section className="cmp-bloque-recomendados">
          <div className="cmp-seccion-barra cmp-seccion-barra-warn">
            Trabajos Preventivos Sugeridos para Próxima Visita (No incluidos en el total)
          </div>
          <table className="cmp-tabla">
            <tbody>
              {ot.recomendados.map((r, i) => (
                <tr key={i}>
                  <td className="cmp-td-desc">{r.texto}</td>
                  <td className="cmp-td-subtotal">
                    {r.precio_estimado != null ? money(Number(r.precio_estimado)) : "A cotizar"}
                  </td>
                </tr>
              ))}
            </tbody>
            {totalRecomendado > 0 && (
              <tfoot>
                <tr>
                  <td className="cmp-td-subtotal-lbl">Presupuesto preventivo estimado:</td>
                  <td className="cmp-td-subtotal-val">{money(totalRecomendado)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </section>
      )}

      {/* ───────────────────────── OBSERVACIONES GENERALES ───────────────────────── */}
      {ot.observaciones && (
        <div className="cmp-observaciones-taller">
          <strong>Observaciones generales:</strong> {ot.observaciones}
        </div>
      )}

      {/* ───────────────────────── DESGLOSE DE VALORES ESTRUCTURADO (ESTILO DASHBOARD) ───────────────────────── */}
      <section className="cmp-bloque-totales">
        <div className="cmp-caja-monto">
          <span className="cmp-monto-label">Valor Repuestos</span>
          <span className="cmp-monto-valor">{money(totalRepuestos)}</span>
        </div>

        <div className="cmp-caja-monto">
          <span className="cmp-monto-label">Valor Mano de Obra</span>
          <span className="cmp-monto-valor">{money(totalManoObra)}</span>
        </div>

        <div className="cmp-caja-monto cmp-caja-total-final">
          <span className="cmp-monto-label">TOTAL GENERAL</span>
          <span className="cmp-monto-valor cmp-monto-total">{money(totalGeneral)}</span>
        </div>
      </section>

      {/* ───────────────────────── TÉRMINOS, GARANTÍA Y FIRMAS ───────────────────────── */}
      <footer className="cmp-pie">
        <div className="cmp-garantia-texto">
          <strong>Garantía técnica de taller:</strong> Todo trabajo de mano de obra y repuestos colocados cuenta con <strong>90 días corridos</strong> de garantía bajo uso normal. El titular autoriza las pruebas de rodaje necesarias para el diagnóstico y control de calidad.
        </div>

        <div className="cmp-firmas">
          <div className="cmp-firma-col">
            <span className="cmp-firma-linea" />
            <span className="cmp-firma-texto">Firma y Aclaración Cliente</span>
          </div>
          <div className="cmp-firma-col">
            <span className="cmp-firma-linea" />
            <span className="cmp-firma-texto">Responsable Técnico / Taller</span>
          </div>
        </div>
      </footer>
    </article>
  );
}
