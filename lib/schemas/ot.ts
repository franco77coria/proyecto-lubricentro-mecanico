import { z } from "zod";

export const ESTADOS_OT = [
  "Presupuesto",
  "Aprobado",
  "Recibido",
  "En trabajo",
  "Esperando repuesto",
  "Listo para entregar",
  "Entregado",
  "Cerrado",
  "Anulado",
] as const;

export type EstadoOT = (typeof ESTADOS_OT)[number];

export const TIPOS_OT = [
  "lubricentro",
  "mecanica",
  "mixto",
] as const;

export type TipoOT = (typeof TIPOS_OT)[number];

export const TIPOS_ITEM = [
  "repuesto",
  "mano_obra",
  "servicio",
  "insumo",
  "tercero",
] as const;

export type TipoItem = (typeof TIPOS_ITEM)[number];

export const crearOTSchema = z.object({
  vehiculoId: z.string().uuid({ message: "Vehículo no seleccionado" }),
  clienteId: z.string().uuid().optional().or(z.literal("")),
  tipo: z.enum(TIPOS_OT, { message: "Tipo de trabajo inválido" }),
  kmIngreso: z.coerce.number().int().min(0, { message: "Kilometraje inválido" }),
  observaciones: z.string().trim().max(1000).optional(),
  anomalias: z.array(z.string().trim().min(1)).optional(),

  // Lo que se leyó del código de la cédula, crudo. Se guarda aunque el parseo
  // haya entendido poco: es la única forma de descubrir los formatos que varían
  // entre provincias sin volver a pedirle el documento al cliente.
  cedulaPayload: z.string().trim().max(4000).optional(),
});

export type DatosCrearOT = z.infer<typeof crearOTSchema>;

export const itemOTSchema = z.object({
  tipo: z.enum(TIPOS_ITEM, { message: "Tipo de ítem inválido" }),
  descripcion: z.string().trim().min(1, { message: "La descripción es requerida" }).max(200),

  // Vincular el ítem al producto es lo que dispara el descuento de stock
  // (trigger de 0014). Sin esto el inventario nunca baja.
  productoId: z.string().uuid().optional().or(z.literal("")),
  /** Solo informativo: de dónde salió el precio. No cambia el cálculo. */
  servicioId: z.string().uuid().optional().or(z.literal("")),

  cantidad: z.coerce.number().min(0.01, { message: "La cantidad debe ser mayor a 0" }),
  precioUnitario: z.coerce.number().min(0, { message: "Precio inválido" }),

  // `costoUnitario` NO está y no vuelve: la UI lo mandaba siempre en 0, y un
  // campo que el cliente puede escribir es superficie de ataque aunque la
  // pantalla no lo muestre (lección #41). El costo lo resuelve el servidor
  // contra el ledger, que es la única fuente que no se puede falsear.
});

export type DatosItemOT = z.infer<typeof itemOTSchema>;

export const cambioEstadoSchema = z.object({
  otId: z.string().uuid(),
  estadoNuevo: z.enum(ESTADOS_OT, { message: "Estado de OT inválido" }),
});
