-- BRTE abuse-control indexes
-- Run once against the production Neon/PostgreSQL database.
-- DDL intentionally stays out of Vercel cold starts.

CREATE INDEX CONCURRENTLY IF NOT EXISTS records_case_moderation_created_idx
  ON records (kind, (COALESCE(data->>'moderationState', 'active')), ((data->>'createdAt')) DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS records_case_owner_created_idx
  ON records (kind, ((data->>'owner')), ((data->>'createdAt')) DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS records_evidence_case_fingerprint_idx
  ON records (kind, ((data->>'caseId')), ((data->>'fingerprint')));
