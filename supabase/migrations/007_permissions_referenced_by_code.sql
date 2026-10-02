-- ============================================================
-- 007_permissions_referenced_by_code.sql
--
-- The app referenced two permission names that were never seeded, so the
-- /admin/roles editor could never grant them and every role silently failed
-- those checks:
--   * expense.delete    - guards deleteExpense() in src/lib/actions/admin.ts
--   * donation.view.own - guards the /admin/my-donations nav entry
--
-- It also backfills dashboard.view for the roles that had no role_permissions
-- rows at all (member, staff, committee_member, muazzin). Without it those
-- users are redirected to /admin/forbidden the moment the app starts reading
-- permissions from the database instead of the old hardcoded map.
--
-- This migration is purely additive. It never deletes or rewrites an existing
-- role_permissions row, so no role gains or loses access that it already had
-- except for the two backfills above.
-- ============================================================

INSERT INTO permissions (name, module, action, description) VALUES
  ('donation.view.own', 'donation', 'view', 'View only your own donations'),
  ('expense.delete', 'expense', 'delete', 'Delete expenses')
ON CONFLICT (name) DO NOTHING;

-- Backfill: every role needs dashboard.view to reach /admin at all.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name = 'dashboard.view'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Preserve behaviour the hardcoded map used to provide: the Admin role could
-- delete expenses, and Members could see their own donations page.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE (r.name = 'admin'   AND p.name = 'expense.delete')
   OR (r.name = 'member' AND p.name = 'donation.view.own')
ON CONFLICT (role_id, permission_id) DO NOTHING;
