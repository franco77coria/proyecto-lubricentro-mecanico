"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { hoyEnZona, inicioDelDiaEnZona } from "@/lib/fechas";
import { obtenerAjustesTaller } from "@/lib/taller";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

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

export async function registrarPagoOT(datos: z.infer<typeof pagoSchema>): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };

  const parseado = pagoSchema.safeParse(datos);
  if (!parseado.success) return { error: parseado.error.issues[0].message };

  const d = parseado.data;
  const tallerId = sesion.perfil.taller_id;

  try {
    const supabase = await crearClienteServidor();

    const { error } = await supabase.from("pago").insert({
      taller_id: tallerId,
      ot_id: d.otId,
      metodo: d.metodo,
      monto: d.monto,
      usuario_id: sesion.user.id,
      notas: d.notas || null,
    });

    if (error) {
      console.error("[registrarPagoOT]", error.code);
      return { error: "No se pudo registrar el pago." };
    }

    revalidatePath(`/ot/${d.otId}`);
    revalidatePath("/caja");
    revalidatePath("/tablero");
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo conectar con el servidor." };
  }
}

export async function realizarCierreCaja(): Promise<{ ok?: boolean; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) return { error: "Sesión vencida." };
  if (sesion.perfil.rol !== "dueno") return { error: "Solo el dueño puede realizar el cierre de caja." };

  const tallerId = sesion.perfil.taller_id;

  try {
    const supabase = await crearClienteServidor();

    // El día se cierra en la zona del taller, no siempre en la de Buenos
    // Aires. El offset se resuelve para esa fecha concreta en vez de escribir
    // -03:00 a mano, que se rompe donde hay horario de verano.
    const { zonaHoraria } = await obtenerAjustesTaller();
    const fechaHoy = hoyEnZona(zonaHoraria);
    const inicioHoy = inicioDelDiaEnZona(zonaHoraria, fechaHoy);

    const { data: pagos } = await supabase
      .from("pago")
      .select("metodo, monto")
      .eq("taller_id", tallerId)
      .gte("fecha", inicioHoy.toISOString());

    let ef = 0, tf = 0, tj = 0, mp = 0, ot = 0, total = 0;

    if (pagos) {
      for (const p of pagos) {
        const m = Number(p.monto || 0);
        total += m;
        if (p.metodo === "efectivo") ef += m;
        else if (p.metodo === "transferencia") tf += m;
        else if (p.metodo === "tarjeta_credito" || p.metodo === "tarjeta_debito") tj += m;
        else if (p.metodo === "mercado_pago") mp += m;
        else ot += m;
      }
    }

    const { error } = await supabase.from("cierre_caja").upsert(
      {
        taller_id: tallerId,
        fecha: fechaHoy,
        total,
        totales: {
          efectivo: ef,
          transferencia: tf,
          tarjeta: tj,
          mercado_pago: mp,
          otro: ot,
        },
        usuario_id: sesion.user.id,
      },
      { onConflict: "taller_id, fecha" },
    );

    if (error) {
      console.error("[realizarCierreCaja]", error.code);
      return { error: "No se pudo realizar el cierre de caja." };
    }

    revalidatePath("/caja");
    return { ok: true };
  } catch (err) {
    unstable_rethrow(err);
    return { error: "No se pudo conectar." };
  }
}
