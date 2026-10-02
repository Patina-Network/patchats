-- Admin allowlist. Rows are inserted by hand (psql against the target database) --
-- there is deliberately no API or UI for managing them, so the application has no
-- write path to its own permission table. Consulted once per sign-in, so grants and
-- revocations take effect at the member's next magic-link login.
--
-- Keyed by email rather than member id, matching magic_link_tokens: an address can be
-- allowlisted before the person signs up, and the grant survives a member row being
-- rewritten. No FK to members -- the grant only has an effect at login, where the
-- member row must exist anyway, so a dangling row is inert rather than dangerous.

-- The single definition of a canonical address, shared by the write path (the trigger
-- below) and the read path (AdminRepo). Having exactly one definition is the point:
-- if writes normalised one way and lookups another, a correctly-listed admin would
-- silently be granted nothing. Deliberately not scoped to admins -- the member domain
-- stores raw addresses today and should adopt this.
--
-- BTRIM is given an explicit character set because the bare one-argument form strips
-- spaces only, letting a tab- or newline-prefixed address through.
--
-- CAUTION: existing rows are normalised under whatever rules were in force when they
-- were written. Changing this function requires re-normalising admins in the same
-- migration, or previously-stored rows stop matching.
CREATE OR REPLACE FUNCTION normalize_email(addr TEXT) RETURNS TEXT
    LANGUAGE sql IMMUTABLE STRICT AS
$$ SELECT LOWER(BTRIM(addr, E' \t\n\r\f\v')) $$;

CREATE TABLE IF NOT EXISTS "admins" (
    email TEXT PRIMARY KEY,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Belt and braces. The trigger fires first and always satisfies this, so it never
    -- rejects a human's insert; it is an assertion that normalisation actually ran
    -- (it would catch, say, a session with triggers disabled) and documents the invariant.
    CONSTRAINT admins_email_normalized CHECK (email = normalize_email(email))
);

-- Normalise on write rather than rejecting un-normalised input. Pasting
-- '  Ann@Example.COM  ' stores 'ann@example.com' instead of erroring, while the primary
-- key still guarantees one row per address -- which is what makes revocation safe. Were
-- casing variants allowed to coexist as separate rows, DELETE of one would report
-- success and silently leave the other still granting admin.
CREATE OR REPLACE FUNCTION admins_normalize_email() RETURNS TRIGGER
    LANGUAGE plpgsql AS
$$
BEGIN
    NEW.email := normalize_email(NEW.email);
    RETURN NEW;
END;
$$;

CREATE TRIGGER admins_normalize_email_before_write
    BEFORE INSERT OR UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION admins_normalize_email();

-- Stored addresses are always canonical, so revocation must normalise its predicate too:
--   DELETE FROM admins WHERE email = normalize_email('Dana@Example.com');
-- A bare `WHERE email = 'Dana@Example.com'` matches nothing and reports success.
