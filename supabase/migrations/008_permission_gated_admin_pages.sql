-- ============================================================
-- 008_permission_gated_admin_pages.sql
--
-- Eleven admin pages were guarded by role name only (requireAdminRole()), so a
-- super admin could not actually delegate them in /admin/roles - unchecking a
-- role did nothing for these sections:
--   /admin/khutbah /admin/funds /admin/income /admin/committee /admin/assets
--   /admin/maintenance /admin/documents /admin/requests /admin/ramadan
--   /admin/zakat /admin/users
--
-- Each one now maps to a real permission row. Every module follows the
-- view + manage convention already used by donation/expense/member, so a role
-- can be given read-only access without also being able to create, edit or
-- delete records:
--   <module>.view   -> page guard + sidebar nav entry
--   <module>.manage -> create/update/delete server actions
--
-- ramadan has no server actions of its own, so it only needs a view row.
--
-- Grants are unchanged on purpose: the same permissions go to 'admin' and
-- 'super_admin', which is exactly what requireAdminRole() allowed before. This
-- migration is purely additive and never rewrites an existing row.
-- ============================================================

INSERT INTO permissions (name, module, action, description) VALUES
  -- Khutbah
  ('khutbah.view',     'khutbah',     'view',   'View khutbah archive'),
  ('khutbah.manage',   'khutbah',     'manage', 'Create, edit and delete khutbahs'),

  -- Donation funds
  ('fund.view',        'fund',        'view',   'View donation funds'),
  ('fund.manage',      'fund',        'manage', 'Create and edit donation funds'),

  -- Other income
  ('income.view',      'income',      'view',   'View other income records'),
  ('income.manage',    'income',      'manage', 'Create, edit and delete other income'),

  -- Committee
  ('committee.view',   'committee',   'view',   'View committee members'),
  ('committee.manage', 'committee',   'manage', 'Create, edit and delete committee members'),

  -- Assets
  ('asset.view',       'asset',       'view',   'View mosque assets'),
  ('asset.manage',     'asset',       'manage', 'Create, edit and delete mosque assets'),

  -- Maintenance
  ('maintenance.view',   'maintenance', 'view',   'View maintenance requests'),
  ('maintenance.manage', 'maintenance', 'manage', 'Create, edit and delete maintenance requests'),

  -- Documents
  ('document.view',   'document',    'view',   'View mosque documents'),
  ('document.manage', 'document',    'manage', 'Upload and delete mosque documents'),

  -- Contact requests
  ('request.view',    'request',     'view',   'View contact requests'),
  ('request.manage',  'request',     'manage', 'Approve and delete contact requests'),

  -- Ramadan
  ('ramadan.view',    'ramadan',     'view',   'View Ramadan programme'),

  -- Zakat
  ('zakat.view',      'zakat',       'view',   'View zakat collections and beneficiaries'),
  ('zakat.manage',    'zakat',       'manage', 'Create and edit zakat records'),

  -- Users: read access is separate from users.manage, which stays
  -- super-admin only, so a delegate can be given the read-only list.
  ('users.view',      'users',       'view',   'View the user list')
ON CONFLICT (name) DO NOTHING;

-- Preserve the previous requireAdminRole() behaviour for both admin roles.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('admin', 'super_admin')
  AND p.name IN (
    'khutbah.view',   'khutbah.manage',
    'fund.view',      'fund.manage',
    'income.view',    'income.manage',
    'committee.view', 'committee.manage',
    'asset.view',     'asset.manage',
    'maintenance.view',   'maintenance.manage',
    'document.view',  'document.manage',
    'request.view',   'request.manage',
    'ramadan.view',
    'zakat.view',     'zakat.manage',
    'users.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;