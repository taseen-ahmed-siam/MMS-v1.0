-- Grant Muazzin announcement management access for existing databases.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'muazzin'
  AND p.name = 'announcement.manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;
