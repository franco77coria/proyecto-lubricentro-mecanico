import { z } from "zod";

/**
 * El esquema vive acá y no en `lib/actions/stock.ts` porque un archivo con
 * `"use server"` solo puede exportar funciones async: cualquier `export const`
 * rompe la compilación entera del módulo, y el error que se ve es confuso
 * ("crearProducto doesn't exist in target module"). Misma familia que la
 * lección #42 — los schemas compartidos van a su propio archivo.
 */

/**
 * Código de barras del fabricante.
 *
 * Es el MISMO patrón que el check de la base (0024). Si divergen, la validación
 * que manda es la de Postgres y el usuario ve un error genérico en vez de uno
 * que le diga qué corregir.
 */
export const RE_CODIGO_BARRAS = /^[A-Za-z0-9._-]{4,32}$/;

export const productoSchema = z.object({
  // El SKU es el código del taller; el de barras es el del fabricante. Son dos
  // campos distintos a propósito (ver 0024).
  sku: z.string().trim().max(40).optional(),
  codigoBarras: z
    .string()
    .trim()
    .regex(RE_CODIGO_BARRAS, { message: "El código de barras tiene caracteres inválidos" })
    .optional()
    .or(z.literal("")),
  nombre: z.string().trim().min(1, { message: "El nombre es obligatorio" }).max(100),
  marca: z.string().trim().max(50).optional(),
  categoria: z.string().trim().max(50).optional(),
  unidad: z.string().trim().default("unid"),
  stockMin: z.coerce.number().int().min(0).default(0),
  precioVenta: z.coerce.number().min(0).default(0),
  costoUnitario: z.coerce.number().min(0).default(0),
  stockInicial: z.coerce.number().min(0).default(0),
});

export type DatosProducto = z.infer<typeof productoSchema>;
