import { mkdir } from "node:fs/promises";
import postgres from "postgres";
import { randomUUID } from "node:crypto";

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
      await sql`CREATE INDEX IF NOT EXISTS records_case_moderation_created_idx ON records (kind, (COALESCE(data->>'moderationState', 'active')), ((data->>'createdAt')) DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS records_case_owner_created_idx ON records (kind, ((data->>'owner')), ((data->>'createdAt')) DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS records_evidence_case_fingerprint_idx ON records (kind, ((data->>'caseId')), ((data->>'fingerprint')))`;
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

/**
 * Atomic fixed-window rate limiter. PostgreSQL upsert evaluates the increment
 * under its row lock: concurrent serverless requests cannot lose updates.
 * Local SQLite uses a synchronous read/modify/write transaction in one event loop.
 * Stores only caller-supplied already-hashed identifiers; never an IP or email.
 */
export async function consumeRate(key, { max, windowMs, cooldownMs = 0 } = {}) {
  await ensure();
  if (!/^[a-z0-9-]{8,160}$/i.test(key)) throw new Error("Invalid rate key");
  if (!Number.isInteger(max) || max < 1 || max > 10000) throw new Error("Invalid rate limit");
  if (!Number.isInteger(windowMs) || windowMs < 1000) throw new Error("Invalid window");
  const now = Date.now();
  const requestId = randomUUID();
  let record;

  if (sql) {
    const rows = await sql`
      INSERT INTO records (id, kind, data)
      VALUES (${key}, 'rate', jsonb_build_object(
        'count', 1, 'until', ${now + windowMs}::bigint,
        'lastAt', ${now}::bigint, 'requestId', ${requestId}
      ))
      ON CONFLICT (id) DO UPDATE SET
        data = CASE
          WHEN COALESCE((records.data->>'until')::bigint, 0) <= ${now}::bigint THEN
            jsonb_build_object('count', 1, 'until', ${now + windowMs}::bigint,
              'lastAt', ${now}::bigint, 'requestId', ${requestId})
          WHEN COALESCE((records.data->>'count')::int, 0) >= ${max}
               OR (${cooldownMs}::bigint > 0
                   AND ${now}::bigint - COALESCE((records.data->>'lastAt')::bigint, 0) < ${cooldownMs}::bigint)
          THEN records.data
          ELSE jsonb_build_object('count', COALESCE((records.data->>'count')::int, 0) + 1,
            'until', (records.data->>'until')::bigint,
            'lastAt', ${now}::bigint, 'requestId', ${requestId})
        END
      RETURNING data
    `;
    record = rows[0]?.data;
  } else {
    const previousRow = sqlite.prepare("SELECT data FROM records WHERE id=?").get(key);
    const previous = previousRow ? JSON.parse(previousRow.data) : null;
    const active = previous && Number(previous.until) > now;
    const blocked = active && (Number(previous.count) >= max ||
      (cooldownMs > 0 && now - Number(previous.lastAt || 0) < cooldownMs));
    record = blocked ? previous : {
      count: active ? Number(previous.count) + 1 : 1,
      until: active ? Number(previous.until) : now + windowMs,
      lastAt: now,
      requestId,
    };
    if (!blocked) sqlite.prepare(
      "INSERT INTO records (id,kind,data) VALUES (?,'rate',?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
    ).run(key, JSON.stringify(record));
  }
  return {
    allowed: record?.requestId === requestId,
    retryAfterMs: Math.max(1000, (record?.until || now + windowMs) - now),
  };
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

export async function listCases({ limit = 100, offset = 0, status = "", query = "", moderation = "active", owner = "", unassigned = false } = {}) {
  await ensure();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 200));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const normalizedStatus = status && status !== "all" ? String(status) : "";
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const normalizedModeration = ["active", "spam", "duplicate", "archived", "all"].includes(String(moderation))
    ? String(moderation)
    : "active";
  const normalizedOwner = String(owner || "").trim();
  const onlyUnassigned = Boolean(unassigned);

  if (sql) {
    const like = `%${normalizedQuery}%`;
    const rows = await sql`
      SELECT data
      FROM records
      WHERE kind='case'
        AND (${normalizedStatus}='' OR data->>'status'=${normalizedStatus})
        AND (${normalizedModeration}='all' OR COALESCE(data->>'moderationState', 'active')=${normalizedModeration})
        AND (${normalizedOwner}='' OR COALESCE(data->>'owner', '')=${normalizedOwner})
        AND (${onlyUnassigned}=false OR COALESCE(data->>'owner', '')='')
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
        AND (${normalizedModeration}='all' OR COALESCE(data->>'moderationState', 'active')=${normalizedModeration})
        AND (${normalizedOwner}='' OR COALESCE(data->>'owner', '')=${normalizedOwner})
        AND (${onlyUnassigned}=false OR COALESCE(data->>'owner', '')='')
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
    .filter((c) => normalizedModeration === "all" || (c.moderationState || "active") === normalizedModeration)
    .filter((c) => !normalizedOwner || (c.owner || "") === normalizedOwner)
    .filter((c) => !onlyUnassigned || !c.owner)
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
      WHERE kind='case' AND COALESCE(data->>'moderationState', 'active')='active'
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
    if ((c.moderationState || "active") !== "active") continue;
    stats.total += 1;
    if (c.status in stats) stats[c.status] += 1;
  }
  return stats;
}


/** Only aggregate yes/no votes, never return client information. */
export async function helpFeedbackStats() {
  await ensure();
  if (sql) {
    const rows = await sql`
      SELECT data->>'slug' AS slug,
        count(*)::int AS total,
        (count(*) FILTER (WHERE data->>'helpful'='true'))::int AS helpful
      FROM records WHERE kind='help_feedback'
      GROUP BY data->>'slug'
    `;
    return rows.map(row=>({slug:row.slug,total:Number(row.total),helpful:Number(row.helpful)}));
  }
  const counts = new Map();
  for (const vote of await list("help_feedback")) {
    const item=counts.get(vote.slug)||{slug:vote.slug,total:0,helpful:0};
    item.total++;
    if(vote.helpful===true)item.helpful++;
    counts.set(vote.slug,item);
  }
  return [...counts.values()];
}

export async function ownerStats() {
  await ensure();
  if (sql) {
    const rows = await sql`
      SELECT
        COALESCE(data->>'owner', '') AS owner,
        count(*)::int AS total,
        (count(*) FILTER (WHERE COALESCE(data->>'status', 'received') <> 'resolved'))::int AS active
      FROM records
      WHERE kind='case' AND COALESCE(data->>'moderationState', 'active')='active'
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
    if ((c.moderationState || "active") !== "active") continue;
    const owner = String(c.owner || "");
    const current = counts.get(owner) || { owner, total: 0, active: 0 };
    current.total += 1;
    if (c.status !== "resolved") current.active += 1;
    counts.set(owner, current);
  }
  return [...counts.values()];
}

