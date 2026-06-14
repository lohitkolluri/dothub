-- Add a UNIQUE constraint on configs.repo_url to prevent duplicate submissions.
-- This also creates an index for fast duplicate checks.

CREATE UNIQUE INDEX IF NOT EXISTS "configs_repo_url_unique" ON "configs" ("repo_url");
