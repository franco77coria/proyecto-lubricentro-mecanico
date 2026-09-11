import { EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { exigirVista } from "@/lib/permisos";
import { obtenerReporteCompleto } from "@/lib/actions/reportes";
import { type PeriodoPredefinido } from "@/lib/reportes-fechas";
import { SelectorPeriodo } from "@/components/reportes/SelectorPeriodo";
import { PestanasReporte } from "@/components/reportes/PestanasReporte";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    periodo?: string;
    desde?: string;
    hasta?: string;
  }>;
}

export default async function Reportes(props: PageProps) {
  await exigirVista("/reportes");
  const searchParams = await props.searchParams;

  const periodoValido: PeriodoPredefinido = [
    "esta_semana",
    "semana_anterior",
    "este_mes",
    "mes_anterior",
    "ultimos_30_dias",
    "ultimos_90_dias",
    "personalizado",
  ].includes(searchParams.periodo || "")
    ? (searchParams.periodo as PeriodoPredefinido)
    : "este_mes";

  const datos = await obtenerReporteCompleto({
    periodo: periodoValido,
    desde: searchParams.desde,
    hasta: searchParams.hasta,
  });

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+var(--isla-height)+0.75rem)] pb-12 scroll-inset">
      <div className="contenedor space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <EncabezadoPantalla seccion="Reportes" titulo="Números del taller" />
            <p className="text-caption text-muted-foreground mt-0.5">
              Facturación, mano de obra, repuestos y rendimiento del equipo en fosa
            </p>
          </div>
        </div>

        {/* Filtro de Período y Selector de Fechas Moderno */}
        <SelectorPeriodo
          periodoActual={datos.periodo}
          desdeActual={datos.desde}
          hastaActual={datos.hasta}
          etiquetaActual={datos.etiquetaPeriodo}
        />

        {/* Pestañas con Desglose: Resumen, Semanas, Meses, Mecánicos y Autos */}
        <PestanasReporte datos={datos} />
      </div>
    </main>
  );
}
