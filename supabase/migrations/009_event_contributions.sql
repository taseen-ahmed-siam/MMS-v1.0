-- ============================================================
-- EVENT CONTRIBUTION TRACKING
-- ============================================================
-- `events.fund_id`, `events.contribution_*`, `event_members` and
-- `contribution_reminder_emails` were appended to 001 after that migration had
-- already been applied to live databases, so an existing project would never
-- pick them up through the normal migration chain. Everything below is
-- idempotent: it is a no-op on a fresh install (001 already created the
-- objects) and creates whatever is missing everywhere else.
--
-- Design note: no duplicate money is stored here. `event_members.assigned_amount`
-- is the only new amount, and it is a target, not a ledger. Collected totals,
-- paid amounts and Completed/Incomplete status are always derived from approved
-- `donations` rows (status = 'completed') that carry `donations.member_id`.

-- ============================================================
-- COLUMNS
-- ============================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS fund_id UUID REFERENCES donation_funds(id) ON DELETE SET NULL;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS contribution_amount NUMERIC(12,2) DEFAULT 0;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS contribution_start_date DATE;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS contribution_due_date DATE;

-- `donations.member_id` is the payment -> member link the whole feature reads
-- from. It was appended to 001 after that migration had already been applied, so
-- it exists in the repository but never reached an existing database. Added here
-- for the same reason as the tables below: a no-op on a fresh install, the actual
-- fix everywhere else.
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_donations_member_id ON donations(member_id);

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS event_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  assigned_amount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (event_id, member_id)
);

CREATE TABLE IF NOT EXISTS contribution_reminder_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent','failed'))
);

-- Backfill the new column for donations that carry a `user_id` but no `member_id`.
-- Runs after the ALTER above, so it is a no-op where 001 already had the column.
-- Matching is on the account link only -- never on a name. The correlated subquery
-- keeps this to one row per donation even if a user somehow owns several member
-- records.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'donations' AND column_name = 'user_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'user_id'
  ) THEN
    UPDATE donations d
    SET member_id = (
      SELECT m.id
      FROM members m
      WHERE m.user_id = d.user_id
      ORDER BY m.created_at
      LIMIT 1
    )
    WHERE d.member_id IS NULL
      AND d.user_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM members m WHERE m.user_id = d.user_id);
  END IF;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_event_members_event_id ON event_members(event_id);
CREATE INDEX IF NOT EXISTS idx_event_members_member_id ON event_members(member_id);
CREATE INDEX IF NOT EXISTS idx_contribution_reminder_emails_event_id
  ON contribution_reminder_emails(event_id);
CREATE INDEX IF NOT EXISTS idx_contribution_reminder_emails_member_id
  ON contribution_reminder_emails(member_id);
CREATE INDEX IF NOT EXISTS idx_events_fund_id ON events(fund_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- These two tables were created without RLS in 001, which left them readable by
-- any client holding the anon key. Members' names, phones, emails and the full
-- reminder history all live here, so both are locked down behind `event.manage`.

ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_reminder_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_members_admin_all ON event_members;
CREATE POLICY event_members_admin_all ON event_members
  FOR ALL
  USING (public.has_permission('event.manage') OR public.current_user_role() = 'super_admin')
  WITH CHECK (public.has_permission('event.manage') OR public.current_user_role() = 'super_admin');

DROP POLICY IF EXISTS contribution_reminder_emails_admin_all ON contribution_reminder_emails;
CREATE POLICY contribution_reminder_emails_admin_all ON contribution_reminder_emails
  FOR ALL
  USING (public.has_permission('event.manage') OR public.current_user_role() = 'super_admin')
  WITH CHECK (public.has_permission('event.manage') OR public.current_user_role() = 'super_admin');

-- No public read policy on purpose: contribution status is financial member data.