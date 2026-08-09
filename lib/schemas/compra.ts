import { z } from "zod";

/**
 * Carga de un remito de proveedor.
 *
 * Es lo que cierra el círculo del stock: hasta ahora el inventario solo podía
 * bajar (consumo en órdenes) o corregirse a mano con un ajuste. Sin las compras
 * el costo real no existe en ningún lado y el margen es una estimación.
 */

export const itemCompraSchema = z.object({
  productoId: z.string().uuid({ message: "Elegí el producto" }),
  cantidad: z.coerce
    .number()
    .positive({ message: "La cantidad tiene que ser mayor a 0" })
    .max(1_000_000),
  costoUnitario: z.coerce
    .number()
    .min(0, { message: "El costo no puede ser negativo" })
    .max(99_999_999),
});

export const compraSchema = z.object({
  proveedorId: z.string().uuid().optional().or(z.literal("")),
  comprobante: z.string().trim().max(40).optional(),
  // Se puede cargar un remito de días atrás: el taller no siempre carga el
  // mismo día que recibe.
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Fecha inválida" }),
  notas: z.string().trim().max(500).optional(),
  items: z
    .array(itemCompraSchema)
    .min(1, { message: "Agregá al menos un producto al remito" })
    .max(100, { message: "Demasiados ítems para un solo remito" }),
});

export type DatosCompra = z.infer<typeof compraSchema>;
export type DatosItemCompra = z.infer<typeof itemCompraSchema>;

export const proveedorSchema = z.object({
  nombre: z.string().trim().min(2, { message: "Ponele el nombre del proveedor" }).max(80),
  telefono: z.string().trim().max(30).optional(),
  email: z.string().trim().max(80).optional(),
});

export type DatosProveedor = z.infer<typeof proveedorSchema>;
