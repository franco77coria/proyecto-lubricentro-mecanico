"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Check,
  Copy,
  Eye,
  KeyRound,
  MessageCircle,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { Sheet } from "@/components/sheet/Sheet";
import {
  cambiarRolMiembro,
  cancelarInvitacion,
  invitarAlTaller,
  type RegistroAuditoria,
} from "@/lib/actions/equipo";
import { CrearUsuarioModal } from "./CrearUsuarioModal";
import { EditarVistasModal } from "./EditarVistasModal";
import { PanelAuditoriaEquipo } from "./PanelAuditoriaEquipo";

export interface Miembro {
  user_id: string;
  nombre: string | null;
  rol: string;
  activo: boolean;
  vistas_permitidas?: string[] | null;
}

export interface Invitacion {
  id: string;
  email: string;
  rol: string;
  token: string;
  expira_en: string;
}

const ROLES = [
  {
    v: "dueno",
    t: "Dueño / Administrador",
    d: "Acceso total irrestricto: facturación, caja, costos de repuestos, reportes y configuración.",
  },
  {
    v: "mecanico",
    t: "Mecánico / Fosa",
    d: "Vista técnica y de trabajo: Tablero, Kanban, checklists y fotos. Sin acceso a costos ni caja.",
  },
  {
    v: "mostrador",
    t: "Mostrador / Recepción",
    d: "Recepción de clientes, creación de presupuestos, órdenes y cobros. Sin reportes del dueño.",
  },
] as const;

const NOMBRE_ROL: Record<string, string> = {
  dueno: "Dueño / Admin",
  mostrador: "Mostrador / Recepción",
  mecanico: "Mecánico / Fosa",
};

