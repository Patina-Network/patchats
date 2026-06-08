CREATE TYPE match_prefs AS ENUM ('mentor', 'mentee', 'both');
CREATE TYPE industries AS ENUM (
     'technology', 'finance', 'healthcare', 'education',
     'consulting', 'government', 'nonprofit', 'other'
);


CREATE TABLE IF NOT EXISTS "members" (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    linked_url TEXT,
    bio TEXT,
    referral_source TEXT,
    active BOOLEAN,
    match_pref match_prefs,
    industry industries,
    role TEXT,
    topics TEXT[],
    extra_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
