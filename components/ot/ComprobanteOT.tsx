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

/* El comprobante se lo lleva el cliente en la mano: los importes y la fecha
   salen del idioma y la moneda del taller, no de "es-AR"/"ARS" fijos. */

/** Los tipos de ítem se agrupan en dos bloques con subtotal propio: es lo que
 *  el cliente quiere saber, cuánto es trabajo y cuánto es material. */
const BLOQUES = [
  { titulo: "Mano de obra", tipos: ["mano_obra", "servicio"] },
  { titulo: "Repuestos y materiales", tipos: ["repuesto", "insumo", "tercero"] },
] as const;

const ESTADO_CHECK: Record<string, { texto: string; clase: string }> = {
  ok: { texto: "Correcto", clase: "estado-ok" },
  observado: { texto: "A revisar", clase: "estado-observado" },
  critico: { texto: "Urgente", clase: "estado-critico" },
  no_aplica: { texto: "No aplica", clase: "estado-na" },
};

/**
 * Comprobante de la orden de trabajo.
 *
 * Es lo que se lleva el cliente, así que está pensado para leerse sin conocer
 * el sistema: primero qué auto es, después qué se hizo y por último cuánto
 * costó, con el trabajo separado de los materiales.
 *
 * Se imprime con el diálogo del navegador en lugar de generar un PDF con una
 * librería: sale el mismo archivo, en el celular aparece "Guardar como PDF" y
 * evita sumar medio megabyte de dependencia al bundle.
 */
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

  return (
    <article className="comprobante">
      <header className="cmp-cabecera">
        <div className="cmp-cabecera-datos">
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
            <p className="cmp-taller-datos">
              {[ot.taller.direccion, ot.taller.telefono ? formatearTelefono(ot.taller.telefono) : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {ot.taller.cuit && <p className="cmp-taller-datos">CUIT {ot.taller.cuit}</p>}
          </div>
        </div>
        <div className="cmp-numero-caja">
          <span className="cmp-etiqueta">
            {ot.estado === "presupuesto" ? "Presupuesto" : "Orden de trabajo"}
          </span>
          <span className="cmp-numero">{ot.numero}</span>
          <span className="cmp-fecha">{fechaLarga(ot.fecha_ingreso, { day: "2-digit", month: "long", year: "numeric" })}</span>
        </div>
      </header>

      <section className="cmp-grid-2">
        <div className="cmp-caja">
          <span className="cmp-etiqueta">Vehículo</span>
          <span className="cmp-patente">{formatearPatente(ot.vehiculo.patente)}</span>
          <span className="cmp-dato">
            {[ot.vehiculo.marca, ot.vehiculo.modelo, ot.vehiculo.anio].filter(Boolean).join(" ") ||
              "Sin datos de modelo"}
          </span>
          <span className="cmp-dato-tenue">
            {[
              ot.vehiculo.color,
              ot.km_ingreso != null ? formatearDistancia(ot.km_ingreso, idioma) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>

        <div className="cmp-caja">
          <span className="cmp-etiqueta">Cliente</span>
          <span className="cmp-dato-fuerte">
            {ot.cliente ? `${ot.cliente.nombre} ${ot.cliente.apellido ?? ""}`.trim() : "Sin asignar"}
          </span>
          {ot.cliente?.telefono && (
            <span className="cmp-dato-tenue">{formatearTelefono(ot.cliente.telefono)}</span>
          )}
        </div>
      </section>

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

      {/* --- Detalle valorizado, con subtotal por bloque --- */}
      <section className="cmp-bloque">
        <h2 className="cmp-titulo">Detalle</h2>

        {BLOQUES.map((bloque) => {
          const items = ot.items.filter((i) => bloque.tipos.includes(i.tipo as never));
          if (items.length === 0) return null;
          const subtotal = items.reduce((s, i) => s + Number(i.subtotal), 0);

          return (
            <div key={bloque.titulo} className="cmp-bloque-items">
              <div className="cmp-subtitulo">{bloque.titulo}</div>
              <table className="cmp-tabla">
                <tbody>
                  {items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="cmp-td-desc">{i.descripcion}</td>
                      <td className="cmp-td-cant">
                        {Number(i.cantidad) !== 1 ? `${Number(i.cantidad)} ×` : ""}
                      </td>
                      <td className="cmp-td-precio">{money(Number(i.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="cmp-td-subtotal-label">
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

      {/* --- Presupuesto de lo no autorizado --- */}
      {ot.recomendados.length > 0 && (
        <section className="cmp-bloque cmp-recomendado">
          <h2 className="cmp-titulo">Presupuesto sugerido</h2>
          <p className="cmp-nota-bloque">
            Trabajos que detectamos y que <strong>no están incluidos</strong> en el total de arriba.
          </p>
          <table className="cmp-tabla">
            <tbody>
              {ot.recomendados.map((r, i) => (
                <tr key={i}>
                  <td className="cmp-td-desc" colSpan={2}>
                    {r.texto}
                  </td>
                  <td className="cmp-td-precio">
                    {r.precio_estimado != null ? money(Number(r.precio_estimado)) : "A confirmar"}
                  </td>
                </tr>
              ))}
            </tbody>
            {totalRecomendado > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={2} className="cmp-td-subtotal-label">
                    Total presupuestado
                  </td>
                  <td className="cmp-td-subtotal">{money(totalRecomendado)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </section>
      )}

      {/* --- Inspección Pericial de Seguridad (Checklist) --- */}
      {ot.checklist.length > 0 && (
        <section className="cmp-bloque">
          <h2 className="cmp-titulo">
            Inspección Pericial de Seguridad ({ot.checklist.length} Puntos)
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
                <span className="cmp-check-estado">
                  {c.estado ? ESTADO_CHECK[c.estado]?.texto : "[ Pendiente ]"}
                </span>
              </div>
            ))}
          </div>
          {observados.length > 0 && (
            <div className="cmp-observaciones-caja">
              <span className="cmp-etiqueta" style={{ margin: "2mm 0 1mm" }}>
                Anomalías observadas en fosa / Pendientes de reparación
              </span>
              <ul className="cmp-lista cmp-observaciones">
                {observados.map((o, i) => (
                  <li key={i}>
                    <strong>{o.etiqueta_snapshot}:</strong> {o.nota || "Requiere intervención mecánica"}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="cmp-diagnostico-lineas">
            <span className="cmp-etiqueta">Anotaciones Técnicas / Diagnóstico de Fosa</span>
            <div className="cmp-linea-punteada" />
            <div className="cmp-linea-punteada" />
          </div>
        </section>
      )}

      {ot.observaciones && (
        <section className="cmp-bloque">
          <h2 className="cmp-titulo">Observaciones</h2>
          <p className="cmp-parrafo">{ot.observaciones}</p>
        </section>
      )}

      <div className="cmp-qr-box">
        <p className="cmp-etiqueta" style={{ textAlign: "center", marginBottom: "1mm" }}>
          Seguimiento en Vivo
        </p>
        <p style={{ fontSize: "8pt", textAlign: "center", margin: 0, color: "var(--cmp-tinta)" }}>
          Consultá el avance y fotos de tu vehículo desde tu celular:
        </p>
        <p style={{ fontSize: "9pt", fontWeight: "bold", textAlign: "center", margin: "1mm 0 0", color: "var(--cmp-acento)" }}>
          /seguimiento/{ot.vehiculo.patente}
        </p>
      </div>

      {/* --- Descargo Técnico y Garantía del Taller --- */}
      <section className="cmp-descargo-legal">
        <span className="cmp-descargo-titulo">Constancia de Recepción, Garantía y Descargo Técnico</span>
        <p className="cmp-descargo-texto">
          1. <strong>Custodia de Bienes:</strong> El taller no se responsabiliza por dinero, herramientas ni objetos de valor que no hayan sido formalmente declarados e inventariados al momento de la recepción del vehículo.
          <br />
          2. <strong>Pruebas de Rodaje:</strong> El titular/cliente autoriza expresamente la realización de pruebas dinámicas de rodaje en vía pública para diagnóstico preventivo y control de calidad post-reparación.
          <br />
          3. <strong>Garantía Oficial:</strong> Todo trabajo de mano de obra y repuestos provistos por el taller cuenta con 90 días corridos de garantía legal bajo condiciones normales de uso.
        </p>
      </section>

      <footer className="cmp-pie">
        <div className="cmp-firma">
          <span className="cmp-firma-linea" />
          <span className="cmp-firma-label">Firma del cliente / Titular</span>
        </div>
        <div className="cmp-firma">
          <span className="cmp-firma-linea" />
          <span className="cmp-firma-label">Responsable Técnico · {ot.taller.nombre}</span>
        </div>
      </footer>

      <p className="cmp-legal">
        Comprobante técnico y comercial sobre dominio {formatearPatente(ot.vehiculo.patente)}. Conservar este ejemplar como constancia de servicio y garantía.
      </p>
    </article>
  );
}
