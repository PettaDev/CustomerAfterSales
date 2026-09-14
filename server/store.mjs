import { mkdir } from "node:fs/promises";
import postgres from "postgres";
let sqlite, sql, ready;
async function init() {
  if (process.env.DATABASE_URL) {
    sql = postgres(process.env.DATABASE_URL, {
      max: 3,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 15,
    });
    await sql`CREATE TABLE IF NOT EXISTS records (id text PRIMARY KEY, kind text NOT NULL, data jsonb NOT NULL)`;
    await sql`CREATE INDEX IF NOT EXISTS records_kind_idx ON records (kind)`;
  } else {
    if (process.env.VERCEL)
      throw Object.assign(new Error("Banco de dados não configurado."), {
        status: 503,
      });
    await mkdir(".local", { recursive: true });
    const { DatabaseSync } = await import("node:sqlite");
    sqlite = new DatabaseSync(".local/cases.sqlite");
    sqlite.exec(
      "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, kind TEXT NOT NULL, data TEXT NOT NULL); CREATE INDEX IF NOT EXISTS records_kind_idx ON records(kind);",
    );
  }
}
const ensure = () =>
  (ready ??= init().catch((e) => {
    ready = null;
    throw e;
  }));
export async function get(id) {
  await ensure();
  if (sql) {
    const r = await sql`SELECT data FROM records WHERE id=${id}`;
    return r[0]?.data;
  }
  const r = sqlite.prepare("SELECT data FROM records WHERE id=?").get(id);
  return r ? JSON.parse(r.data) : undefined;
}
export async function put(kind, id, data) {
  await ensure();
  if (sql)
    await sql`INSERT INTO records VALUES (${id},${kind},${sql.json(data)}) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data`;
  else
    sqlite
      .prepare(
        "INSERT INTO records VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      )
      .run(id, kind, JSON.stringify(data));
  return data;
}
export async function list(kind) {
  await ensure();
  if (sql)
    return (
      await sql`SELECT data FROM records WHERE kind=${kind} ORDER BY id`
    ).map((r) => r.data);
  return sqlite
    .prepare("SELECT data FROM records WHERE kind=? ORDER BY id")
    .all(kind)
    .map((r) => JSON.parse(r.data));
}
export async function remove(id) {
  await ensure();
  if (sql) await sql`DELETE FROM records WHERE id=${id}`;
  else sqlite.prepare("DELETE FROM records WHERE id=?").run(id);
}
