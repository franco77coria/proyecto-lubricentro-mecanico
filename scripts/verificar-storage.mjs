/**
 * Aislamiento del bucket de fotos entre talleres.
 *
 * Corre con: npm run verify:storage
 *
 * Las fotos de una recepción incluyen la cédula del auto y el estado del
 * vehículo de un cliente. Que un taller pueda leer las de otro sería la misma
 * fuga que en las tablas, pero por una puerta distinta: las políticas de
 * Storage son independientes de las de RLS y hay que probarlas aparte.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const linea of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = linea.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(URL_SB, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BUCKET = "ot-fotos";
let fallos = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const fail = (m) => { fallos++; console.log(`  FALLA ${m}`); };

const sufijo = Date.now();
const usuarios = [];

async function crearDueno(etiqueta, nombreTaller) {
  const email = `storage-${etiqueta}-${sufijo}@ejemplo.test`;
  const password = `Prueba!${sufijo}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`${etiqueta}: ${error.message}`);
  usuarios.push(data.user.id);

  const cli = createClient(URL_SB, ANON, { auth: { persistSession: false } });
  await cli.auth.signInWithPassword({ email, password });
  const { data: tallerId, error: e2 } = await cli.rpc("crear_taller", { p_nombre: nombreTaller });
  if (e2) throw new Error(`crear_taller ${etiqueta}: ${e2.message}`);
  return { cli, tallerId };
}

/** Un PNG mínimo válido, para no depender de archivos externos. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function main() {
  console.log("\n[1] Cada taller sube a su propia carpeta");
  const a = await crearDueno("a", "Storage A");
  const b = await crearDueno("b", "Storage B");

  const pathA = `${a.tallerId}/ot-demo/foto-${sufijo}.png`;
  const { error: eSubidaA } = await a.cli.storage
    .from(BUCKET)
    .upload(pathA, PNG, { contentType: "image/png" });
  eSubidaA ? fail(`A no pudo subir a su carpeta: ${eSubidaA.message}`) : ok("A sube a su carpeta");

  console.log("\n[2] Nadie escribe en la carpeta ajena");
  const pathIntruso = `${a.tallerId}/ot-demo/intruso-${sufijo}.png`;
  const { error: eIntruso } = await b.cli.storage
    .from(BUCKET)
    .upload(pathIntruso, PNG, { contentType: "image/png" });
  eIntruso
    ? ok("B no puede subir dentro de la carpeta de A")
    : fail("FUGA: B escribió un archivo en la carpeta de A");

  console.log("\n[3] Nadie lee la carpeta ajena");
  const { data: descargaB, error: eDescargaB } = await b.cli.storage.from(BUCKET).download(pathA);
  (!descargaB || eDescargaB)
    ? ok("B no puede descargar la foto de A")
    : fail("FUGA: B descargó una foto del taller A");

  const { data: listadoB } = await b.cli.storage.from(BUCKET).list(`${a.tallerId}/ot-demo`);
  (listadoB?.length ?? 0) === 0
    ? ok("B no ve el contenido de la carpeta de A")
    : fail(`FUGA: B listó ${listadoB.length} archivos de A`);

  console.log("\n[4] El dueño sí accede a lo suyo");
  const { data: descargaA } = await a.cli.storage.from(BUCKET).download(pathA);
  descargaA ? ok("A descarga su propia foto") : fail("A no puede leer su propia foto");

  const { data: firmada } = await a.cli.storage.from(BUCKET).createSignedUrl(pathA, 60);
  firmada?.signedUrl ? ok("A genera URL firmada") : fail("A no pudo firmar la URL");

  console.log("\n[5] El bucket no es público");
  const publica = `${URL_SB}/storage/v1/object/public/${BUCKET}/${pathA}`;
  const res = await fetch(publica);
  res.ok
    ? fail(`FUGA: la foto se sirve sin autenticación (HTTP ${res.status})`)
    : ok(`sin sesión no se puede acceder (HTTP ${res.status})`);

  console.log("\n[6] Borrado acotado al propio taller");
  const { error: eBorradoB } = await b.cli.storage.from(BUCKET).remove([pathA]);
  const { data: sigue } = await a.cli.storage.from(BUCKET).download(pathA);
  sigue
    ? ok("B no pudo borrar la foto de A")
    : fail(`FUGA: B borró una foto del taller A ${eBorradoB ? "" : "(sin error)"}`);

  await a.cli.storage.from(BUCKET).remove([pathA]);
}

async function limpiar() {
  const { data: talleres } = await admin
    .from("taller")
    .select("id")
    .in("nombre", ["Storage A", "Storage B"]);

  for (const t of talleres ?? []) {
    const { data: archivos } = await admin.storage.from(BUCKET).list(`${t.id}/ot-demo`);
    if (archivos?.length) {
      await admin.storage.from(BUCKET).remove(archivos.map((f) => `${t.id}/ot-demo/${f.name}`));
    }
  }
  for (const id of usuarios) await admin.auth.admin.deleteUser(id).catch(() => {});
  await admin.from("taller").delete().in("nombre", ["Storage A", "Storage B"]);
}

main()
  .catch((e) => { fallos++; console.error("\nError:", e.message); })
  .finally(async () => {
    await limpiar();
    console.log(fallos === 0 ? "\nStorage aislado correctamente.\n" : `\n${fallos} verificacion(es) fallaron.\n`);
    process.exit(fallos === 0 ? 0 : 1);
  });
