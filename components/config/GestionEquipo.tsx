"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Trash2, UserPlus, X } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { cambiarRolMiembro, cancelarInvitacion, invitarAlTaller } from "@/lib/actions/equipo";

export interface Miembro {
  user_id: string;
  nombre: string | null;
  rol: string;
  activo: boolean;
}

export interface Invitacion {
  id: string;
  email: string;
  rol: string;
  token: string;
  expira_en: string;
}

const ROLES = [
  { v: "mecanico", t: "Mecánico", d: "Ve sus órdenes y carga el trabajo. No ve precios." },
  { v: "mostrador", t: "Mostrador", d: "Crea órdenes y cobra. No ve costos ni reportes." },
  { v: "dueno", t: "Dueño", d: "Acceso total, incluidos costos y reportes." },
] as const;

const NOMBRE_ROL: Record<string, string> = {
  dueno: "Dueño",
  mostrador: "Mostrador",
  mecanico: "Mecánico",
};

/**
 * Equipo del taller.
 *
 * El link de invitación se muestra para copiar y mandar por WhatsApp en lugar
 * de enviarse por email: el taller ya se comunica con sus empleados por ahí, y
 * evita depender de que el mail no caiga en spam.
 */
export function GestionEquipo({
  miembros,
  invitaciones,
  yoSoy,
  esDueno,
}: {
  miembros: Miembro[];
  invitaciones: Invitacion[];
  yoSoy: string;
  esDueno: boolean;
}) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<"dueno" | "mostrador" | "mecanico">("mecanico");
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  function invitar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    iniciar(async () => {
      const res = await invitarAlTaller({ email, rol });
      if (res.error) return setError(res.error);
      setEmail("");
      setAbierto(false);
      notificar({ tipo: "exito", mensaje: "Invitación creada. Copiá el link y mandáselo." });
      router.refresh();
    });
  }

  async function copiarLink(token: string) {
    const url = `${window.location.origin}/invitacion/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(token);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      notificar({ tipo: "error", mensaje: "No se pudo copiar. Copialo a mano del navegador." });
    }
  }

  return (
    <section className="tarjeta space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="t-seccion">Equipo</h2>
          <p className="mt-1 text-caption text-muted-foreground">
            Quiénes tienen acceso a este taller y con qué permisos.
          </p>
        </div>
        {esDueno && (
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-3 text-caption font-semibold text-accent-foreground transition-transform active:scale-[0.98]"
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            Invitar
          </button>
        )}
      </div>

      <ul className="divide-y divide-border">
        {miembros.map((m) => (
          <li key={m.user_id} className="flex items-center gap-2.5 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-foreground">
              {(m.nombre || "?").slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {m.nombre || "Sin nombre"}
                {m.user_id === yoSoy && (
                  <span className="ml-1.5 text-caption font-normal text-muted-foreground">(vos)</span>
                )}
              </span>
              <span className="block text-caption text-muted-foreground">
                {NOMBRE_ROL[m.rol] ?? m.rol}
                {!m.activo && " · sin acceso"}
              </span>
            </span>

            {esDueno && (
              <select
                value={m.rol}
                disabled={pendiente}
                onChange={(e) =>
                  iniciar(async () => {
                    const res = await cambiarRolMiembro(
                      m.user_id,
                      e.target.value as "dueno" | "mostrador" | "mecanico",
                    );
                    if (res.error) notificar({ tipo: "error", mensaje: res.error });
                    router.refresh();
                  })
                }
                aria-label={`Rol de ${m.nombre || "este usuario"}`}
                className="min-h-10 shrink-0 rounded-[var(--radius-sm)] border border-border bg-card px-2 text-caption font-medium text-foreground outline-none focus:border-accent"
              >
                {ROLES.map((r) => (
                  <option key={r.v} value={r.v}>
                    {r.t}
                  </option>
                ))}
              </select>
            )}
          </li>
        ))}
      </ul>

      {invitaciones.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <h3 className="text-caption font-semibold text-muted-foreground">
            Invitaciones pendientes
          </h3>
          <ul className="space-y-1.5">
            {invitaciones.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-muted px-3 py-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{inv.email}</span>
                  <span className="block text-caption text-muted-foreground">
                    {NOMBRE_ROL[inv.rol]} · vence el{" "}
                    {new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(
                      new Date(inv.expira_en),
                    )}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => copiarLink(inv.token)}
                  aria-label="Copiar link de invitación"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-accent"
                >
                  {copiado === inv.token ? (
                    <Check className="h-4 w-4 text-estado-ok" aria-hidden />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                  )}
                </button>

                {esDueno && (
                  <button
                    type="button"
                    onClick={() =>
                      iniciar(async () => {
                        await cancelarInvitacion(inv.id);
                        router.refresh();
                      })
                    }
                    aria-label="Cancelar invitación"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Invitar al taller"
        >
          <div className="w-full rounded-t-[var(--radius-lg)] bg-card p-5 pb-[calc(var(--safe-bottom)+1.25rem)] shadow-[var(--sombra-alta)] sm:max-w-md sm:rounded-[var(--radius-lg)] sm:pb-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Invitar al taller</h3>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4.5 w-4.5" aria-hidden />
              </button>
            </div>

            <form onSubmit={invitar} className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-caption font-medium text-muted-foreground">Email</span>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="empleado@ejemplo.com"
                  className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 text-base text-foreground outline-none focus:border-accent"
                />
              </label>

              <fieldset className="space-y-1.5">
                <legend className="text-caption font-medium text-muted-foreground">Permisos</legend>
                {ROLES.map((r) => (
                  <label
                    key={r.v}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-sm)] border p-3 transition-colors ${
                      rol === r.v ? "border-accent bg-accent-suave" : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rol"
                      value={r.v}
                      checked={rol === r.v}
                      onChange={() => setRol(r.v)}
                      className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">{r.t}</span>
                      <span className="block text-caption text-muted-foreground">{r.d}</span>
                    </span>
                  </label>
                ))}
              </fieldset>

              <p className="text-caption text-muted-foreground">
                Se crea un link que vence en 7 días. Copialo y mandáselo por WhatsApp.
              </p>

              {error && (
                <p role="alert" className="text-caption text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pendiente}
                className="min-h-11 w-full rounded-[var(--radius-sm)] bg-accent text-sm font-semibold text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {pendiente ? "Creando…" : "Crear invitación"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
