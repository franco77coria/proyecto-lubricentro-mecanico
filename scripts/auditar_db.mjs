import { readFileSync } from "node:fs";
import pg from "pg";

for (const linea of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = linea.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  console.log("=== 1. TABLAS EN PUBLIC ===");
  const tablas = await client.query(`
    select c.relname, c.relrowsecurity, count(i.indexrelid) as num_indices
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_index i on i.indrelid = c.oid
    where n.nspname = 'public' and c.relkind = 'r'
    group by c.relname, c.relrowsecurity
    order by c.relname;
  `);
  console.table(tablas.rows);

  console.log("\n=== 2. FOREIGN KEYS SIN ÍNDICE ===");
  const fkQuery = await client.query(`
    select
      tc.table_name as tabla,
      tc.constraint_name,
      kcu.column_name as columna,
      ccu.table_name as foreign_table,
      ccu.column_name as foreign_column
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
    order by tc.table_name, kcu.column_name;
  `);

  const indexes = await client.query(`
    select tablename, indexname, indexdef
    from pg_indexes
    where schemaname = 'public'
    order by tablename, indexname;
  `);

  const missingFk = [];
  for (const fk of fkQuery.rows) {
    const tableIndexes = indexes.rows.filter(idx => idx.tablename === fk.tabla);
    // An index covers the FK if the index definition includes the column
    const covered = tableIndexes.some(idx => {
      // e.g. "CREATE INDEX ... ON public.tablename USING btree (columna, ...)"
      const regex = new RegExp(`\\(\\s*${fk.columna}\\b`, 'i');
      return regex.test(idx.indexdef);
    });
    if (!covered) {
      missingFk.push({
        tabla: fk.tabla,
        columna: fk.columna,
        fk: fk.constraint_name,
        apunta_a: `${fk.foreign_table}(${fk.foreign_column})`
      });
    }
  }

  if (missingFk.length === 0) {
    console.log("Todas las Foreign Keys tienen índice en sus columnas líderes.");
  } else {
    console.log(`Se encontraron ${missingFk.length} Foreign Keys sin índice apropiado:`);
    console.table(missingFk);
  }

  console.log("\n=== 3. POLÍTICAS RLS EN PUBLIC CON SUBQUERIES ===");
  const rls = await client.query(`
    select tablename, policyname, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
    order by tablename, policyname;
  `);
  console.log(`Total políticas RLS: ${rls.rows.length}`);
  const expensiveRls = rls.rows.filter(r => (r.qual && r.qual.includes('select')) || (r.with_check && r.with_check.includes('select')));
  console.log(`Políticas con subqueries (select): ${expensiveRls.length}`);
  for (const p of expensiveRls) {
    console.log(`- ${p.tablename} -> ${p.policyname} (${p.cmd})`);
  }

  await client.end();
}

main().catch(console.error);
