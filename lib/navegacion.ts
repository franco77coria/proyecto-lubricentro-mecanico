import {
  BarChart3,
  BellRing,
  CalendarDays,
  Car,
  ClipboardList,
  Columns3,
  Layers,
  Users,
  LayoutGrid,
  type LucideIcon,
  Package,
  Settings,
  Truck,
  Wallet,
} from "lucide-react";

/** Cómo se agrupan las pantallas en la hoja de "Más" del celular. */
export type GrupoNav = "taller" | "plata" | "config";

export const NOMBRE_GRUPO: Record<GrupoNav, string> = {
  taller: "El taller",
  plata: "La plata",
  config: "Configuración",
};

export interface ItemNav {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  /** Solo el dueño ve la plata y reportes. */
  soloDueno?: boolean;
  /**
   * El mecánico no lo ve, el mostrador sí.
   */
  sinMecanico?: boolean;
  /** En qué sección de la hoja de "Más" aparece. */
  grupo: GrupoNav;
  /** Una línea de qué hay del otro lado, para la hoja de "Más". */
  ayuda?: string;
}

/**
 * Catálogo completo de pantallas navegables del sistema.
 */
export const ITEMS_NAV: readonly ItemNav[] = [
  {
    href: "/tablero",
    etiqueta: "Tablero",
    icono: LayoutGrid,
    grupo: "taller",
    ayuda: "Cómo viene el día y KPIs",
  },
  {
    href: "/kanban",
    etiqueta: "En el taller",
    icono: Columns3,
    grupo: "taller",
    ayuda: "Los autos que están acá, por estado",
  },
  {
    href: "/turnos",
    etiqueta: "Turnos",
    icono: CalendarDays,
    grupo: "taller",
    ayuda: "Agenda de clientes y citas",
  },
  {
    href: "/vehiculos",
    etiqueta: "Autos",
    icono: Car,
    grupo: "taller",
    ayuda: "Buscar por patente y ver el historial",
  },
  {
    href: "/clientes",
    etiqueta: "Clientes",
    icono: Users,
    grupo: "taller",
    ayuda: "Datos de contacto y autos de cada uno",
  },
  {
    href: "/stock/equivalencias",
    etiqueta: "Filtros & Cruces",
    icono: Layers,
    grupo: "taller",
    ayuda: "Buscador y equivalencia de filtros",
  },
  {
    href: "/stock",
    etiqueta: "Stock",
    icono: Package,
    grupo: "taller",
    ayuda: "Qué hay y qué falta comprar",
  },
  {
    href: "/avisos",
    etiqueta: "Avisos",
    icono: BellRing,
    sinMecanico: true,
    grupo: "taller",
    ayuda: "A quién le toca el próximo service",
  },
  {
    href: "/presupuestos",
    etiqueta: "Presupuestos",
    icono: ClipboardList,
    grupo: "plata",
    ayuda: "Cotizaciones pendientes y aprobadas",
  },
  {
    href: "/compras",
    etiqueta: "Compras",
    icono: Truck,
    sinMecanico: true,
    grupo: "plata",
    ayuda: "Remitos de proveedor y costo real",
  },
  {
    href: "/caja",
    etiqueta: "Caja",
    icono: Wallet,
    soloDueno: true,
    grupo: "plata",
    ayuda: "Cobros del día y cierre",
  },
  {
    href: "/reportes",
    etiqueta: "Reportes",
    icono: BarChart3,
    soloDueno: true,
    grupo: "plata",
    ayuda: "Facturación, márgenes y tiempos",
  },
  {
    href: "/config",
    etiqueta: "Configuración",
    icono: Settings,
    grupo: "config",
    ayuda: "Taller, equipo, roles, idioma y auditoría",
  },
];

export const ATAJOS_BARRA: readonly string[] = ["/tablero", "/kanban", "/stock"];

export const ITEMS_BARRA: readonly ItemNav[] = ATAJOS_BARRA.map(
  (href) => ITEMS_NAV.find((i) => i.href === href)!,
);

/**
 * Devuelve los ítems de navegación visibles según el rol y las vistas permitidas personalizadas.
 */
export function itemsVisibles(
  items: readonly ItemNav[],
  rol: string,
  vistasPermitidas?: string[] | null,
): ItemNav[] {
  // El dueño siempre ve todo
  if (rol === "dueno") return [...items];

  // Si tiene asignadas vistas específicas personalizadas por el dueño
  if (vistasPermitidas && vistasPermitidas.length > 0) {
    return items.filter(
      (i) => vistasPermitidas.includes(i.href) || i.href === "/config",
    );
  }

  // Regla por defecto según rol
  return items.filter(
    (i) => (!i.soloDueno || rol === "dueno") && (!i.sinMecanico || rol !== "mecanico"),
  );
}

/**
 * Todo lo que el rol puede abrir, agrupado, para la hoja de "Más".
 */
export function gruposVisibles(
  rol: string,
  vistasPermitidas?: string[] | null,
): { grupo: GrupoNav; items: ItemNav[] }[] {
  const visibles = itemsVisibles(ITEMS_NAV, rol, vistasPermitidas);
  return (["taller", "plata", "config"] as const)
    .map((grupo) => ({ grupo, items: visibles.filter((i) => i.grupo === grupo) }))
    .filter((g) => g.items.length > 0);
}

export function esRutaActiva(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
