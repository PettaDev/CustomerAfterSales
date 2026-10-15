-- BRTE production schema v001.
-- Matches server/store.mjs at commit 5adb9fa43030ecf311ede0ed4c7384dac784f862.
-- Run once in the intended NEW Neon production database, after verifying current_database().
-- Idempotent and non-destructive: no DELETE, DROP, TRUNCATE, or seed customer data.
-- Access only from server-side DATABASE_URL. Do not expose DB credentials publicly.

BEGIN;

CREATE TABLE IF NOT EXISTS public.records (
  id text PRIMARY KEY,
  kind text NOT NULL,
  data jsonb NOT NULL
);

-- Verify the existing table (if any) is compatible before creating indexes.
DO $$
DECLARE
  actual_fields text;
BEGIN
  SELECT string_agg(column_name || ':' || data_type || ':' || is_nullable, ', ' ORDER BY column_name)
  INTO actual_fields
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'records';

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='records'
      AND column_name='id' AND data_type='text' AND is_nullable='NO'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='records'
      AND column_name='kind' AND data_type='text' AND is_nullable='NO'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='records'
      AND column_name='data' AND data_type='jsonb' AND is_nullable='NO'
  ) THEN
    RAISE EXCEPTION 'BRTE records table has incompatible columns: %', actual_fields;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.records'::regclass AND contype='p'
  ) THEN
    RAISE EXCEPTION 'BRTE records table is missing its primary key';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS records_kind_idx
  ON public.records (kind);
CREATE INDEX IF NOT EXISTS records_kind_case_id_idx
  ON public.records (kind, ((data->>'caseId')));
CREATE INDEX IF NOT EXISTS records_case_status_created_idx
  ON public.records (kind, ((data->>'status')), ((data->>'createdAt')) DESC);

COMMIT;
