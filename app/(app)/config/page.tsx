import { LogOut, User } from "lucide-react";
import { redirect } from "next/navigation";

import { DatosTaller } from "@/components/config/DatosTaller";
import { EditorChecklist } from "@/components/config/EditorChecklist";
import { EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { cerrarSesion } from "@/lib/actions/auth";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const NOMBRE_ROL: Record<string, string> = {
  dueno: "Dueño",
  mostrador: "Mostrador",
  mecanico: "Mecánico",
};

export default async function Config() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  const supabase = await crearClienteServidor();
  const esDueno = sesion.perfil.rol === "dueno";

  const [{ data: taller }, { data: plantilla }, { data: equipo }] = await Promise.all([
    supabase
      .from("taller")
      .select("nombre, cuit, direccion, telefono")
      .eq("id", sesion.perfil.taller_id)
      .single(),
    supabase
      .from("checklist_plantilla")
      .select("id, checklist_plantilla_item(id, etiqueta, categoria, orden, activo)")
      .eq("taller_id", sesion.perfil.taller_id)
      .eq("activa", true)
      .maybeSingle(),
    supabase
      .from("perfil")
      .select("user_id, nombre, rol, activo")
      .eq("taller_id", sesion.perfil.taller_id)
      .order("rol"),
  ]);

  const items = (plantilla?.checklist_plantilla_item ?? [])
    .filter((i) => i.activo)
    .sort((a, b) => a.orden - b.orden)
    .map((i) => ({ id: i.id, etiqueta: i.etiqueta, categoria: i.categoria }));

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-5">
        <EncabezadoPantalla seccion="Configuración" titulo="Ajustes" />

        {!esDueno && (
          <p className="entrar rounded-[var(--radius-sm)] bg-muted px-3.5 py-2.5 text-caption text-muted-foreground">
            Estos datos los edita el dueño del taller. Vos podés verlos.
          </p>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="entrar" style={{ "--i": 1 } as React.CSSProperties}>
            {taller && <DatosTaller taller={taller} editable={esDueno} />}
          </div>

          <div className="entrar" style={{ "--i": 2 } as React.CSSProperties}>
            {plantilla ? (
              <EditorChecklist plantillaId={plantilla.id} items={items} editable={esDueno} />
            ) : (
              <section className="tarjeta p-4">
                <h2 className="t-seccion">Checklist de inspección</h2>
                <p className="mt-2 text-caption text-muted-foreground">
                  Este taller todavía no tiene una plantilla de checklist.
                </p>
              </section>
            )}
          </div>

          <section className="tarjeta entrar space-y-3 p-4" style={{ "--i": 3 } as React.CSSProperties}>
            <div>
              <h2 className="t-seccion">Equipo</h2>
              <p className="mt-1 text-caption text-muted-foreground">
                Quiénes tienen acceso a este taller.
              </p>
            </div>
            <ul className="divide-y divide-border">
              {(equipo ?? []).map((p) => (
                <li key={p.user_id} className="flex items-center gap-2.5 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <User className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {p.nombre || "Sin nombre"}
                      {p.user_id === sesion.user.id && (
                        <span className="ml-1.5 text-caption font-normal text-muted-foreground">(vos)</span>
                      )}
                    </span>
                    <span className="block text-caption text-muted-foreground">
                      {NOMBRE_ROL[p.rol] ?? p.rol}
                      {!p.activo && " · inactivo"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {esDueno && (
              <p className="text-caption text-muted-foreground">
                Para sumar gente al taller falta la pantalla de invitaciones.
              </p>
            )}
          </section>

          <section className="tarjeta entrar space-y-3 p-4" style={{ "--i": 4 } as React.CSSProperties}>
            <h2 className="t-seccion">Sesión</h2>
            <p className="text-caption text-muted-foreground">
              Entraste como {sesion.user.email}.
            </p>
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-muted px-4 text-sm font-medium text-foreground transition-colors hover:text-destructive"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Cerrar sesión
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
