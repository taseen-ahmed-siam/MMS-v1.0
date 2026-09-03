-- ============================================================
-- MOSQUE MANAGEMENT SYSTEM - SEED DATA
-- Run this AFTER the initial schema migration
-- ============================================================

-- ============================================================
-- ROLES
-- ============================================================

INSERT INTO roles (name, description, is_system) VALUES
  ('super_admin', 'Full system access', true),
  ('admin', 'Mosque administrator', true),
  ('treasurer', 'Handles finances', true),
  ('imam', 'Prayer leader', true),
  ('muazzin', 'Call to prayer', true),
  ('committee_member', 'Committee member', true),
  ('staff', 'General staff', true),
  ('member', 'Regular member', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- PERMISSIONS
-- ============================================================

INSERT INTO permissions (name, module, action, description) VALUES
  ('dashboard.view', 'dashboard', 'view', 'View dashboard'),
  ('prayer.view', 'prayer', 'view', 'View prayer times'),
  ('prayer.create', 'prayer', 'create', 'Create prayer times'),
  ('prayer.update', 'prayer', 'update', 'Update prayer times'),
  ('donation.view', 'donation', 'view', 'View donations'),
  ('donation.create', 'donation', 'create', 'Create donations'),
  ('donation.update', 'donation', 'update', 'Update donations'),
  ('donation.delete', 'donation', 'delete', 'Delete donations'),
  ('expense.view', 'expense', 'view', 'View expenses'),
  ('expense.create', 'expense', 'create', 'Create expenses'),
  ('expense.update', 'expense', 'update', 'Update expenses'),
  ('expense.approve', 'expense', 'approve', 'Approve expenses'),
  ('member.view', 'member', 'view', 'View members'),
  ('member.create', 'member', 'create', 'Create members'),
  ('member.update', 'member', 'update', 'Update members'),
  ('event.manage', 'event', 'manage', 'Manage events'),
  ('announcement.manage', 'announcement', 'manage', 'Manage announcements'),
  ('staff.manage', 'staff', 'manage', 'Manage staff'),
  ('reports.view', 'reports', 'view', 'View reports'),
  ('users.manage', 'users', 'manage', 'Manage users'),
  ('settings.manage', 'settings', 'manage', 'Manage settings'),
  ('audit.view', 'audit', 'view', 'View audit logs')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- ROLE - PERMISSION MAPPING
-- super_admin gets everything (handled in code check, but assign all here)
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- admin gets most permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
  'dashboard.view','prayer.view','prayer.create','prayer.update',
  'donation.view','donation.create','donation.update','donation.delete',
  'expense.view','expense.create','expense.update','expense.approve',
  'member.view','member.create','member.update',
  'event.manage','announcement.manage','staff.manage',
  'reports.view','settings.manage','audit.view'
)
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- treasurer gets financial permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
  'dashboard.view','donation.view','donation.create','donation.update',
  'expense.view','expense.create','expense.update','expense.approve',
  'reports.view'
)
WHERE r.name = 'treasurer'
ON CONFLICT DO NOTHING;

-- imam gets prayer and khutbah
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
  'dashboard.view','prayer.view','prayer.update','announcement.manage'
)
WHERE r.name = 'imam'
ON CONFLICT DO NOTHING;

-- ============================================================
-- MOSQUE SETTINGS (DEFAULT)
-- ============================================================

