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
  taller: { nombre: string; direccion?: string | null; telefono?: string | null; cuit?: string | null };
  vehiculo: { patente: string; marca?: string | null; modelo?: string | null; anio?: number | null; color?: string | null };
  cliente?: { nombre: string; apellido?: string | null; telefono?: string | null } | null;
  items: ItemComprobante[];
  checklist: ChecklistComprobante[];
  anomalias: NotaComprobante[];
  descargos: NotaComprobante[];
  recomendados: NotaComprobante[];
}

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);

const fechaLarga = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso));

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
export function ComprobanteOT({ ot }: { ot: DatosComprobante }) {
  const totalRecomendado = ot.recomendados.reduce((s, r) => s + Number(r.precio_estimado ?? 0), 0);
  const hayChecklist = ot.checklist.some((c) => c.estado);
  const observados = ot.checklist.filter((c) => c.estado === "observado" || c.estado === "critico");

  return (
    <article className="comprobante">
      <header className="cmp-cabecera">
        <div>
          <h1 className="cmp-taller">{ot.taller.nombre}</h1>
          <p className="cmp-taller-datos">
            {[ot.taller.direccion, ot.taller.telefono ? formatearTelefono(ot.taller.telefono) : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {ot.taller.cuit && <p className="cmp-taller-datos">CUIT {ot.taller.cuit}</p>}
        </div>
        <div className="cmp-numero-caja">
          <span className="cmp-etiqueta">
            {ot.estado === "presupuesto" ? "Presupuesto" : "Orden de trabajo"}
          </span>
          <span className="cmp-numero">{ot.numero}</span>
          <span className="cmp-fecha">{fechaLarga(ot.fecha_ingreso)}</span>
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
              ot.km_ingreso != null ? `${ot.km_ingreso.toLocaleString("es-AR")} km` : null,
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

      {/* --- Inspección --- */}
      {hayChecklist && (
        <section className="cmp-bloque">
          <h2 className="cmp-titulo">Inspección</h2>
          <div className="cmp-checklist">
            {ot.checklist
              .filter((c) => c.estado)
              .map((c, i) => (
                <div key={i} className="cmp-check">
                  <span className={`cmp-punto ${ESTADO_CHECK[c.estado!]?.clase ?? ""}`} />
                  <span className="cmp-check-texto">{c.etiqueta_snapshot}</span>
                  <span className="cmp-check-estado">{ESTADO_CHECK[c.estado!]?.texto}</span>
                </div>
              ))}
          </div>
          {observados.length > 0 && (
            <ul className="cmp-lista cmp-observaciones">
              {observados
                .filter((o) => o.nota)
                .map((o, i) => (
                  <li key={i}>
                    <strong>{o.etiqueta_snapshot}:</strong> {o.nota}
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}

      {ot.observaciones && (
        <section className="cmp-bloque">
          <h2 className="cmp-titulo">Observaciones</h2>
          <p className="cmp-parrafo">{ot.observaciones}</p>
        </section>
      )}

      <footer className="cmp-pie">
        <div className="cmp-firma">
          <span className="cmp-firma-linea" />
          <span className="cmp-firma-label">Firma del cliente</span>
        </div>
        <div className="cmp-firma">
          <span className="cmp-firma-linea" />
          <span className="cmp-firma-label">Por {ot.taller.nombre}</span>
        </div>
      </footer>

      <p className="cmp-legal">
        Este comprobante detalla los trabajos realizados sobre el vehículo{" "}
        {formatearPatente(ot.vehiculo.patente)} y su valor. Conservalo para futuros servicios.
      </p>
    </article>
  );
}
