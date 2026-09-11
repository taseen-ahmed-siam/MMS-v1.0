-- Links a member-role account (auth) to its mosque member record.
-- Created via the Users page ("Also add as mosque member") or the
-- Members page "Add Details" action, so a single person never appears twice.
ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);