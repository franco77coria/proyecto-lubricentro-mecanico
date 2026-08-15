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
  /** Solo el dueño ve la plata. */
  soloDueno?: boolean;
  /**
   * El mecánico no lo ve, el mostrador sí.
   *
   * Existe porque `soloDueno` no alcanzaba para las compras: el mostrador es el
   * que recibe el remito del proveedor, así que tiene que poder cargarlo, pero
   * el mecánico no tiene nada que hacer con los costos.
   */
  sinMecanico?: boolean;
  /** En qué sección de la hoja de "Más" aparece. */
  grupo: GrupoNav;
  /** Una línea de qué hay del otro lado, para la hoja de "Más". */
  ayuda?: string;
}

/**
 * Fuente única de la navegación.
 *
 * El sidebar de escritorio y la hoja de "Más" del celular leen de acá: si cada
 * uno tuviera su propia lista, agregar una pantalla implicaría acordarse de
 * tocar los dos, y tarde o temprano quedan distintos.
 *
 * Las etiquetas son concretas ("Tablero", "Ajustes") y no paraguas ("Inicio",
 * "Más"): un nombre que no dice qué hay del otro lado obliga a entrar para
 * averiguarlo.
 */
export const ITEMS_NAV: readonly ItemNav[] = [
  {
    href: "/turnos",
    etiqueta: "Turnos",
    icono: CalendarDays,
    grupo: "taller",
    ayuda: "Agenda de clientes",
  },
  {
    href: "/tablero",
    etiqueta: "Tablero",
    icono: LayoutGrid,
    grupo: "taller",
    ayuda: "Cómo viene el día",
  },
  {
    href: "/kanban",
    etiqueta: "En el taller",
    icono: Columns3,
    grupo: "taller",
    ayuda: "Los autos que están acá, por estado",
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
    href: "/stock",
    etiqueta: "Stock",
    icono: Package,
    grupo: "taller",
    ayuda: "Qué hay y qué falta comprar",
  },
  {
    href: "/stock/equivalencias",
    etiqueta: "Filtros & Cruces",
    icono: Layers,
    grupo: "taller",
    ayuda: "Buscador y equivalencia de filtros",
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
    etiqueta: "Ajustes",
    icono: Settings,
    grupo: "config",
    ayuda: "Taller, precios, checklist y equipo",
  },
];

/**
 * Los cuatro accesos directos de la barra inferior.
 *
 * Se eligen por frecuencia de uso parado al lado de un auto, y son SIEMPRE
 * estos cuatro, sin importar el rol: una barra que cambia de forma según quién
 * entró rompe la memoria muscular, que es lo único que hace rápida una
 * navegación que se usa cien veces por día. El filtrado por rol vive en la hoja
 * de "Más", donde el orden ya no importa.
 *
 * El resto de las pantallas NO desaparece: entra por la hoja. Antes esta lista
 * era un filtro por exclusión y dejaba cinco pantallas sin ninguna forma de
 * llegar desde un celular.
 */
export const ATAJOS_BARRA: readonly string[] = ["/tablero", "/vehiculos", "/stock", "/kanban"];

export const ITEMS_BARRA: readonly ItemNav[] = ATAJOS_BARRA.map(
  (href) => ITEMS_NAV.find((i) => i.href === href)!,
);

/** Qué ítems corresponden a un rol. Una sola regla para todas las superficies. */
export function itemsVisibles(items: readonly ItemNav[], rol: string): ItemNav[] {
  return items.filter(
    (i) => (!i.soloDueno || rol === "dueno") && (!i.sinMecanico || rol !== "mecanico"),
  );
}

/**
 * Todo lo que el rol puede abrir, agrupado, para la hoja de "Más".
 *
 * Incluye también los atajos de la barra: buscarlos en la hoja y no
 * encontrarlos porque "ya están abajo" es exactamente el tipo de detalle que
 * hace dudar de si la pantalla existe.
 */
export function gruposVisibles(rol: string): { grupo: GrupoNav; items: ItemNav[] }[] {
  const visibles = itemsVisibles(ITEMS_NAV, rol);
  return (["taller", "plata", "config"] as const)
    .map((grupo) => ({ grupo, items: visibles.filter((i) => i.grupo === grupo) }))
    .filter((g) => g.items.length > 0);
}

export function esRutaActiva(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
