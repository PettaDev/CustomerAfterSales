import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=path=>readFile(new URL("../"+path,import.meta.url),"utf8");
test("Neon production bootstrap matches store.mjs schema and is non-destructive", async () => {
  const [migration,store,preflight,verify]=await Promise.all([
    read("sql/001_brte_records_initial.sql"),
    read("server/store.mjs"),
    read("sql/000_brte_schema_preflight.sql"),
    read("sql/002_brte_schema_verify.sql"),
  ]);
  const executable = migration.replace(/--[^\n]*/g,"");
  assert.match(executable,/\bBEGIN\s*;/i);
  assert.match(executable,/\bCOMMIT\s*;/i);
  assert.match(executable,/CREATE TABLE IF NOT EXISTS public\.records\s*\(/i);
  for(const column of ["id text PRIMARY KEY","kind text NOT NULL","data jsonb NOT NULL"]) {
    assert.ok(migration.includes(column), "missing column: "+column);
  }
  for(const index of [
    "records_kind_idx","records_kind_case_id_idx","records_case_status_created_idx",
  ]) {
    assert.ok(store.includes(index), "index not present in app: "+index);
    assert.ok(migration.includes(index), "index not present in migration: "+index);
  }
  assert.doesNotMatch(executable,/\b(DROP|TRUNCATE|DELETE|ALTER TABLE|UPDATE|INSERT INTO)\b/i);
  assert.match(preflight,/to_regclass\('public\.records'\)/);
  assert.match(verify,/pg_indexes/);
});
