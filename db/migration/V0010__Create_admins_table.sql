-- Admin allowlist. Rows are inserted by hand (psql against the target database) --
-- there is deliberately no API or UI for managing them. Consulted once per sign-in,
-- so grants and revocations take effect at the member's next magic-link login.
--
-- Keyed by email rather than member id, matching magic_link_tokens: an address can be
-- allowlisted before the person signs up, and the grant survives a member row being
-- rewritten. No FK to members -- the grant only has an effect at login, where the
-- member row must exist anyway, so a dangling row is inert rather than dangerous.
--
-- The CHECK constraint is the whole safety net for a hand-maintained table: an admin
-- inserted as 'Admin@Example.com' would never match the normalized lookup and would
-- fail silently, so the database rejects it up front instead.
CREATE TABLE IF NOT EXISTS "admins" (
    email TEXT PRIMARY KEY,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT admins_email_normalized CHECK (email = LOWER(BTRIM(email)))
);