INSERT INTO mosque_settings (mosque_name, arabic_name, currency, timezone, manual_override)
VALUES ('Al-Noor Mosque', 'مسجد النور', 'BDT', 'Asia/Dhaka', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DONATION FUNDS
-- ============================================================

INSERT INTO donation_funds (name, slug, description, target_amount, collected_amount, status, is_visible, featured) VALUES
  ('General Fund', 'general-fund', 'General operating fund for the mosque', 500000, 0, 'active', true, true),
  ('Construction Fund', 'construction-fund', 'Mosque construction and renovation', 5000000, 0, 'active', true, true),
  ('Ramadan Fund', 'ramadan-fund', 'Support Ramadan programs and iftar', 300000, 0, 'active', true, true),
  ('Zakat Fund', 'zakat-fund', 'Zakat collection and distribution', 1000000, 0, 'active', true, false),
  ('Iftar Fund', 'iftar-fund', 'Daily iftar arrangements during Ramadan', 200000, 0, 'active', true, true),
  ('Madrasa Fund', 'madrasa-fund', 'Support the mosque madrasa', 800000, 0, 'active', true, false),
  ('Emergency Fund', 'emergency-fund', 'Emergency relief and support', 150000, 0, 'active', true, false)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- INCOME CATEGORIES (stored as constants in app, no table needed)
-- EXPENSE CATEGORIES (stored as constants in app)
-- ============================================================

-- ============================================================
-- SAMPLE ANNOUNCEMENT
-- ============================================================

INSERT INTO announcements (title, description, priority, start_date, status)
VALUES (
  'Welcome to Al-Noor Mosque',
  'Assalamu Alaikum! Welcome to our mosque website. Stay updated with prayer times, events, and community announcements.',
  'important',
  CURRENT_DATE,
  'published'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- SAMPLE COMMITTEE MEMBERS
-- ============================================================

INSERT INTO committee_members (name, designation, committee_period, start_date, is_current, display_order) VALUES
  ('Hafiz Maulana Abdullah', 'President', '2024-2026', '2024-01-01', true, 1),
  ('Dr. Muhammad Rahman', 'Vice President', '2024-2026', '2024-01-01', true, 2),
  ('Eng. Karim Uddin', 'Secretary', '2024-2026', '2024-01-01', true, 3),
  ('Md. Shafiqul Islam', 'Joint Secretary', '2024-2026', '2024-01-01', true, 4),
  ('Abdul Mannan', 'Treasurer', '2024-2026', '2024-01-01', true, 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SAMPLE PRAYER TIMES (current date)
-- ============================================================

INSERT INTO prayer_times (date, fajr_adhan, fajr_jamaat, sunrise, dhuhr_adhan, dhuhr_jamaat, asr_adhan, asr_jamaat, maghrib_adhan, maghrib_jamaat, isha_adhan, isha_jamaat)
SELECT
  CURRENT_DATE + s,
  '04:45', '05:15',
  '05:55',
  '12:20', '12:45',
  '15:55', '16:30',
  '18:05', '18:08',
  '19:20', '19:45'
FROM generate_series(0, 6) s
ON CONFLICT (date) DO NOTHING;

-- ============================================================
-- SAMPLE JUM'AH SCHEDULE
-- ============================================================

INSERT INTO jummah_schedules (date, khutbah_time, jamaat_time, imam_name, session_number)
SELECT
  (CURRENT_DATE + (s - EXTRACT(DOW FROM CURRENT_DATE)::int))::date,
  '12:30', '01:00', 'Hafiz Maulana Abdullah', 1
FROM generate_series(0, 6) s
WHERE (CURRENT_DATE + s)::date >= (CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE)::int) % 7))::date
ON CONFLICT DO NOTHING;

-- Insert next Friday's Jum'ah
INSERT INTO jummah_schedules (date, khutbah_time, jamaat_time, imam_name, session_number)
VALUES (
  (CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE)::int + 7) % 7))::date,
  '12:30', '01:00', 'Hafiz Maulana Abdullah', 1
)
ON CONFLICT (date, session_number) DO NOTHING;

-- ============================================================
-- SAMPLE EVENTS
-- ============================================================

