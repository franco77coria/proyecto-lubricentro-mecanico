"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, UserPlus } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { Sheet } from "@/components/sheet/Sheet";
import { crearUsuarioEquipo } from "@/lib/actions/equipo";
import { ITEMS_NAV } from "@/lib/navegacion";

const ROLES = [
  {
    v: "mecanico",
    t: "Mecánico / Fosa",
    d: "Vista técnica de trabajo. Carga órdenes y checklists sin acceso a caja ni costos.",
    vistasDefault: ["/tablero", "/kanban", "/vehiculos", "/stock/equivalencias", "/turnos"],
  },
  {
    v: "mostrador",
    t: "Mostrador / Recepción",
    d: "Recepción de clientes, presupuestos, cobros y asignación de órdenes.",
    vistasDefault: ["/tablero", "/kanban", "/vehiculos", "/clientes", "/presupuestos", "/turnos", "/stock", "/stock/equivalencias", "/compras", "/avisos"],
  },
  {
    v: "dueno",
    t: "Dueño / Administrador",
    d: "Acceso 100% irrestricto a todo el sistema, finanzas y configuración.",
    vistasDefault: ITEMS_NAV.map((i) => i.href),
  },
] as const;

export function CrearUsuarioModal({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [pendiente, iniciar] = useTransition();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"dueno" | "mostrador" | "mecanico">("mecanico");
  const [vistas, setVistas] = useState<string[]>([
    "/tablero",
    "/kanban",
    "/vehiculos",
    "/stock/equivalencias",
    "/turnos",
  ]);
  const [error, setError] = useState<string | null>(null);

  function handleCambioRol(nuevoRol: "dueno" | "mostrador" | "mecanico") {
    setRol(nuevoRol);
    const conf = ROLES.find((r) => r.v === nuevoRol);
    if (conf) {
      setVistas([...conf.vistasDefault]);
    }
  }

  function toggleVista(href: string) {
    setVistas((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    iniciar(async () => {
      const res = await crearUsuarioEquipo({
        nombre,
        email,
        password,
        rol,
        vistasPermitidas: vistas,
      });

      if (res.error) {
        setError(res.error);
      } else {
        notificar({
          tipo: "exito",
          mensaje: `Cuenta de ${nombre} creada exitosamente. Ya puede iniciar sesión.`,
        });
        setNombre("");
        setEmail("");
        setPassword("");
        onCerrar();
        router.refresh();
      }
    });
  }

  return (
    <Sheet abierto={abierto} onCerrar={onCerrar} titulo="Crear Cuenta de Mecánico / Empleado">
      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Nombre y Apellido
            </span>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Carlos Gómez"
                className="min-h-11 w-full rounded-xl border border-border/80 bg-card pl-10 pr-3.5 text-sm text-foreground outline-none focus:border-accent shadow-sm font-medium"
              />
            </div>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Email de Ingreso
            </span>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@tallermunoz.com"
                className="min-h-11 w-full rounded-xl border border-border/80 bg-card pl-10 pr-3.5 text-sm text-foreground outline-none focus:border-accent shadow-sm font-medium"
              />
            </div>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Contraseña Inicial
            </span>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ej. mecanico2026"
                className="min-h-11 w-full rounded-xl border border-border/80 bg-card pl-10 pr-3.5 text-sm text-foreground outline-none focus:border-accent shadow-sm font-medium"
              />
            </div>
            <span className="block text-[11px] text-muted-foreground">
              Podés darle esta clave al empleado para que entre directamente desde su celular.
            </span>
          </label>
        </div>

        {/* Selección de Rol */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">
            Rol en el Taller
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.v}
                type="button"
                onClick={() => handleCambioRol(r.v)}
                className={`flex flex-col text-left p-3 rounded-2xl border transition-all ${
                  rol === r.v
                    ? "border-accent bg-accent/10 shadow-sm"
                    : "border-border/80 bg-card hover:border-accent/40"
                }`}
              >
                <span className="text-xs font-black text-foreground">{r.t.split("/")[0].trim()}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{r.d}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Checkboxes de Vistas Específicas Permitidas */}
        {rol !== "dueno" && (
          <fieldset className="space-y-2 border-t border-border/60 pt-3">
            <div className="flex items-center justify-between">
              <legend className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Pantallas Autorizadas
              </legend>
              <span className="text-[11px] text-muted-foreground">
                {vistas.length} seleccionadas
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ITEMS_NAV.filter((i) => !i.soloDueno && i.href !== "/config").map((item) => {
                const seleccionada = vistas.includes(item.href);
                const Icono = item.icono;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => toggleVista(item.href)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                      seleccionada
                        ? "border-accent bg-accent/10 text-foreground shadow-sm"
                        : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icono className={`h-4 w-4 shrink-0 ${seleccionada ? "text-accent" : "text-muted-foreground"}`} />
                    <span className="truncate">{item.etiqueta}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-xs font-bold text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pendiente}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-amber-500 text-sm font-black text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" />
          <span>{pendiente ? "Creando usuario…" : "Crear Usuario y Habilitar Acceso"}</span>
        </button>
      </form>
    </Sheet>
  );
}
