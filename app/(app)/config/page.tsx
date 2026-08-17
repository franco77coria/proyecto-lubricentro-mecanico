import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { AprobarCatalogo } from "@/components/config/AprobarCatalogo";
import { AjustesIdiomaMoneda } from "@/components/config/AjustesIdiomaMoneda";
import { CatalogoServicios } from "@/components/config/CatalogoServicios";
import { DatosTaller } from "@/components/config/DatosTaller";
import { EditorChecklist } from "@/components/config/EditorChecklist";
import { GestionEquipo } from "@/components/config/GestionEquipo";
import { EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { cerrarSesion } from "@/lib/actions/auth";
import { listarPendientesCatalogo } from "@/lib/actions/catalogo-aprobacion";
import { listarServicios } from "@/lib/actions/servicios";
import { obtenerAuditoriaEquipo } from "@/lib/actions/equipo";
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
    auditoria,
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
      .select("user_id, nombre, rol, activo, vistas_permitidas")
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
    esDueno ? obtenerAuditoriaEquipo() : Promise.resolve([]),
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
            <AjustesIdiomaMoneda editable={true} />
          </div>

          <div className="entrar" style={{ "--i": 2 } as React.CSSProperties}>
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

          <div className="entrar lg:col-span-2" style={{ "--i": 5 } as React.CSSProperties}>
            <GestionEquipo
              miembros={(equipo || []) as unknown as { user_id: string; nombre: string | null; rol: string; activo: boolean; vistas_permitidas?: string[] | null }[]}
              invitaciones={invitaciones || []}
              auditoria={auditoria}
              yoSoy={sesion.user.id}
              esDueno={esDueno}
            />
          </div>
        </div>

        {/* Cerrar sesión al fondo: no es una acción frecuente pero tiene que
            estar accesible desde la configuración. */}
        <form action={cerrarSesion} className="pt-2">
          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 text-caption font-bold text-destructive hover:bg-destructive/15 transition-colors"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
