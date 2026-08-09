import { z } from "zod";

import { esPatenteValida, normalizarPatente } from "@/lib/patente";

const ANIO_MAX = new Date().getFullYear() + 1;

export const vehiculoSchema = z.object({
  patente: z
    .string()
    .trim()
    .min(1, { message: "La patente es obligatoria" })
    .transform(normalizarPatente)
    .refine(esPatenteValida, {
      message: "No coincide con ningún formato argentino. Si es un importado o un clásico, marcá formato especial.",
    }),
  marcaId: z.string().uuid().optional().or(z.literal("")),
  modeloId: z.string().uuid().optional().or(z.literal("")),
  motorizacionId: z.string().uuid().optional().or(z.literal("")),
  anio: z.coerce
    .number()
    .int()
    .min(1900, { message: "Año inválido" })
    .max(ANIO_MAX, { message: "Año inválido" })
    .optional()
    .or(z.literal("")),
  color: z.string().trim().max(30).optional(),
  combustible: z.enum(["nafta", "diesel", "gnc", "hibrido", "electrico"]).optional().or(z.literal("")),
  km: z.coerce.number().int().min(0).max(3_000_000).optional().or(z.literal("")),

  // Cliente: opcional, se puede dar de alta el auto sin dueño y asignarlo después.
  clienteNombre: z.string().trim().max(60).optional(),
  clienteApellido: z.string().trim().max(60).optional(),
  clienteTelefono: z.string().trim().max(30).optional(),
});

/** Variante que se saltea la validación de formato, para chapas atípicas. */
export const vehiculoEspecialSchema = vehiculoSchema.extend({
  patente: z.string().trim().min(3).max(12).transform(normalizarPatente),
});

export type DatosVehiculo = z.infer<typeof vehiculoSchema>;