export async function evidenceUsage(caseId, { pendingSince = "" } = {}) {
  await ensure();
  if (sql) {
    const rows = await sql`
      SELECT
        count(*)::int AS records,
        (count(*) FILTER (
          WHERE data->>'uploaded'='true'
             OR (${pendingSince}<>'' AND COALESCE(data->>'createdAt', '') >= ${pendingSince})
        ))::int AS files,
        COALESCE(sum(NULLIF(data->>'size', '')::bigint) FILTER (
          WHERE data->>'uploaded'='true'
             OR (${pendingSince}<>'' AND COALESCE(data->>'createdAt', '') >= ${pendingSince})
        ), 0)::bigint AS bytes
      FROM records
      WHERE kind='evidence' AND data->>'caseId'=${caseId}
    `;
    return {
      records: Number(rows[0]?.records || 0),
      files: Number(rows[0]?.files || 0),
      bytes: Number(rows[0]?.bytes || 0),
    };
  }
  const rows = await listByCase("evidence", caseId);
  const active = rows.filter((item) =>
    item.uploaded || (pendingSince && String(item.createdAt || "") >= pendingSince)
  );
  return {
    records: rows.length,
    files: active.length,
    bytes: active.reduce((sum, item) => sum + Number(item.size || 0), 0),
  };
}

export async function findEvidenceByFingerprint(caseId, fingerprint, { pendingSince = "" } = {}) {
  await ensure();
  if (!fingerprint) return null;
  if (sql) {
    const rows = await sql`
      SELECT data
      FROM records
      WHERE kind='evidence'
        AND data->>'caseId'=${caseId}
        AND data->>'fingerprint'=${fingerprint}
        AND (
          data->>'uploaded'='true'
          OR (${pendingSince}<>'' AND COALESCE(data->>'createdAt', '') >= ${pendingSince})
        )
      ORDER BY (data->>'uploaded'='true') DESC, data->>'createdAt' DESC
      LIMIT 1
    `;
    return rows[0]?.data || null;
  }
  const rows = await listByCase("evidence", caseId);
  return rows.find((item) =>
    item.fingerprint === fingerprint &&
    (item.uploaded || (pendingSince && String(item.createdAt || "") >= pendingSince))
  ) || null;
}

export async function remove(id) {
  await ensure();
  if (sql) await sql`DELETE FROM records WHERE id=${id}`;
  else sqlite.prepare("DELETE FROM records WHERE id=?").run(id);
}
