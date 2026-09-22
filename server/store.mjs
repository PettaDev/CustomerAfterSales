import { mkdir } from "node:fs/promises";
import postgres from "postgres";

let sqlite, sql, ready;

async function init() {
  if (process.env.DATABASE_URL) {
    sql = postgres(process.env.DATABASE_URL, {
      // Serverless instances can scale horizontally. Keep one connection per
      // instance and rely on the Neon pooler instead of creating a connection
      // storm when traffic spikes.
      max: process.env.VERCEL ? 1 : 3,
      prepare: false,
      idle_timeout: 10,
      connect_timeout: 10,
    });

    // Production schema is provisioned/migrated separately. Avoid running DDL
    // on every Vercel cold start. Keep bootstrap behavior for a local Node
    // server that happens to use PostgreSQL.
    if (!process.env.VERCEL) {
      await sql`CREATE TABLE IF NOT EXISTS records (id text PRIMARY KEY, kind text NOT NULL, data jsonb NOT NULL)`;
      await sql`CREATE INDEX IF NOT EXISTS records_kind_idx ON records (kind)`;
      await sql`CREATE INDEX IF NOT EXISTS records_kind_case_id_idx ON records (kind, ((data->>'caseId')))`;
      await sql`CREATE INDEX IF NOT EXISTS records_case_status_created_idx ON records (kind, ((data->>'status')), ((data->>'createdAt')) DESC)`;
    }
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

export async function ping() {
  await ensure();
  const started = Date.now();
  if (sql) await sql`SELECT 1 AS ok`;
  else sqlite.prepare("SELECT 1 AS ok").get();
  return Date.now() - started;
}

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

export async function listByCase(kind, caseId) {
  await ensure();
  if (sql) {
    return (
      await sql`
        SELECT data
        FROM records
        WHERE kind=${kind} AND data->>'caseId'=${caseId}
        ORDER BY COALESCE(data->>'createdAt', data->>'at', data->>'startedAt', id)
      `
    ).map((r) => r.data);
  }
  return sqlite
    .prepare("SELECT data FROM records WHERE kind=? ORDER BY id")
    .all(kind)
    .map((r) => JSON.parse(r.data))
    .filter((r) => r.caseId === caseId);
}

export async function listCases({ limit = 100, offset = 0, status = "", query = "" } = {}) {
  await ensure();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 200));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const normalizedStatus = status && status !== "all" ? String(status) : "";
  const normalizedQuery = String(query || "").trim().toLowerCase();

  if (sql) {
    const like = `%${normalizedQuery}%`;
    const rows = await sql`
      SELECT data
      FROM records
      WHERE kind='case'
        AND (${normalizedStatus}='' OR data->>'status'=${normalizedStatus})
        AND (
          ${normalizedQuery}='' OR
          LOWER(CONCAT_WS(' ', data->>'problem', data->>'model', data->>'id', data->>'name', data->>'country')) LIKE ${like}
        )
      ORDER BY data->>'createdAt' DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;
    const count = await sql`
      SELECT count(*)::int AS total
      FROM records
      WHERE kind='case'
        AND (${normalizedStatus}='' OR data->>'status'=${normalizedStatus})
        AND (
          ${normalizedQuery}='' OR
          LOWER(CONCAT_WS(' ', data->>'problem', data->>'model', data->>'id', data->>'name', data->>'country')) LIKE ${like}
        )
    `;
    return { cases: rows.map((r) => r.data), total: Number(count[0]?.total || 0) };
  }

  const all = sqlite
    .prepare("SELECT data FROM records WHERE kind='case' ORDER BY id")
    .all()
    .map((r) => JSON.parse(r.data))
    .filter((c) => !normalizedStatus || c.status === normalizedStatus)
    .filter((c) => !normalizedQuery || [c.problem, c.model, c.id, c.name, c.country].join(" ").toLowerCase().includes(normalizedQuery))
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return { cases: all.slice(safeOffset, safeOffset + safeLimit), total: all.length };
}

export async function caseStats() {
  await ensure();
  if (sql) {
    const rows = await sql`
      SELECT COALESCE(data->>'status', 'received') AS status, count(*)::int AS count
      FROM records
      WHERE kind='case'
      GROUP BY COALESCE(data->>'status', 'received')
    `;
    const stats = { total: 0, received: 0, reviewing: 0, awaiting_customer: 0, resolved: 0 };
    for (const row of rows) {
      const count = Number(row.count || 0);
      stats.total += count;
      if (row.status in stats) stats[row.status] = count;
    }
    return stats;
  }
  const stats = { total: 0, received: 0, reviewing: 0, awaiting_customer: 0, resolved: 0 };
  for (const c of await list("case")) {
    stats.total += 1;
    if (c.status in stats) stats[c.status] += 1;
  }
  return stats;
}


export async function ownerStats() {
  await ensure();
  if (sql) {
    const rows = await sql`
      SELECT
        COALESCE(data->>'owner', '') AS owner,
        count(*)::int AS total,
        count(*) FILTER (WHERE COALESCE(data->>'status', 'received') <> 'resolved')::int AS active
      FROM records
      WHERE kind='case'
      GROUP BY COALESCE(data->>'owner', '')
    `;
    return rows.map((row) => ({
      owner: String(row.owner || ""),
      total: Number(row.total || 0),
      active: Number(row.active || 0),
    }));
  }

  const counts = new Map();
  for (const c of await list("case")) {
    const owner = String(c.owner || "");
    const current = counts.get(owner) || { owner, total: 0, active: 0 };
    current.total += 1;
    if (c.status !== "resolved") current.active += 1;
    counts.set(owner, current);
  }
  return [...counts.values()];
}

export async function remove(id) {
  await ensure();
  if (sql) await sql`DELETE FROM records WHERE id=${id}`;
  else sqlite.prepare("DELETE FROM records WHERE id=?").run(id);
}