const COLOR_ROL: Record<string, string> = {
  dueno: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  mostrador: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  mecanico: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export function GestionEquipo({
  miembros,
  invitaciones,
  auditoria,
  yoSoy,
  esDueno,
}: {
  miembros: Miembro[];
  invitaciones: Invitacion[];
  auditoria?: RegistroAuditoria[];
  yoSoy: string;
  esDueno: boolean;
}) {
  const router = useRouter();
  const { notificar } = useIsla();

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalInvitarAbierto, setModalInvitarAbierto] = useState(false);
  const [usuarioEditarVistas, setUsuarioEditarVistas] = useState<{
    userId: string;
    nombre: string | null;
    vistasPermitidas?: string[] | null;
  } | null>(null);

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
      setModalInvitarAbierto(false);
      notificar({
        tipo: "exito",
        mensaje: "Invitación generada. Podés mandarla por WhatsApp o copiar el link.",
      });
      router.refresh();
    });
  }

  async function copiarLink(token: string) {
    const url = `${window.location.origin}/invitacion/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(token);
      setTimeout(() => setCopiado(null), 2500);
      notificar({ tipo: "exito", mensaje: "Enlace copiado al portapapeles" });
    } catch {
      notificar({ tipo: "error", mensaje: "No se pudo copiar el enlace." });
    }
  }

  function compartirWhatsApp(token: string) {
    const url = `${window.location.origin}/invitacion/${token}`;
    const texto = `¡Hola! Te invito a unirte al equipo en el sistema de gestión del taller. Ingresá desde este enlace seguro: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  }

  return (
    <div className="space-y-6">
      {/* Panel de Auditoría y Telemetría en Vivo (solo para el Dueño) */}
      {esDueno && auditoria && auditoria.length > 0 && (
        <PanelAuditoriaEquipo
          registros={auditoria}
          onEditarVistas={(u) => setUsuarioEditarVistas(u)}
        />
      )}

      {/* Lista Principal de Miembros & Administración */}
      <section className="space-y-6 rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-black tracking-tight text-foreground">
                Equipo &amp; Roles del Taller
              </h2>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Creá cuentas directas con usuario/clave, asigná roles y controlá qué pantallas puede ver cada uno.
            </p>
          </div>
          {esDueno && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalCrearAbierto(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-amber-500 px-4 text-xs font-black text-white shadow-md shadow-accent/20 transition-all hover:brightness-110 active:scale-95"
              >
                <UserPlus className="h-4 w-4 stroke-[2.5]" aria-hidden />
                <span>Crear Mecánico / Usuario</span>
              </button>

              <button
                type="button"
                onClick={() => setModalInvitarAbierto(true)}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-border/80 bg-card px-3.5 text-xs font-bold text-foreground hover:bg-muted transition-all active:scale-95"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
                <span className="hidden sm:inline">Invitar por WhatsApp</span>
              </button>
            </div>
          )}
        </div>

        {/* Lista de Miembros Actuales */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Miembros Activos ({miembros.length})
          </h3>
          <ul className="grid gap-3">
            {miembros.map((m) => {
              const esYo = m.user_id === yoSoy;
              const rolActual = m.rol as "dueno" | "mostrador" | "mecanico";
              return (
                <li
                  key={m.user_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 transition-all hover:border-accent/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-black text-white shadow-sm border border-white/10">
                      {(m.nombre || "?").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-black text-foreground">
                          {m.nombre || "Usuario del taller"}
                        </span>
                        {esYo && (
                          <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-black text-accent">
                            Tu usuario
                          </span>
                        )}
                        {!m.activo && (
                          <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-[10px] font-black text-destructive">
                            Acceso suspendido
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            COLOR_ROL[m.rol] ?? "bg-muted text-foreground"
                          }`}
                        >
                          {NOMBRE_ROL[m.rol] ?? m.rol}
                        </span>
                        {m.rol !== "dueno" && esDueno && (
                          <button
                            type="button"
                            onClick={() =>
                              setUsuarioEditarVistas({
                                userId: m.user_id,
                                nombre: m.nombre,
                                vistasPermitidas: m.vistas_permitidas,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline"
                          >
                            <Eye className="h-3 w-3" />
                            <span>
                              {m.vistas_permitidas?.length ? `${m.vistas_permitidas.length} pantallas` : "Vistas por defecto"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {esDueno && (
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-border/40 sm:border-0">
                      {/* Selector de Rol Instantáneo */}
                      <select
                        value={m.rol}
                        disabled={pendiente}
                        onChange={(e) =>
                          iniciar(async () => {
                            const res = await cambiarRolMiembro(
                              m.user_id,
                              e.target.value as "dueno" | "mostrador" | "mecanico",
                              m.activo,
                            );
                            if (res.error) {
                              notificar({ tipo: "error", mensaje: res.error });
                            } else {
                              notificar({ tipo: "exito", mensaje: "Rol actualizado con éxito" });
                            }
                            router.refresh();
                          })
                        }
                        aria-label={`Rol de ${m.nombre || "usuario"}`}
                        className="min-h-10 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold text-foreground outline-none focus:border-accent shadow-sm"
                      >
                        {ROLES.map((r) => (
                          <option key={r.v} value={r.v}>
                            {r.t}
                          </option>
                        ))}
                      </select>

                      {/* Botón Activar / Suspender */}
                      {!esYo && (
                        <button
                          type="button"
                          disabled={pendiente}
                          onClick={() =>
                            iniciar(async () => {
                              const res = await cambiarRolMiembro(m.user_id, rolActual, !m.activo);
                              if (res.error) {
                                notificar({ tipo: "error", mensaje: res.error });
                              } else {
                                notificar({
                                  tipo: "exito",
                                  mensaje: m.activo ? "Acceso suspendido" : "Acceso reactivado",
                                });
                              }
                              router.refresh();
                            })
                          }
                          className={`min-h-10 rounded-xl px-3 text-xs font-bold transition-all ${
                            m.activo
                              ? "border border-border bg-card text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                          }`}
                        >
                          {m.activo ? "Suspender" : "Reactivar"}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Invitaciones Pendientes */}
        {invitaciones.length > 0 && (
          <div className="space-y-3 border-t border-border/60 pt-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Invitaciones Pendientes ({invitaciones.length})
            </h3>
            <ul className="grid gap-2.5">
              {invitaciones.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/10 p-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-bold text-foreground">{inv.email}</span>
                      <span
                        className={`rounded-full border px-2 py-0.2 text-[9px] font-black uppercase ${
                          COLOR_ROL[inv.rol] ?? "bg-muted text-foreground"
                        }`}
                      >
                        {NOMBRE_ROL[inv.rol]}
                      </span>
                    </div>
                    <span className="block text-[11px] text-muted-foreground font-medium mt-0.5">
                      Válido hasta el{" "}
                      {new Intl.DateTimeFormat("es-AR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(inv.expira_en))}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => compartirWhatsApp(inv.token)}
                      title="Enviar invitación por WhatsApp"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 px-3 text-xs font-bold text-[#25D366] hover:bg-[#25D366]/25 transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copiarLink(inv.token)}
                      title="Copiar enlace directo"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                    >
                      {copiado === inv.token ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>

                    {esDueno && (
                      <button
                        type="button"
                        onClick={() =>
                          iniciar(async () => {
                            await cancelarInvitacion(inv.id);
                            notificar({ tipo: "exito", mensaje: "Invitación cancelada" });
                            router.refresh();
                          })
                        }
                        title="Cancelar invitación"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Modales */}
      <CrearUsuarioModal
        abierto={modalCrearAbierto}
        onCerrar={() => setModalCrearAbierto(false)}
      />

      <EditarVistasModal
        abierto={!!usuarioEditarVistas}
        onCerrar={() => setUsuarioEditarVistas(null)}
        usuario={usuarioEditarVistas}
      />

      {/* Sheet para Invitar con Link */}
      <Sheet
        abierto={modalInvitarAbierto}
        onCerrar={() => setModalInvitarAbierto(false)}
        titulo="Invitar por WhatsApp o Link"
      >
        <form onSubmit={invitar} className="space-y-5 p-5">
          <label className="block space-y-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Email del empleado
            </span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mecanico@ejemplo.com"
              className="min-h-12 w-full rounded-2xl border border-border/80 bg-card px-3.5 text-base text-foreground outline-none focus:border-accent shadow-sm"
            />
          </label>

          <fieldset className="space-y-2.5">
            <legend className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
              Rol Asignado
            </legend>
            {ROLES.map((r) => (
              <label
                key={r.v}
                className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-all ${
                  rol === r.v
                    ? "border-accent bg-accent/10 shadow-sm"
                    : "border-border/80 bg-card hover:border-accent/40"
                }`}
              >
                <input
                  type="radio"
                  name="rol"
                  value={r.v}
                  checked={rol === r.v}
                  onChange={() => setRol(r.v)}
                  className="mt-1 h-4 w-4 accent-accent"
                />
                <div className="space-y-0.5">
                  <span className="block text-sm font-black text-foreground">{r.t}</span>
                  <span className="block text-xs font-medium text-muted-foreground leading-relaxed">
                    {r.d}
                  </span>
                </div>
              </label>
            ))}
          </fieldset>

          {error && (
            <p role="alert" className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-xs font-bold text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pendiente}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent text-base font-black text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {pendiente ? "Generando invitación…" : "Generar Enlace de Invitación"}
          </button>
        </form>
      </Sheet>
    </div>
  );
}
