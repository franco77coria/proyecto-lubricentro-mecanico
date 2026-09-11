"use client";

import { formatearDistancia } from "@/lib/i18n";
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
  vehiculo: { patente: string; marca?: string | null; modelo?: string | null; anio?: number | null; color?: string | null };
  cliente?: { nombre: string; apellido?: string | null; telefono?: string | null } | null;
  items: ItemComprobante[];
  checklist: ChecklistComprobante[];
  anomalias: NotaComprobante[];
  descargos: NotaComprobante[];
  recomendados: NotaComprobante[];
}

const BLOQUES = [
  { titulo: "Mano de obra", tipos: ["mano_obra", "servicio"] },
  { titulo: "Repuestos y materiales", tipos: ["repuesto", "insumo", "tercero"] },
] as const;

const ESTADO_CHECK: Record<string, { texto: string; clase: string }> = {
  ok: { texto: "OK", clase: "estado-ok" },
  observado: { texto: "Observado", clase: "estado-observado" },
  critico: { texto: "Urgente", clase: "estado-critico" },
  no_aplica: { texto: "N/A", clase: "estado-na" },
};

const ESTADO_LABEL: Record<string, string> = {
  presupuesto: "Presupuesto",
  aprobado: "Aprobado",
  recibido: "Recibido",
  en_trabajo: "En Trabajo",
  esperando_repuesto: "Esperando repuesto",
  listo: "Listo para entregar",
  entregado: "Entregado",
  cerrado: "Cerrado",
};

