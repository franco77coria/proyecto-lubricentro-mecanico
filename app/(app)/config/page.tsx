import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { AprobarCatalogo } from "@/components/config/AprobarCatalogo";
import { CatalogoServicios } from "@/components/config/CatalogoServicios";
import { DatosTaller } from "@/components/config/DatosTaller";
import { EditorChecklist } from "@/components/config/EditorChecklist";
import { GestionEquipo } from "@/components/config/GestionEquipo";
import { EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { cerrarSesion } from "@/lib/actions/auth";
import { listarPendientesCatalogo } from "@/lib/actions/catalogo-aprobacion";
import { listarServicios } from "@/lib/actions/servicios";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Config() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  const supabase = await crearClienteServidor();
  const esDueno = sesion.perfil.rol === "dueno";

  const [
    { data: taller },
    { data: plantilla },
    { data: equipo },
    { data: invitaciones },
    servicios,
    pendientesCatalogo,
  ] = await Promise.all([
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
    supabase
      .from("invitacion")
      .select("id, email, rol, token, expira_en")
      .eq("taller_id", sesion.perfil.taller_id)
      .is("aceptada_en", null)
      .gt("expira_en", new Date().toISOString())
      .order("creado_en", { ascending: false }),
    listarServicios(),
    listarPendientesCatalogo(),
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

          <div className="entrar" style={{ "--i": 3 } as React.CSSProperties}>
            <CatalogoServicios servicios={servicios} editable={esDueno} />
          </div>

          {/* Solo aparece si hay algo por revisar: el componente devuelve null
              cuando la lista está vacía. */}
          <div className="entrar" style={{ "--i": 4 } as React.CSSProperties}>
            <AprobarCatalogo pendientes={pendientesCatalogo} editable={esDueno} />
          </div>

          <div className="entrar" style={{ "--i": 4 } as React.CSSProperties}>
            <GestionEquipo
              miembros={equipo ?? []}
              invitaciones={invitaciones ?? []}
              yoSoy={sesion.user.id}
              esDueno={esDueno}
            />
          </div>

          <section className="tarjeta entrar space-y-3 p-4" style={{ "--i": 5 } as React.CSSProperties}>
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
