/**
 * Invitaciones y roles.
 *
 * Corre con: npm run verify:equipo
 *
 * Una invitación es una credencial: quien tenga el token entra a los datos de
 * un taller que no es suyo. Conviene probar que solo funciona para quien fue
 * emitida, una sola vez, y que no sirve vencida.
 */
import { randomBytes } from "node:crypto";
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
const TALLER = `Equipo ${sufijo}`;
const usuarios = [];

async function crearUsuario(etiqueta) {
  const email = `equipo-${etiqueta}-${sufijo}@ejemplo.test`;
  const password = `Equipo!${sufijo}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`${etiqueta}: ${error.message}`);
  usuarios.push(data.user.id);
  const cli = createClient(SB, ANON, { auth: { persistSession: false } });
  await cli.auth.signInWithPassword({ email, password });
  return { cli, email, id: data.user.id };
}

async function main() {
  console.log("\n[1] El dueño invita");
  const dueno = await crearUsuario("dueno");
  const { data: tallerId, error: e0 } = await dueno.cli.rpc("crear_taller", { p_nombre: TALLER });
  if (e0) throw new Error(e0.message);

  const invitado = await crearUsuario("invitado");
  const token = randomBytes(24).toString("base64url");

  const { error: eInv } = await dueno.cli.from("invitacion").insert({
    taller_id: tallerId,
    email: invitado.email,
    rol: "mecanico",
    token,
    expira_en: new Date(Date.now() + 7 * 864e5).toISOString(),
  });
  eInv ? fail(`no se pudo crear la invitación: ${eInv.message}`) : ok("invitación creada");

  console.log("\n[2] El token no sirve para otro email");
  const ajeno = await crearUsuario("ajeno");
  const { error: eAjeno } = await ajeno.cli.rpc("aceptar_invitacion", { p_token: token });
  eAjeno
    ? ok("un tercero con el token no puede usarlo")
    : fail("FUGA: un usuario distinto al invitado entró al taller");

  console.log("\n[3] El invitado entra con el rol correcto");
  const { data: entrado, error: eAcept } = await invitado.cli.rpc("aceptar_invitacion", { p_token: token });
  if (eAcept) fail(`el invitado no pudo entrar: ${eAcept.message}`);
  else {
    entrado === tallerId ? ok("quedó en el taller correcto") : fail("entró a otro taller");
    const { data: perfil } = await admin
      .from("perfil").select("rol").eq("user_id", invitado.id).maybeSingle();
    perfil?.rol === "mecanico"
      ? ok("entró como mecánico, el rol de la invitación")
      : fail(`entró con rol ${perfil?.rol}`);
  }

  console.log("\n[4] El token no se puede reusar");
  const otro = await crearUsuario("otro");
  const { error: eReuso } = await otro.cli.rpc("aceptar_invitacion", { p_token: token });
  eReuso ? ok("una invitación usada ya no sirve") : fail("FUGA: el token se pudo usar dos veces");

  console.log("\n[5] Una invitación vencida no sirve");
  const vencido = randomBytes(24).toString("base64url");
  const tarde = await crearUsuario("tarde");
  await admin.from("invitacion").insert({
    taller_id: tallerId,
    email: tarde.email,
    rol: "mostrador",
    token: vencido,
    expira_en: new Date(Date.now() - 864e5).toISOString(),
  });
  const { error: eVenc } = await tarde.cli.rpc("aceptar_invitacion", { p_token: vencido });
  eVenc ? ok("una invitación vencida es rechazada") : fail("FUGA: entró con una invitación vencida");

  console.log("\n[6] El mecánico no ve lo que no le corresponde");
  const { error: eCostos } = await invitado.cli.rpc("metricas_taller");
  eCostos ? ok("el invitado no accede a los reportes") : fail("FUGA: el mecánico vio los reportes");
}

async function limpiar() {
  await admin.from("taller").delete().eq("nombre", TALLER);
  for (const id of usuarios) await admin.auth.admin.deleteUser(id).catch(() => {});
}

main()
  .catch((e) => { fallos++; console.error("\nError:", e.message); })
  .finally(async () => {
    await limpiar();
    console.log(fallos === 0 ? "\nInvitaciones y roles verificados.\n" : `\n${fallos} verificacion(es) fallaron.\n`);
    process.exit(fallos === 0 ? 0 : 1);
  });
