-- BRTE schema verification. Read-only, no customer data displayed.
SELECT current_database() AS database_name, current_schema() AS schema_name;
SELECT to_regclass('public.records') AS brte_records_table;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='records'
ORDER BY ordinal_position;
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname='public' AND tablename='records'
ORDER BY indexname;
-- Only run after the table exists:
SELECT kind, count(*)::integer AS record_count
FROM public.records
GROUP BY kind
ORDER BY kind;
