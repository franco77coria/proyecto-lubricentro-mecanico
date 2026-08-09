import { z } from "zod";

/**
 * Catálogo de mano de obra del taller.
 *
 * La tabla `servicio` existía desde 0005 y no tenía ni una línea de código: el
 * mostrador tipeaba "Cambio de aceite y filtro" y su precio a mano en CADA
 * orden. Además de lento, hace que el mismo trabajo termine con tres precios
 * distintos según quién lo cargó.
 */
export const servicioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, { message: "Ponele un nombre al trabajo" })
    .max(80, { message: "El nombre es muy largo" }),
  precioManoObra: z.coerce
    .number()
    .min(0, { message: "El precio no puede ser negativo" })
    .max(99_999_999, { message: "Precio fuera de rango" }),
  /** Minutos estimados. Se guarda como interval en Postgres. */
  minutosEstimados: z.coerce
    .number()
    .int()
    .min(0)
    .max(60 * 80, { message: "Más de 80 horas no es un service, es una restauración" })
    .optional()
    .or(z.literal("")),
});

export type DatosServicio = z.infer<typeof servicioSchema>;
