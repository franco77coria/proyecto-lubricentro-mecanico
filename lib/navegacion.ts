import {
  BarChart3,
  Car,
  Users,
  LayoutGrid,
  type LucideIcon,
  Package,
  Settings,
  Truck,
  Wallet,
} from "lucide-react";

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
}

/**
 * Fuente única de la navegación.
 *
 * El sidebar de escritorio y la barra inferior de celular leen de acá: si cada
 * uno tuviera su propia lista, agregar una pantalla implicaría acordarse de
 * tocar los dos, y tarde o temprano quedan distintos.
 *
 * Las etiquetas son concretas ("Tablero", "Ajustes") y no paraguas ("Inicio",
 * "Más"): un nombre que no dice qué hay del otro lado obliga a entrar para
 * averiguarlo.
 */
export const ITEMS_NAV: readonly ItemNav[] = [
  { href: "/tablero", etiqueta: "Tablero", icono: LayoutGrid },
  { href: "/vehiculos", etiqueta: "Autos", icono: Car },
  { href: "/clientes", etiqueta: "Clientes", icono: Users },
  { href: "/stock", etiqueta: "Stock", icono: Package },
  { href: "/compras", etiqueta: "Compras", icono: Truck, sinMecanico: true },
  { href: "/caja", etiqueta: "Caja", icono: Wallet, soloDueno: true },
  { href: "/reportes", etiqueta: "Reportes", icono: BarChart3, soloDueno: true },
  { href: "/config", etiqueta: "Ajustes", icono: Settings },
];

/** En el celular no entran seis ítems más el botón central: quedan los cuatro
 *  que se usan estando parado al lado de un auto. Caja y reportes son de
 *  escritorio, se miran sentado. */
export const ITEMS_BARRA: readonly ItemNav[] = ITEMS_NAV.filter(
  (i) => !["/caja", "/reportes", "/clientes", "/compras"].includes(i.href),
);

/** Qué ítems corresponden a un rol. Una sola regla para sidebar y barra. */
export function itemsVisibles(items: readonly ItemNav[], rol: string): ItemNav[] {
  return items.filter(
    (i) => (!i.soloDueno || rol === "dueno") && (!i.sinMecanico || rol !== "mecanico"),
  );
}

export function esRutaActiva(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
