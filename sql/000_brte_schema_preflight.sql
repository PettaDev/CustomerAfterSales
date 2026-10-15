-- BRTE Neon preflight: read only. Verify target database and table existence.
SELECT current_database() AS database_name, current_schema() AS schema_name;
SELECT to_regclass('public.records') AS existing_records_table;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='records'
ORDER BY ordinal_position;
