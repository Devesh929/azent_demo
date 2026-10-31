// Applies supabase/migrations/*.sql in order, once each, inside a transaction.
// Usage: npm run db:migrate
import { config } from "dotenv";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

config({ path: ".env.local" });

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is not set in .env.local");

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(`
    create schema if not exists ops;
    create table if not exists ops.migrations (name text primary key, applied_at timestamptz not null default now());
    revoke all on schema ops from anon, authenticated;
  `);

  const dir = join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const { rows } = await client.query<{ name: string }>("select name from ops.migrations");
  const applied = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  skip  ${file}`);
      continue;
    }
    const sql = readFileSync(join(dir, file), "utf8");
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into ops.migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log(`  apply ${file}`);
    } catch (err) {
      await client.query("rollback");
      console.error(`  FAIL  ${file}`);
      throw err;
    }
  }
  await client.end();
  console.log("Migrations complete.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
