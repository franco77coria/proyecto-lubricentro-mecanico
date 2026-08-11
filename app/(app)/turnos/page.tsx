import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { listarTurnos } from "@/lib/actions/turnos";
import { TarjetaTurno } from "./TarjetaTurno";

export const dynamic = "force-dynamic";

export default async function PaginaTurnos() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const hasta = new Date();
  hasta.setDate(hoy.getDate() + 15); // Próximos 15 días
  hasta.setHours(23, 59, 59, 999);

  const turnos = await listarTurnos(hoy, hasta);

  // Group turnos by date
  const turnosPorDia = turnos.reduce((acc, turno) => {
    const fecha = new Date(turno.fecha_hora);
    const formatterDia = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" });
    let label = formatterDia.format(fecha);
    
    // Convertir primera letra a mayúscula
    label = label.charAt(0).toUpperCase() + label.slice(1);
    
    const esHoy = fecha.getDate() === hoy.getDate() && fecha.getMonth() === hoy.getMonth();
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const esManana = fecha.getDate() === manana.getDate() && fecha.getMonth() === manana.getMonth();

    if (esHoy) label = `Hoy, ${label}`;
    else if (esManana) label = `Mañana, ${label}`;

    if (!acc[label]) acc[label] = [];
    acc[label].push(turno);
    return acc;
  }, {} as Record<string, typeof turnos>);

  return (
    <main className="flex-1 overflow-y-auto pt-[calc(var(--safe-top)+1.25rem)] pb-24 lg:pb-8 relative">
      <div className="contenedor-ancho space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Turnos</h1>
            <p className="text-sm text-muted-foreground">Próximos 15 días</p>
          </div>
          <Link
            href="/turnos/nuevo"
            className="hidden sm:flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm hover:brightness-110 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo turno</span>
          </Link>
        </header>

        {turnos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            <CalendarDays className="h-10 w-10 opacity-20" />
            <p>No hay turnos agendados en los próximos días.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(turnosPorDia).map(([dia, turnosDia]) => (
              <section key={dia} className="space-y-4">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-2 border-b border-border/50">
                  {dia}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {turnosDia.map((turno) => (
                    <TarjetaTurno key={turno.id} turno={turno} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* FAB para Móvil */}
      <Link
        href="/turnos/nuevo"
        className="fixed bottom-[calc(var(--safe-bottom)+5rem)] right-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 sm:hidden z-50 transition-transform active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </main>
  );
}
