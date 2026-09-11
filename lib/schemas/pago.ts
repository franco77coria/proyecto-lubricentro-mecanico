import { z } from "zod";

export const METODOS_PAGO = [
  "efectivo",
  "transferencia",
  "tarjeta_credito",
  "tarjeta_debito",
  "mercado_pago",
  "otro",
] as const;

export type MetodoPago = (typeof METODOS_PAGO)[number];

export const pagoSchema = z.object({
  otId: z.string().uuid(),
  metodo: z.enum(METODOS_PAGO, { message: "Método de pago inválido" }),
  monto: z.coerce.number().min(0.01, { message: "El monto debe ser mayor a 0" }),
  notas: z.string().trim().max(200).optional(),
});

export type DatosPagoOT = z.infer<typeof pagoSchema>;
