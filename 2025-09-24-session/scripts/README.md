# Database migrations

Authoritative migration: 012_itsm_schema_refactor.sql

- Use ONLY this migration for production. It enforces JWT-only org scoping, fixes checks, adds per-org sequences, RLS policies, and indexes.
- Older SQL files remain for reference but are deprecated and must NOT be applied.

Apply:
- psql $SUPABASE_DB_URL -f scripts/012_itsm_schema_refactor.sql
- Or via Supabase MCP apply_migration (preferred in CI).
