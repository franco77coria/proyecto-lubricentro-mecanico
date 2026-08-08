/**
 * Flujo completo de una orden, de punta a punta.
 *
 * Corre con: npm run verify:flujo
 *
 * Los otros scripts verifican piezas sueltas (aislamiento, privilegios,
 * storage). Este comprueba que el circuito real funcione: recibir un auto,
 * cargarle un repuesto, ver que el stock baje, cobrar y cerrar. Es donde
 * aparecen los agujeros entre partes que por separado andan bien.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const linea of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = linea.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(SB, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let fallos = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const fail = (m) => { fallos++; console.log(`  FALLA ${m}`); };

const sufijo = Date.now();
const usuarios = [];
const NOMBRE_TALLER = `Flujo ${sufijo}`;

async function crearDueno() {
  const email = `flujo-${sufijo}@ejemplo.test`;
  const password = `Flujo!${sufijo}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(error.message);
  usuarios.push(data.user.id);

  const cli = createClient(SB, ANON, { auth: { persistSession: false } });
  await cli.auth.signInWithPassword({ email, password });
  const { data: tallerId, error: e } = await cli.rpc("crear_taller", { p_nombre: NOMBRE_TALLER });
  if (e) throw new Error(e.message);
  return { cli, tallerId };
}

async function main() {
  const { cli, tallerId } = await crearDueno();

  console.log("\n[1] Alta de producto y stock inicial");
  const { data: prod } = await cli
    .from("producto")
    .insert({ taller_id: tallerId, nombre: "Aceite 10W40", unidad: "litro", stock_min: 5, precio_venta: 20000 })
    .select("id, stock, unidad")
    .single();

  await cli.from("movimiento_stock").insert({
    taller_id: tallerId, producto_id: prod.id, tipo: "compra", cantidad: 20, costo_unitario: 12000,
  });

  const leerStock = async () => {
    const { data } = await cli.from("producto").select("stock, bajo_stock").eq("id", prod.id).single();
    return data;
  };

  let s = await leerStock();
  Number(s.stock) === 20 ? ok("compra de 20 litros deja stock en 20") : fail(`stock ${s.stock}, esperaba 20`);
  prod.unidad === "litro" ? ok("la unidad se guarda (litro)") : fail(`unidad quedó en "${prod.unidad}"`);

  console.log("\n[2] Recepción del vehículo y orden");
  const { data: veh } = await cli
    .from("vehiculo").insert({ taller_id: tallerId, patente: "AB999ZZ" }).select("id").single();
  const { data: ot } = await cli
    .from("orden_trabajo").insert({ taller_id: tallerId, vehiculo_id: veh.id, estado: "recibido" })
    .select("id, numero").single();
  ot?.numero ? ok(`orden creada con número ${ot.numero}`) : fail("no se creó la orden");

  console.log("\n[3] Cargar un repuesto DESCUENTA stock");
  const { data: item } = await cli.from("ot_item").insert({
    taller_id: tallerId, ot_id: ot.id, tipo: "repuesto", descripcion: "Aceite 10W40",
    producto_id: prod.id, cantidad: 4, costo_unitario: 12000, precio_unitario: 20000,
  }).select("id").single();

  s = await leerStock();
  Number(s.stock) === 16
    ? ok("cargar 4 litros baja el stock a 16")
    : fail(`el stock quedó en ${s.stock}: el consumo NO se registró`);

  console.log("\n[4] Cambiar la cantidad reajusta el stock");
  await cli.from("ot_item").update({ cantidad: 10 }).eq("id", item.id);
  s = await leerStock();
  Number(s.stock) === 10 ? ok("subir a 10 litros deja el stock en 10") : fail(`stock ${s.stock}, esperaba 10`);

  console.log("\n[5] El aviso de bajo mínimo se dispara");
  await cli.from("ot_item").update({ cantidad: 16 }).eq("id", item.id);
  s = await leerStock();
  s.bajo_stock === true
    ? ok("con 4 litros sobre un mínimo de 5, bajo_stock es true")
    : fail(`bajo_stock quedó en ${s.bajo_stock} con stock ${s.stock}`);

  console.log("\n[6] Borrar el ítem devuelve el stock");
  await cli.from("ot_item").delete().eq("id", item.id);
  s = await leerStock();
  Number(s.stock) === 20 ? ok("borrar el ítem devuelve los 20 litros") : fail(`stock ${s.stock}, esperaba 20`);

  console.log("\n[7] Mano de obra NO toca el stock");
  await cli.from("ot_item").insert({
    taller_id: tallerId, ot_id: ot.id, tipo: "mano_obra", descripcion: "Cambio de aceite",
    cantidad: 1, costo_unitario: 0, precio_unitario: 18000,
  });
  s = await leerStock();
  Number(s.stock) === 20 ? ok("la mano de obra deja el stock igual") : fail(`la mano de obra movió el stock a ${s.stock}`);

  console.log("\n[8] Totales y saldo del ledger");
  const { data: totales } = await cli
    .from("orden_trabajo").select("total, total_mano_obra, total_repuestos").eq("id", ot.id).single();
  Number(totales.total) === 18000
    ? ok("el total se recalcula solo: 18000")
    : fail(`total ${totales.total}, esperaba 18000`);

  const { data: deriva } = await cli.rpc("verificar_saldos_stock");
  (deriva ?? []).length === 0
    ? ok("ningún producto derivó respecto del ledger")
    : fail(`${deriva.length} producto(s) con saldo distinto al ledger`);

  console.log("\n[9] Precio sugerido al elegir un producto");
  const { data: sug } = await cli.rpc("precio_sugerido_producto", { p_producto: prod.id });
  sug && Number(sug.precio_venta) === 20000 && Number(sug.costo) === 12000
    ? ok("sugiere precio 20000 y costo 12000 de la última compra")
    : fail(`sugerencia inesperada: ${JSON.stringify(sug)}`);

  console.log("\n[10] Cobro y cierre");
  await cli.from("pago").insert({ taller_id: tallerId, ot_id: ot.id, metodo: "efectivo", monto: 18000 });
  await cli.from("orden_trabajo").update({ estado: "entregado" }).eq("id", ot.id);

  const { data: metricas } = await cli.rpc("metricas_taller");
  Number(metricas?.resumen?.facturado) === 18000
    ? ok("la orden entregada aparece en los reportes")
    : fail(`facturado ${metricas?.resumen?.facturado}, esperaba 18000`);

  const { data: log } = await cli.from("ot_estado_log").select("estado_nuevo").eq("ot_id", ot.id);
  (log ?? []).length >= 2 ? ok(`el log registró ${log.length} cambios de estado`) : fail("el log de estados no registró");
}

async function limpiar() {
  await admin.from("taller").delete().eq("nombre", NOMBRE_TALLER);
  for (const id of usuarios) await admin.auth.admin.deleteUser(id).catch(() => {});
}

main()
  .catch((e) => { fallos++; console.error("\nError:", e.message); })
  .finally(async () => {
    await limpiar();
    console.log(fallos === 0 ? "\nFlujo completo verificado.\n" : `\n${fallos} verificacion(es) fallaron.\n`);
    process.exit(fallos === 0 ? 0 : 1);
  });
