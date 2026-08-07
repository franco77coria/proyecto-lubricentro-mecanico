/**
 * Verificación del esquema contra la base real.
 *
 * Corre con: npm run verify:db
 *
 * No alcanza con que las migraciones apliquen sin error: un permiso mal
 * cerrado no avisa, y una tabla sin RLS tampoco. Esto chequea las cosas que
 * fallan en silencio.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

// .env.local a mano: no vale la pena una dependencia para tres líneas.
for (const linea of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = linea.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let fallos = 0;
const ok = (msg) => console.log(`  OK    ${msg}`);
const fail = (msg) => {
  fallos++;
  console.log(`  FALLA ${msg}`);
};

async function main() {
  await client.connect();

  // --- 1. Toda tabla de public tiene RLS habilitada -------------------------
  console.log("\n[1] RLS habilitada en todas las tablas");
  const sinRls = await client.query(`
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
    order by 1
  `);
  sinRls.rows.length === 0
    ? ok("ninguna tabla quedó sin RLS")
    : fail(`sin RLS: ${sinRls.rows.map((r) => r.relname).join(", ")}`);

  // --- 2. Las columnas de costo no son legibles por la app ------------------
  console.log("\n[2] Columnas de costo cerradas");
  const costos = await client.query(`
    select table_name, column_name, grantee, privilege_type
    from information_schema.column_privileges
    where grantee in ('authenticated', 'anon')
      and column_name in ('costo_unitario')
      and privilege_type = 'SELECT'
  `);
  costos.rows.length === 0
    ? ok("costo_unitario no es legible por authenticated ni anon")
    : fail(`costo_unitario expuesto: ${JSON.stringify(costos.rows)}`);

  const stockUpd = await client.query(`
    select grantee from information_schema.column_privileges
    where grantee = 'authenticated' and table_name = 'producto'
      and column_name = 'stock' and privilege_type = 'UPDATE'
  `);
  stockUpd.rows.length === 0
    ? ok("producto.stock no es escribible por la app")
    : fail("producto.stock sigue siendo escribible por authenticated");

  // --- 3. anon no tiene acceso a nada --------------------------------------
  console.log("\n[3] anon sin privilegios");
  const anon = await client.query(`
    select table_name, privilege_type from information_schema.table_privileges
    where grantee = 'anon' and table_schema = 'public'
  `);
  anon.rows.length === 0
    ? ok("anon no tiene privilegios de tabla en public")
    : fail(`anon conserva ${anon.rows.length} privilegios`);

  // --- 4. Seed del catálogo ------------------------------------------------
  console.log("\n[4] Catálogo de vehículos");
  const { rows: [cat] } = await client.query(`
    select
      (select count(*) from public.marca where estado = 'aprobado') as marcas,
      (select count(*) from public.modelo where estado = 'aprobado') as modelos
  `);
  Number(cat.marcas) > 50
    ? ok(`${cat.marcas} marcas, ${cat.modelos} modelos`)
    : fail(`seed incompleto: ${cat.marcas} marcas`);

  const { rows: [fuzzy] } = await client.query(`
    select count(*)::int as n from public.marca
    where nombre_norm % public.normalizar('citroen')
       or 'citroen' = any(alias)
  `);
  fuzzy.n > 0
    ? ok("la búsqueda sin acentos encuentra Citroën escrito 'citroen'")
    : fail("la búsqueda tolerante a acentos no funciona");

  // --- 5. Patentes ---------------------------------------------------------
  console.log("\n[5] Normalización y validación de patentes");
  await client.query("begin");
  try {
    const { rows: [t] } = await client.query(
      `insert into public.taller (nombre) values ('Taller de prueba') returning id`
    );

    const validas = [
      ["AB123CD", "AB123CD", "auto Mercosur"],
      ["ab 123 cd", "AB123CD", "minúsculas con espacios"],
      ["AB-123-CD", "AB123CD", "con guiones"],
      ["RTF421", "RTF421", "auto viejo"],
      ["123ABC", "123ABC", "moto vieja"],
      ["A123BCD", "A123BCD", "moto Mercosur"],
    ];

    for (const [entrada, esperado, caso] of validas) {
      await client.query("savepoint sp");
      try {
        const { rows: [v] } = await client.query(
          `insert into public.vehiculo (taller_id, patente) values ($1, $2)
           returning patente_norm`,
          [t.id, entrada]
        );
        v.patente_norm === esperado
          ? ok(`${caso}: "${entrada}" → ${v.patente_norm}`)
          : fail(`${caso}: "${entrada}" → ${v.patente_norm}, esperaba ${esperado}`);
      } catch (e) {
        fail(`${caso}: "${entrada}" fue rechazada — ${e.message}`);
      }
      await client.query("rollback to savepoint sp");
    }

    // Duplicado: las tres formas de escribir la misma chapa colapsan en una.
    await client.query("savepoint sp");
    await client.query(`insert into public.vehiculo (taller_id, patente) values ($1, 'AB123CD')`, [t.id]);
    try {
      await client.query(`insert into public.vehiculo (taller_id, patente) values ($1, 'ab-123-cd')`, [t.id]);
      fail("aceptó la misma patente dos veces escrita distinto");
    } catch {
      ok("rechaza el duplicado aunque se escriba con guiones y minúsculas");
    }
    await client.query("rollback to savepoint sp");

    // Basura rechazada, salvo que se marque formato especial.
    await client.query("savepoint sp");
    try {
      await client.query(`insert into public.vehiculo (taller_id, patente) values ($1, 'HOLA')`, [t.id]);
      fail("aceptó una patente con formato inválido");
    } catch {
      ok("rechaza formatos inválidos");
    }
    await client.query("rollback to savepoint sp");

    await client.query("savepoint sp");
    try {
      await client.query(
        `insert into public.vehiculo (taller_id, patente, formato_especial) values ($1, 'X-9', true)`,
        [t.id]
      );
      ok("formato_especial deja pasar una chapa atípica (importado/clásico)");
    } catch (e) {
      fail(`formato_especial no funcionó: ${e.message}`);
    }
    await client.query("rollback to savepoint sp");

    // --- 6. Numeración de OT ----------------------------------------------
    console.log("\n[6] Numeración de órdenes de trabajo");
    const n1 = await client.query(`select public.siguiente_numero_ot($1) as n`, [t.id]);
    const n2 = await client.query(`select public.siguiente_numero_ot($1) as n`, [t.id]);
    const anio = new Date().getFullYear();
    n1.rows[0].n === `${anio}-00001` && n2.rows[0].n === `${anio}-00002`
      ? ok(`correlativa por taller: ${n1.rows[0].n} → ${n2.rows[0].n}`)
      : fail(`numeración inesperada: ${n1.rows[0].n}, ${n2.rows[0].n}`);

    // --- 7. Checklist por defecto -----------------------------------------
    console.log("\n[7] Plantilla de checklist por defecto");
    await client.query(`select public.crear_checklist_default($1)`, [t.id]);
    const { rows: [chk] } = await client.query(
      `select count(*)::int as n from public.checklist_plantilla_item where taller_id = $1`,
      [t.id]
    );
    chk.n === 11
      ? ok("11 ítems, los mismos que la planilla de Excel")
      : fail(`la plantilla tiene ${chk.n} ítems, esperaba 11`);

    // --- 8. Stock: saldo = ledger -----------------------------------------
    console.log("\n[8] Stock como saldo del ledger");
    const { rows: [p] } = await client.query(
      `insert into public.producto (taller_id, nombre, stock_min) values ($1, 'Filtro de aceite', 5)
       returning id`,
      [t.id]
    );
    await client.query(
      `insert into public.movimiento_stock (taller_id, producto_id, tipo, cantidad, costo_unitario)
       values ($1, $2, 'compra', 10, 8000)`,
      [t.id, p.id]
    );
    await client.query(
      `insert into public.movimiento_stock (taller_id, producto_id, tipo, cantidad, costo_unitario)
       values ($1, $2, 'consumo', -3, 8000)`,
      [t.id, p.id]
    );
    const { rows: [saldo] } = await client.query(
      `select stock, bajo_stock from public.producto where id = $1`, [p.id]
    );
    Number(saldo.stock) === 7
      ? ok("saldo 7 = 10 comprados - 3 consumidos")
      : fail(`saldo ${saldo.stock}, esperaba 7`);

    saldo.bajo_stock === false ? ok("bajo_stock false con 7 sobre un mínimo de 5") : fail("bajo_stock mal calculado");

    await client.query(
      `insert into public.movimiento_stock (taller_id, producto_id, tipo, cantidad, costo_unitario)
       values ($1, $2, 'consumo', -4, 8000)`,
      [t.id, p.id]
    );
    const { rows: [bajo] } = await client.query(
      `select stock, bajo_stock from public.producto where id = $1`, [p.id]
    );
    bajo.bajo_stock === true
      ? ok("bajo_stock pasa a true al caer a 3")
      : fail(`bajo_stock quedó en ${bajo.bajo_stock} con stock ${bajo.stock}`);

    const deriva = await client.query(`select * from public.verificar_saldos_stock()`);
    deriva.rows.length === 0
      ? ok("ningún producto derivó respecto del ledger")
      : fail(`${deriva.rows.length} productos con saldo distinto al ledger`);

    // --- 9. Costos congelados ---------------------------------------------
    console.log("\n[9] Costos congelados y totales calculados por Postgres");
    const { rows: [veh] } = await client.query(
      `insert into public.vehiculo (taller_id, patente) values ($1, 'AA111BB') returning id`, [t.id]
    );
    const { rows: [ot] } = await client.query(
      `insert into public.orden_trabajo (taller_id, vehiculo_id) values ($1, $2) returning id, numero`,
      [t.id, veh.id]
    );
    await client.query(
      `insert into public.ot_item (taller_id, ot_id, tipo, descripcion, producto_id, cantidad, costo_unitario, precio_unitario)
       values ($1, $2, 'repuesto', 'Filtro de aceite', $3, 1, 8000, 12000)`,
      [t.id, ot.id, p.id]
    );
    await client.query(
      `insert into public.ot_item (taller_id, ot_id, tipo, descripcion, cantidad, costo_unitario, precio_unitario)
       values ($1, $2, 'mano_obra', 'Cambio de aceite y filtro', 1, 0, 15000)`,
      [t.id, ot.id]
    );
    const { rows: [tot] } = await client.query(
      `select total_mano_obra, total_repuestos, total from public.orden_trabajo where id = $1`, [ot.id]
    );
    Number(tot.total) === 27000 && Number(tot.total_repuestos) === 12000
      ? ok("totales: repuestos 12000 + mano de obra 15000 = 27000")
      : fail(`totales mal: ${JSON.stringify(tot)}`);

    // El precio del catálogo cambia; la OT vieja no se mueve.
    await client.query(`update public.producto set precio_venta = 20000 where id = $1`, [p.id]);
    const { rows: [tot2] } = await client.query(
      `select total from public.orden_trabajo where id = $1`, [ot.id]
    );
    Number(tot2.total) === 27000
      ? ok("subir el precio del producto no altera la OT ya cargada")
      : fail(`la OT cambió a ${tot2.total} al mover el precio del catálogo`);

    // El log de estados se escribe solo.
    await client.query(`update public.orden_trabajo set estado = 'en_trabajo' where id = $1`, [ot.id]);
    const { rows: [log] } = await client.query(
      `select count(*)::int as n from public.ot_estado_log where ot_id = $1`, [ot.id]
    );
    log.n === 2
      ? ok("el log de estados registró el alta y el cambio")
      : fail(`el log tiene ${log.n} entradas, esperaba 2`);
  } finally {
    // Nada de esto queda en la base.
    await client.query("rollback");
  }

  console.log(
    fallos === 0
      ? "\nTodo verificado.\n"
      : `\n${fallos} verificacion(es) fallaron.\n`
  );
  await client.end();
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error("\nError ejecutando la verificación:", e.message);
  await client.end().catch(() => {});
  process.exit(1);
});
