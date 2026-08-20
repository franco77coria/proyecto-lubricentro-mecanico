import { Truck } from "lucide-react";

import { DetalleRemito } from "@/components/compras/DetalleRemito";
import { FormCompra } from "@/components/compras/FormCompra";
import { EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { listarProveedores } from "@/lib/actions/compras";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirVista } from "@/lib/permisos";
import { obtenerAjustesTaller } from "@/lib/taller";
import { formatearFecha, formatearMoneda } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/* El formato de plata y de fecha sale del taller. */



export default async function PaginaCompras() {
  const sesion = await exigirVista("/compras");
  const { idioma, moneda } = await obtenerAjustesTaller();
  const money = (n: number) => formatearMoneda(n, moneda, idioma);
  // El mediodía evita que la fecha se corra un día al interpretarla: una
  // fecha suelta "YYYY-MM-DD" se parsea como medianoche UTC (lección #80).
  const fechaCorta = (iso: string) =>
    formatearFecha(`${iso}T12:00:00`, idioma, { day: "2-digit", month: "short" });
  // Las compras son costos: el mecánico no las ve, igual que caja y reportes.

  const supabase = await crearClienteServidor();

  const [{ data: compras }, proveedores, { data: productos }] = await Promise.all([
    supabase
      .from("compra")
      .select("id, fecha, comprobante, total, proveedor:proveedor_id(nombre)")
      .eq("taller_id", sesion.perfil.taller_id)
      .order("fecha", { ascending: false })
      .limit(60),
    listarProveedores(),
    supabase
      .from("producto")
      .select("id, nombre, unidad, stock")
      .eq("taller_id", sesion.perfil.taller_id)
      .eq("activo", true)
      .order("nombre", { ascending: true })
      .limit(500),
  ]);

  const lista = compras ?? [];
  // El mecánico ya salió por el redirect de arriba, así que todo el que llega
  // acá puede corregir. El prop existe igual para que el componente no tenga
  // que dar por sentado quién lo está usando.
  const puedeCorregir = true;
  const productosOpcion = (productos ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    unidad: p.unidad,
    stock: Number(p.stock ?? 0),
  }));

  const totalMes = lista
    .filter((c) => c.fecha >= new Date().toISOString().slice(0, 7) + "-01")
    .reduce((acc, c) => acc + Number(c.total ?? 0), 0);

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-5">
        <EncabezadoPantalla
          seccion="Proveedores"
          titulo="Compras"
          accion={
            <FormCompra
              proveedores={proveedores}
              productos={productosOpcion}
              tallerId={sesion.perfil.taller_id}
            />
          }
        />

        {totalMes > 0 && (
          <p
            className="entrar rounded-[var(--radius-sm)] bg-muted px-3.5 py-2.5 text-sm text-foreground"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            Comprado este mes: <strong className="tabular">{money(totalMes)}</strong>
          </p>
        )}

        {lista.length === 0 ? (
          <div className="tarjeta entrar flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-suave text-accent">
              <Truck className="h-6 w-6" aria-hidden />
            </span>
            <p className="max-w-sm text-sm text-muted-foreground">
              Todavía no hay remitos cargados. Al cargarlos, el stock sube solo y el
              costo real queda registrado — es lo que hace que el margen de los
              reportes sea verdadero y no una estimación.
            </p>
          </div>
        ) : (
          <ul className="grid gap-2.5 lg:grid-cols-2">
            {lista.map((c, i) => (
              <li
                key={c.id}
                className="tarjeta entrar p-3.5"
                style={{ "--i": i + 2 } as React.CSSProperties}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-muted text-muted-foreground">
                    <Truck className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {c.proveedor?.nombre ?? "Proveedor sin especificar"}
                    </span>
                    <span className="block truncate text-caption text-muted-foreground">
                      {fechaCorta(c.fecha)}
                      {c.comprobante ? ` · ${c.comprobante}` : ""}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-sm font-bold text-foreground">
                    {money(Number(c.total ?? 0))}
                  </span>
                </div>

                <DetalleRemito
                  compraId={c.id}
                  comprobante={c.comprobante}
                  puedeCorregir={puedeCorregir}
                  tallerId={sesion.perfil.taller_id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
