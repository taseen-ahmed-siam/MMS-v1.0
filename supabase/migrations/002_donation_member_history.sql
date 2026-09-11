-- ============================================================
-- MOSQUE MANAGEMENT SYSTEM - MEMBER DONATION HISTORY
-- Adds user_id to donations so logged-in members' donations
-- can be linked to their account and shown in their own history.
-- Run this against Supabase SQL Editor.
-- ============================================================

-- Link each donation to the authenticated user who made it (if logged in)
ALTER TABLE donations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Speed up "my donations" lookups per user
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);

-- RLS: allow a logged-in user to read only their own donations
DROP POLICY IF EXISTS "donations_own_read" ON donations;
CREATE POLICY "donations_own_read" ON donations FOR SELECT USING (auth.uid() = user_id);