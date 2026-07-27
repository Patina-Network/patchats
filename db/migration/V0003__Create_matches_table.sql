CREATE TABLE IF NOT EXISTS "matches" (
    id UUID PRIMARY KEY,
    member_a_id UUID NOT NULL,
    member_b_id UUID NOT NULL,
    cycle_id INT NOT NULL,
    CONSTRAINT fk_member_a FOREIGN KEY (member_a_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_member_b FOREIGN KEY (member_b_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cycle FOREIGN KEY (cycle_id) REFERENCES match_cycles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    match_score REAL,
    status TEXT,
    feedback_a TEXT,
    feedback_b TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