INSERT INTO events (title, slug, description, event_type, start_date, speaker, status, featured) VALUES
  (
    'Weekly Tafsir Class',
    'weekly-tafsir-class',
    'Join us every week for an in-depth study and explanation of the Holy Quran.',
    'Tafsir',
    CURRENT_DATE + 3,
    'Hafiz Maulana Abdullah',
    'published',
    true
  ),
  (
    'Youth Islamic Seminar',
    'youth-islamic-seminar',
    'An engaging seminar for young Muslims on building faith and character in modern times.',
    'Youth Seminar',
    CURRENT_DATE + 10,
    'Dr. Muhammad Rahman',
    'published',
    true
  ),
  (
    'Quran Competition',
    'quran-competition',
    'Annual Quran recitation competition for children and adults. Prizes for all categories.',
    'Quran Competition',
    CURRENT_DATE + 20,
    NULL,
    'published',
    false
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SAMPLE KHUTBAH
-- ============================================================

INSERT INTO khutbahs (title, slug, speaker, date, description, status) VALUES
  (
    'The Importance of Salah in Daily Life',
    'importance-of-salah',
    'Hafiz Maulana Abdullah',
    CURRENT_DATE - 7,
    'A comprehensive khutbah about establishing regular prayers and its impact on a believer''s life.',
    'published'
  ),
  (
    'Sincerity in Worship',
    'sincerity-in-worship',
    'Hafiz Maulana Abdullah',
    CURRENT_DATE - 14,
    'Understanding the concept of Ikhlas (sincerity) and how it purifies our worship.',
    'published'
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SAMPLE MEMBERS
-- ============================================================

INSERT INTO members (member_id, full_name, father_name, phone, email, address, occupation, blood_group, date_joined, membership_type, status) VALUES
  ('MEM-0001', 'Md. Abul Hossain', 'Late Abdul Karim', '+8801712345678', 'abul@example.com', '123 Main Road, Dhaka', 'Business', 'O+', '2020-01-15', 'lifetime', 'active'),
  ('MEM-0002', 'Md. Rafiqul Islam', 'Md. Sirajul Islam', '+8801812345678', 'rafiq@example.com', '456 Green Avenue, Dhaka', 'Teacher', 'A+', '2021-03-10', 'regular', 'active'),
  ('MEM-0003', 'Md. Kamal Hossain', 'Md. Nurul Hossain', '+8801912345678', NULL, '789 Lake View, Dhaka', 'Engineer', 'B+', '2022-06-20', 'regular', 'active'),
  ('MEM-0004', 'Mrs. Fatema Begum', 'Late Abdul Gafur', '+8801612345678', 'fatema@example.com', '321 Rose Garden, Dhaka', 'Housewife', 'AB+', '2023-02-05', 'honorary', 'active')
ON CONFLICT (member_id) DO NOTHING;

-- ============================================================
-- SAMPLE STAFF
-- ============================================================

INSERT INTO staff (staff_id, name, role, phone, joining_date, salary, employment_status) VALUES
  ('STF-0001', 'Hafiz Maulana Abdullah', 'Imam', '+8801712345678', '2018-01-01', 45000, 'active'),
  ('STF-0002', 'Maulana Yusuf Ali', 'Khatib', '+8801812345678', '2020-06-01', 35000, 'active'),
  ('STF-0003', 'Md. Jashim Uddin', 'Muazzin', '+8801912345678', '2019-09-15', 20000, 'active'),
  ('STF-0004', 'Abdul Barek', 'Khadem', '+8801612345678', '2021-03-01', 15000, 'active')
ON CONFLICT (staff_id) DO NOTHING;

-- ============================================================
-- SAMPLE CONTACT REQUEST
-- ============================================================

INSERT INTO contact_requests (name, phone, email, subject, request_type, message, status)
VALUES (
  'Anonymous Visitor',
  '+8801700000000',
  'visitor@example.com',
  'Volunteer Inquiry',
  'volunteer',
  'Assalamu Alaikum, I would like to volunteer for the mosque. Please let me know how I can help.',
  'new'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- CREATE FIRST SUPER ADMIN
-- ============================================================
-- NOTE: You must:
-- 1. First create a user through Supabase Auth dashboard
-- 2. Then run the following, replacing the UUID with your user's ID:
--
-- UPDATE profiles SET role = 'super_admin', status = 'active' WHERE id = 'REPLACE_WITH_USER_UUID';
-- INSERT INTO user_roles (user_id, role_id)
-- SELECT 'REPLACE_WITH_USER_UUID', id FROM roles WHERE name = 'super_admin';
--
-- ============================================================
