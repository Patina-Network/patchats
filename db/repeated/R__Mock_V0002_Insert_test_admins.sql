-- Local-only: makes one of the mock members from R__Mock_V0001 an admin so the
-- admin-gated routes can be exercised end to end without hand-inserting a row.
-- Never reaches staging or prod -- pom.xml pins Flyway to db/migration only.
INSERT INTO admins (email, note)
VALUES ('avery.chen@example.com', 'Local dev admin (mock member)')
ON CONFLICT (email) DO NOTHING;
