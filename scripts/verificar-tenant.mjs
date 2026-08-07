/**
 * Verificación del aislamiento multi-tenant y de los roles, con usuarios reales.
 *
 * Corre con: npm run verify:tenant
 *
 * El script de esquema (verificar-db.mjs) corre como postgres y por lo tanto
 * saltea RLS: no prueba nada del aislamiento. Esto sí — se autentica de verdad
 * y consulta como lo haría la app.
 *
 * Crea usuarios y talleres de prueba y los borra al terminar.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const linea of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = linea.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(URL_SB, SERVICE, { auth: { persistSession: false } });

let fallos = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const fail = (m) => { fallos++; console.log(`  FALLA ${m}`); };

const sufijo = Date.now();
const usuarios = [];

async function crearUsuario(etiqueta) {
  const email = `test-${etiqueta}-${sufijo}@ejemplo.test`;
  const password = `Prueba!${sufijo}`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (error) throw new Error(`creando ${etiqueta}: ${error.message}`);
  usuarios.push(data.user.id);

  const cli = createClient(URL_SB, ANON, { auth: { persistSession: false } });
  const { error: e2 } = await cli.auth.signInWithPassword({ email, password });
  if (e2) throw new Error(`login ${etiqueta}: ${e2.message}`);
  return { cli, id: data.user.id, email };
}

async function main() {
  console.log("\n[1] Alta de dos talleres independientes");
  const a = await crearUsuario("duenoA");
  const b = await crearUsuario("duenoB");

  const { data: tallerA, error: eA } = await a.cli.rpc("crear_taller", {
    p_nombre: "Lubricentro A", p_nombre_usuario: "Ana",
  });
  const { data: tallerB, error: eB } = await b.cli.rpc("crear_taller", {
    p_nombre: "Taller B", p_nombre_usuario: "Beto",
  });
  if (eA || eB) return fail(`crear_taller falló: ${eA?.message ?? eB?.message}`);
  ok(`taller A y taller B creados por dueños distintos`);

  // Un usuario no puede pertenecer a dos talleres.
  const { error: eDup } = await a.cli.rpc("crear_taller", { p_nombre: "Otro más" });
  eDup ? ok("un usuario no puede crear un segundo taller")
       : fail("dejó crear un segundo taller al mismo usuario");

  console.log("\n[2] Los datos de un taller no se ven desde el otro");
  const { data: cliA } = await a.cli
    .from("cliente").insert({ taller_id: tallerA, nombre: "Juan", apellido: "Pérez" })
    .select().single();
  const { data: vehA } = await a.cli
    .from("vehiculo").insert({ taller_id: tallerA, patente: "AB123CD" })
    .select().single();
  await b.cli.from("cliente").insert({ taller_id: tallerB, nombre: "Marta", apellido: "Gómez" });

  const { data: clientesA } = await a.cli.from("cliente").select("nombre");
  const { data: clientesB } = await b.cli.from("cliente").select("nombre");

  clientesA?.length === 1 && clientesA[0].nombre === "Juan"
    ? ok("A ve solo su cliente")
    : fail(`A ve ${JSON.stringify(clientesA)}`);
  clientesB?.length === 1 && clientesB[0].nombre === "Marta"
    ? ok("B ve solo su cliente")
    : fail(`B ve ${JSON.stringify(clientesB)}`);

  // Pedir el registro del otro taller por id explícito.
  const { data: fuga } = await b.cli.from("cliente").select("*").eq("id", cliA.id);
  fuga?.length === 0
    ? ok("B no puede traer el cliente de A ni pidiéndolo por id")
    : fail("FUGA: B leyó el cliente de A");

  const { data: fugaVeh } = await b.cli.from("vehiculo").select("*").eq("id", vehA.id);
  fugaVeh?.length === 0
    ? ok("B no puede traer el vehículo de A")
    : fail("FUGA: B leyó el vehículo de A");

  // Escribir en el taller ajeno.
  const { error: eEscritura } = await b.cli
    .from("cliente").insert({ taller_id: tallerA, nombre: "Intruso" });
  eEscritura
    ? ok("B no puede insertar dentro del taller de A")
    : fail("FUGA: B escribió en el taller de A");

  // Modificar un registro ajeno: con RLS esto devuelve éxito y 0 filas,
  // así que hay que mirar las filas afectadas y no el error.
  const { data: upd } = await b.cli
    .from("cliente").update({ nombre: "Hackeado" }).eq("id", cliA.id).select();
  upd?.length === 0
    ? ok("un UPDATE al cliente de A no afecta ninguna fila")
    : fail("FUGA: B modificó el cliente de A");

  console.log("\n[3] El mecánico no ve la plata");
  const mec = await crearUsuario("mecanico");
  await admin.from("perfil").insert({
    user_id: mec.id, taller_id: tallerA, rol: "mecanico", nombre: "Mecánico",
  });

  const { data: ot } = await a.cli
    .from("orden_trabajo").insert({ taller_id: tallerA, vehiculo_id: vehA.id })
    .select().single();
  await a.cli.from("ot_item").insert({
    taller_id: tallerA, ot_id: ot.id, tipo: "repuesto",
    descripcion: "Filtro", cantidad: 1, costo_unitario: 8000, precio_unitario: 12000,
  });

  // El mecánico ve la OT (la necesita para trabajar) pero no el costo.
  const { data: otMec } = await mec.cli.from("orden_trabajo").select("numero").eq("id", ot.id);
  otMec?.length === 1
    ? ok("el mecánico ve la OT de su taller")
    : fail("el mecánico no puede ver la OT de su taller");

  const { error: eCosto } = await mec.cli.from("ot_item").select("costo_unitario").eq("ot_id", ot.id);
  eCosto
    ? ok("pedir costo_unitario desde la tabla es rechazado")
    : fail("FUGA: costo_unitario se pudo leer desde la tabla");

  const { error: eRpcMec } = await mec.cli.rpc("ot_costos", { p_ot: ot.id });
  eRpcMec
    ? ok("ot_costos rechaza al mecánico")
    : fail("FUGA: el mecánico obtuvo los costos por RPC");

  const { data: costosDueno, error: eRpcDueno } = await a.cli.rpc("ot_costos", { p_ot: ot.id });
  !eRpcDueno && costosDueno?.length === 1 && Number(costosDueno[0].margen) === 4000
    ? ok("el dueño sí obtiene los costos, con margen 12000 - 8000 = 4000")
    : fail(`el dueño no pudo ver los costos: ${eRpcDueno?.message ?? JSON.stringify(costosDueno)}`);

  // El dueño de OTRO taller tampoco, aunque sea dueño.
  const { data: costosB } = await b.cli.rpc("ot_costos", { p_ot: ot.id });
  (costosB?.length ?? 0) === 0
    ? ok("el dueño de B no obtiene los costos de una OT de A")
    : fail("FUGA: el dueño de B leyó costos del taller A");

  console.log("\n[4] Escrituras reservadas al dueño");
  const { error: ePrecio } = await mec.cli
    .from("producto").insert({ taller_id: tallerA, nombre: "Aceite", precio_venta: 1000 });
  ePrecio
    ? ok("el mecánico no puede crear productos")
    : fail("el mecánico creó un producto");

  const { error: ePago } = await mec.cli
    .from("pago").insert({ taller_id: tallerA, ot_id: ot.id, monto: 100 });
  ePago
    ? ok("el mecánico no puede registrar cobros")
    : fail("el mecánico registró un cobro");
}

async function limpiar() {
  for (const id of usuarios) {
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
  // Borrar el usuario arrastra su perfil por cascada, pero no el taller
  // (la FK va de perfil a taller, no al revés). Se borra explícitamente.
  const { error } = await admin
    .from("taller")
    .delete()
    .in("nombre", ["Lubricentro A", "Taller B", "Otro más"]);
  if (error) console.warn("  aviso: no se pudieron borrar los talleres de prueba:", error.message);
}

main()
  .catch((e) => { fallos++; console.error("\nError:", e.message); })
  .finally(async () => {
    await limpiar();
    console.log(fallos === 0 ? "\nAislamiento verificado.\n" : `\n${fallos} verificacion(es) fallaron.\n`);
    process.exit(fallos === 0 ? 0 : 1);
  });
