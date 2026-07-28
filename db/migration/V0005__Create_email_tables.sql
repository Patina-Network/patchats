CREATE TABLE IF NOT EXISTS "email_templates" (
    id         UUID PRIMARY KEY,
    name       TEXT UNIQUE NOT NULL,
    subject    TEXT NOT NULL,                              -- [] template
    body       TEXT NOT NULL,                              -- [] template
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "email_requests" (
    id           UUID PRIMARY KEY,                         -- requestId
    label        TEXT,
    sender_email TEXT,
    source       TEXT NOT NULL,                            -- 'MANUAL' | 'MATCHING'
    template_id  UUID,
    total_count  INT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_request_template FOREIGN KEY (template_id) REFERENCES email_templates(id)
);

CREATE TABLE IF NOT EXISTS "emails" (
    id              UUID PRIMARY KEY,                       -- emailId
    request_id      UUID NOT NULL,
    matches_id      UUID,                                   -- nullable; future FK to matches
    recipient_1     TEXT NOT NULL,                          -- per1 (always present)
    recipient_2     TEXT,                                   -- per2; NULL for a solo email, set for a pair
    reply_to        TEXT,
    template_id     UUID NOT NULL,                          -- load-bearing: runner renders subject/body from this
    template_values JSONB NOT NULL,                         -- variables merged into the template at send-time
    status          TEXT NOT NULL DEFAULT 'PENDING',        -- PENDING | PROCESSING | SENT | ERROR
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at         TIMESTAMPTZ,
    CONSTRAINT fk_email_request  FOREIGN KEY (request_id)  REFERENCES email_requests(id),
    CONSTRAINT fk_email_template FOREIGN KEY (template_id) REFERENCES email_templates(id)
);

CREATE INDEX IF NOT EXISTS idx_emails_status_created ON emails (status, created_at);                          -- claim query
CREATE INDEX IF NOT EXISTS idx_emails_request        ON emails (request_id);                                 -- progress (Inc 2)
CREATE INDEX IF NOT EXISTS idx_emails_matches        ON emails (matches_id);                                 -- dedup (Inc 4)
CREATE INDEX IF NOT EXISTS idx_emails_recipient_1    ON emails (recipient_1);
CREATE INDEX IF NOT EXISTS idx_emails_recipient_2    ON emails (recipient_2) WHERE recipient_2 IS NOT NULL;   -- partial

-- Seed read-only templates (create/list/delete arrives in Increment 5).
INSERT INTO "email_templates" (id, name, subject, body) VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'Pair',
        replace(
            '[PatChats ' || to_char(now(), 'Month') || '] $${per1.firstName} and $${per2.firstName}, you''ve been paired for PatChats!',
            '$${',
            '$' || '{'
        ),
        replace(
            E'Hey $${per1.firstName} and $${per2.firstName}! \n\nWe''ve paired you two for PatChats this month! Find some time to have a 30 minute coffee chat or video call with your pairing!\nShare a screenshot or selfie of you two in the #pat-chats channel on the Discord server! \n\n$${per1.name} ($${per1.email}): \n$${per1.intro: {Intro missing! Send me an intro to add to the emails.}} \n$${per1.linkedin:}\n\n$${per2.name} ($${per2.email}): \n$${per2.intro: {Intro missing! Send me an intro to add to the emails.}}\n$${per2.linkedin:}\n\nLet me know if you''d like to update your pairing information or want to be taken off the list.\n \nCheers,\nPatina Network',
            '$${',
            '$' || '{'
        )
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'Reminder',
        '[PatChats ' || to_char(now(), 'Month') || '] Reminder: Have you had your PatChat yet?',
        replace(
            E'Hi $${per1.firstName} and $${per2.firstName},\n\nJust a friendly reminder that you were paired for PatChats this month!\nIf you haven''t had your 30 minute coffee chat or video call yet, now''s a great time to schedule it.\nDon''t forget to share a screenshot or selfie in the #pat-chats channel on the Discord server!\n\n$${per1.name} ($${per1.email})\n$${per2.name} ($${per2.email})\n\nLet me know if you''d like to update your pairing information or be taken off the list.\n\nCheers,\nPatina Network',
            '$${',
            '$' || '{'
        )
    )
ON CONFLICT (id) DO NOTHING;
