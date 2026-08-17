
ALTER TABLE "match_cycles"
    ADD COLUMN "is_draft" BOOLEAN NOT NULL DEFAULT TRUE,
    DROP COLUMN "total_matched",
    DROP COLUMN "total_members";


ALTER TABLE "matches"
    DROP COLUMN "feedback_a",
    DROP COLUMN "feedback_b";
