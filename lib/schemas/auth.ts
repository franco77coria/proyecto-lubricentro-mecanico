import { z } from "zod";

/** Los schemas viven en lib/, nunca exportados desde un route.ts: Next solo
 *  permite exportar handlers desde un archivo de ruta y el build rompe. */
export const credencialesSchema = z.object({
  email: z.string().email({ message: "Revisá el email" }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { message: "La contraseña necesita al menos 8 caracteres" })
    .max(72, { message: "La contraseña es demasiado larga" }),
});

export type Credenciales = z.infer<typeof credencialesSchema>;

export const altaTallerSchema = z.object({
  nombre: z.string().trim().min(2, { message: "Poné el nombre del taller" }).max(80),
  nombreUsuario: z.string().trim().max(80).optional(),
  telefono: z.string().trim().max(20).optional(),
});
