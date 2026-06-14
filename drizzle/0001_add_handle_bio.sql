-- Add `handle` and `bio` columns to the Auth.js `user` table.
-- handle stores the GitHub username (profile.login) for URL lookups.
-- bio stores the GitHub profile bio.

ALTER TABLE "user" ADD COLUMN "handle" text NOT NULL DEFAULT '';
ALTER TABLE "user" ADD COLUMN "bio" text;

-- Make handle unique after backfilling
CREATE UNIQUE INDEX IF NOT EXISTS "user_handle_unique" ON "user" ("handle");