export function ComprobanteOT({
  ot,
}: {
  ot: DatosComprobante;
  modo?: "a4";
}) {
  const { money, fecha: fechaLarga } = useFormato();
  const { idioma } = useI18n();
  const totalRecomendado = ot.recomendados.reduce((s, r) => s + Number(r.precio_estimado ?? 0), 0);
  const observados = ot.checklist.filter((c) => c.estado === "observado" || c.estado === "critico");
  const esPresupuesto = ot.estado === "presupuesto";

  return (
    <article className="comprobante">
      {/* ───────────────────────── CABECERA ───────────────────────── */}
      <header className="cmp-cabecera">
        <div className="cmp-cabecera-izq">
          {ot.taller.logo_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={ot.taller.logo_url}
              alt={`Logo ${ot.taller.nombre}`}
              className="cmp-logo"
            />
          )}
          <div>
            <h1 className="cmp-taller">{ot.taller.nombre}</h1>
            {(ot.taller.direccion || ot.taller.telefono) && (
              <p className="cmp-taller-datos">
                {[ot.taller.direccion, ot.taller.telefono ? formatearTelefono(ot.taller.telefono) : null]
                  .filter(Boolean)
                  .join("  ·  ")}
              </p>
            )}
            {ot.taller.cuit && <p className="cmp-taller-datos">CUIT {ot.taller.cuit}</p>}
          </div>
        </div>

        <div className="cmp-numero-caja">
          <span className="cmp-doc-tipo">
            {esPresupuesto ? "Presupuesto" : "Orden de Trabajo"}
          </span>
          <span className="cmp-numero">{ot.numero}</span>
          <span className="cmp-fecha">
            {fechaLarga(ot.fecha_ingreso, { day: "2-digit", month: "long", year: "numeric" })}
          </span>
          <span className="cmp-estado-badge">{ESTADO_LABEL[ot.estado] ?? ot.estado}</span>
        </div>
      </header>

      {/* ───────────────────────── DATOS PRINCIPALES ───────────────────────── */}
      <section className="cmp-grid-3">
        {/* Vehículo */}
        <div className="cmp-caja">
          <span className="cmp-etiqueta">Vehículo</span>
          <span className="cmp-patente">{formatearPatente(ot.vehiculo.patente)}</span>
          <span className="cmp-dato-fuerte">
            {[ot.vehiculo.marca, ot.vehiculo.modelo].filter(Boolean).join(" ") || "Sin datos de modelo"}
          </span>
          <span className="cmp-dato-tenue">
            {[
              ot.vehiculo.anio ? String(ot.vehiculo.anio) : null,
              ot.vehiculo.color,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {ot.km_ingreso != null && (
            <span className="cmp-dato-tenue">{formatearDistancia(ot.km_ingreso, idioma)} de ingreso</span>
          )}
        </div>

        {/* Cliente */}
        <div className="cmp-caja">
          <span className="cmp-etiqueta">Cliente</span>
          <span className="cmp-dato-fuerte">
            {ot.cliente ? `${ot.cliente.nombre} ${ot.cliente.apellido ?? ""}`.trim() : "Consumidor Final"}
          </span>
          {ot.cliente?.telefono && (
            <span className="cmp-dato-tenue">{formatearTelefono(ot.cliente.telefono)}</span>
          )}
        </div>

        {/* Resumen económico */}
        <div className="cmp-caja cmp-caja-total">
          <span className="cmp-etiqueta">Resumen</span>
          <div className="cmp-resumen-fila">
            <span>Mano de obra</span>
            <span>{money(Number(ot.total_mano_obra))}</span>
          </div>
          <div className="cmp-resumen-fila">
            <span>Repuestos</span>
            <span>{money(Number(ot.total_repuestos))}</span>
          </div>
          <div className="cmp-resumen-total-fila">
            <span>TOTAL</span>
            <span>{money(Number(ot.total))}</span>
          </div>
        </div>
      </section>

      {/* ───────────────────────── DIAGNÓSTICO DEL CLIENTE ───────────────────────── */}
      {ot.anomalias.length > 0 && (
        <section className="cmp-bloque">
          <h2 className="cmp-titulo">Lo que nos comentó</h2>
          <ul className="cmp-lista">
            {ot.anomalias.map((a, i) => (
              <li key={i}>{a.texto}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ───────────────────────── DIAGNÓSTICO DEL TALLER ───────────────────────── */}
      {ot.descargos.length > 0 && (
        <section className="cmp-bloque">
          <h2 className="cmp-titulo">Lo que encontramos</h2>
          <ul className="cmp-lista">
            {ot.descargos.map((d, i) => (
              <li key={i}>{d.texto}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ───────────────────────── DETALLE VALORIZADO ───────────────────────── */}
      <section className="cmp-bloque">
        <h2 className="cmp-titulo">Detalle de trabajos y materiales</h2>

        {BLOQUES.map((bloque) => {
          const items = ot.items.filter((i) => bloque.tipos.includes(i.tipo as never));
          if (items.length === 0) return null;
          const subtotal = items.reduce((s, i) => s + Number(i.subtotal), 0);

          return (
            <div key={bloque.titulo} className="cmp-bloque-items">
              <div className="cmp-subtitulo">{bloque.titulo}</div>
              <table className="cmp-tabla">
                <thead>
                  <tr>
                    <th className="cmp-th-desc">Descripción</th>
                    <th className="cmp-th-cant">Cant.</th>
                    <th className="cmp-th-precio">P. Unit.</th>
                    <th className="cmp-th-precio">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="cmp-td-desc">{i.descripcion}</td>
                      <td className="cmp-td-cant">
                        {Number(i.cantidad) !== 1 ? Number(i.cantidad) : "—"}
                      </td>
                      <td className="cmp-td-precio">{money(Number(i.precio_unitario))}</td>
                      <td className="cmp-td-precio cmp-td-bold">{money(Number(i.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="cmp-td-subtotal-label">
                      Subtotal {bloque.titulo.toLowerCase()}
                    </td>
                    <td className="cmp-td-subtotal">{money(subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })}

        {ot.items.length === 0 && <p className="cmp-vacio">Sin ítems cargados.</p>}

        <div className="cmp-total">
          <span>Total</span>
          <span className="cmp-total-valor">{money(Number(ot.total))}</span>
        </div>
      </section>

      {/* ───────────────────────── PRESUPUESTO SUGERIDO ───────────────────────── */}
      {ot.recomendados.length > 0 && (
        <section className="cmp-bloque cmp-recomendado">
          <h2 className="cmp-titulo">Trabajos adicionales sugeridos (no incluidos)</h2>
          <p className="cmp-nota-bloque">
            Detectamos los siguientes trabajos que <strong>no están incluidos</strong> en el total de arriba.
          </p>
          <table className="cmp-tabla">
            <tbody>
              {ot.recomendados.map((r, i) => (
                <tr key={i}>
                  <td className="cmp-td-desc">{r.texto}</td>
                  <td className="cmp-td-precio">
                    {r.precio_estimado != null ? money(Number(r.precio_estimado)) : "A confirmar"}
                  </td>
                </tr>
              ))}
            </tbody>
            {totalRecomendado > 0 && (
              <tfoot>
                <tr>
                  <td className="cmp-td-subtotal-label">Total presupuestado</td>
                  <td className="cmp-td-subtotal">{money(totalRecomendado)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </section>
      )}

      {/* ───────────────────────── CHECKLIST DE INSPECCIÓN ───────────────────────── */}
      {ot.checklist.length > 0 && (
        <section className="cmp-bloque">
          <h2 className="cmp-titulo">
            Inspección de seguridad — {ot.checklist.length} puntos
          </h2>
          <div className="cmp-checklist">
            {ot.checklist.map((c, i) => (
              <div key={i} className="cmp-check">
                <span
                  className={`cmp-punto ${
                    c.estado ? (ESTADO_CHECK[c.estado]?.clase ?? "") : "estado-pendiente"
                  }`}
                />
                <span className="cmp-check-texto">{c.etiqueta_snapshot}</span>
                <span className={`cmp-check-estado ${c.estado === "critico" ? "cmp-check-critico" : c.estado === "observado" ? "cmp-check-obs" : ""}`}>
                  {c.estado ? ESTADO_CHECK[c.estado]?.texto : "Pend."}
                </span>
              </div>
            ))}
          </div>

          {observados.length > 0 && (
            <div className="cmp-observaciones-caja">
              <span className="cmp-etiqueta" style={{ margin: "2mm 0 1.5mm" }}>
                Ítems observados — requieren atención
              </span>
              <ul className="cmp-lista cmp-observaciones">
                {observados.map((o, i) => (
                  <li key={i}>
                    <strong>{o.etiqueta_snapshot}:</strong>{" "}
                    {o.nota || "Requiere intervención mecánica"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ───────────────────────── OBSERVACIONES ───────────────────────── */}
      {ot.observaciones && (
        <section className="cmp-bloque">
          <h2 className="cmp-titulo">Observaciones del taller</h2>
          <p className="cmp-parrafo">{ot.observaciones}</p>
        </section>
      )}

      {/* ───────────────────────── CONSTANCIAS LEGALES ───────────────────────── */}
      <section className="cmp-descargo-legal">
        <div className="cmp-descargo-grid">
          <div>
            <span className="cmp-descargo-titulo">Garantía y Condiciones</span>
            <p className="cmp-descargo-texto">
              Todo trabajo de mano de obra y repuestos provistos por el taller cuenta con <strong>90 días corridos</strong> de garantía legal bajo condiciones normales de uso.
              El taller no se responsabiliza por objetos de valor no declarados al ingreso del vehículo.
              El titular autoriza la realización de pruebas de rodaje para diagnóstico y control de calidad.
            </p>
          </div>
          <div className="cmp-descargo-firma-caja">
            <div className="cmp-firma-mini">
              <span className="cmp-firma-linea" />
              <span className="cmp-firma-label">Firma cliente</span>
            </div>
            <div className="cmp-firma-mini">
              <span className="cmp-firma-linea" />
              <span className="cmp-firma-label">Responsable técnico</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── PIE LEGAL ───────────────────────── */}
      <p className="cmp-legal">
        Comprobante técnico sobre dominio {formatearPatente(ot.vehiculo.patente)} · {ot.taller.nombre} · Conservar como constancia de servicio.
      </p>
    </article>
  );
}
