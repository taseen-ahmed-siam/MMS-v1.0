-- ============================================================
-- MOSQUE MANAGEMENT SYSTEM - FULL DATABASE SCHEMA
-- Run this against Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled in Supabase, but safe to run)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ROLES & PERMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE (user_id, role_id)
);

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role VARCHAR(30) DEFAULT 'member',
  status VARCHAR(20) DEFAULT 'active',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MOSQUE SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS mosque_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mosque_name TEXT NOT NULL DEFAULT 'Al-Noor Mosque',
  arabic_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  facebook TEXT,
  youtube TEXT,
  google_maps_url TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  currency VARCHAR(10) DEFAULT 'BDT',
  timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
  hijri_adjustment INTEGER DEFAULT 0,
  footer_text TEXT,
  prayer_calculation_method TEXT DEFAULT 'Karachi',
  prayer_madhab TEXT DEFAULT 'Hanafi',
  manual_override BOOLEAN DEFAULT true,
  donation_instructions TEXT,
  bank_details TEXT,
  bkash_number TEXT,
  nagad_number TEXT,
  rocket_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRAYER TIMES
-- ============================================================

CREATE TABLE IF NOT EXISTS prayer_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  fajr_adhan TIME NOT NULL,
  fajr_jamaat TIME NOT NULL,
  sunrise TIME NOT NULL,
  dhuhr_adhan TIME NOT NULL,
  dhuhr_jamaat TIME NOT NULL,
  asr_adhan TIME NOT NULL,
  asr_jamaat TIME NOT NULL,
  maghrib_adhan TIME NOT NULL,
  maghrib_jamaat TIME NOT NULL,
  isha_adhan TIME NOT NULL,
  isha_jamaat TIME NOT NULL,
  notes TEXT,
  manual_override BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (date)
);

CREATE TABLE IF NOT EXISTS jummah_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  khutbah_time TIME,
  jamaat_time TIME,
  imam_name TEXT,
  notes TEXT,
  session_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (date, session_number)
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal','important','emergency')),
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  event_type TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  venue TEXT,
  speaker TEXT,
  featured_image TEXT,
  capacity INTEGER,
  registration_enabled BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled','completed')),
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- KHUTBAH
-- ============================================================

CREATE TABLE IF NOT EXISTS khutbahs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  speaker TEXT,
  date DATE,
  description TEXT,
  article TEXT,
  audio_url TEXT,
  video_url TEXT,
  pdf_url TEXT,
  thumbnail_url TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id VARCHAR(30) UNIQUE,
  full_name TEXT NOT NULL,
  father_name TEXT,
  photo_url TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  occupation TEXT,
  blood_group VARCHAR(5),
  emergency_contact TEXT,
  date_joined DATE,
  membership_type VARCHAR(20) DEFAULT 'regular' CHECK (membership_type IN ('regular','lifetime','honorary')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- COMMITTEE MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS committee_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  photo_url TEXT,
  designation TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  committee_period TEXT,
  start_date DATE,
  end_date DATE,
  display_order INTEGER DEFAULT 0,
  is_current BOOLEAN DEFAULT true,
  biography TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STAFF
-- ============================================================

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id VARCHAR(30) UNIQUE,
  name TEXT NOT NULL,
  photo_url TEXT,
  role TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  joining_date DATE,
  salary NUMERIC(12,2),
  employment_status VARCHAR(20) DEFAULT 'active' CHECK (employment_status IN ('active','leave','inactive','former')),
  documents TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- DONATION FUNDS
-- ============================================================

CREATE TABLE IF NOT EXISTS donation_funds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  target_amount NUMERIC(12,2) DEFAULT 0,
  collected_amount NUMERIC(12,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','completed','paused','cancelled')),
  is_visible BOOLEAN DEFAULT true,
  image_url TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DONATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_name TEXT NOT NULL,
  donor_phone TEXT,
  donor_email TEXT,
  fund_id UUID REFERENCES donation_funds(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash','bank_transfer','bkash','nagad','rocket','card','other')),
  transaction_id TEXT,
  donation_date DATE NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled','refunded')),
  receipt_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- INCOME
-- ============================================================

CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  income_category TEXT NOT NULL,
  source TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash','bank_transfer','bkash','nagad','rocket','card','other')),
  reference_number TEXT,
  date DATE NOT NULL,
  description TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- EXPENSES
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_category TEXT NOT NULL,
  vendor TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash','bank_transfer','bkash','nagad','rocket','card','other')),
  date DATE NOT NULL,
  voucher_number TEXT,
  description TEXT,
  receipt_url TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','paid','rejected')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- ASSETS
-- ============================================================

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id VARCHAR(30) UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  purchase_date DATE,
  purchase_cost NUMERIC(12,2),
  current_condition VARCHAR(20) DEFAULT 'good' CHECK (current_condition IN ('excellent','good','fair','poor','non-functional')),
  location TEXT,
  warranty_expiry DATE,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- MAINTENANCE REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id VARCHAR(30) UNIQUE,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  assigned_person TEXT,
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  created_date DATE,
  completion_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  file_url TEXT NOT NULL,
  description TEXT,
  access_level VARCHAR(20) DEFAULT 'admin' CHECK (access_level IN ('public','admin','restricted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- CONTACT REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  subject TEXT,
  request_type VARCHAR(30) DEFAULT 'general' CHECK (request_type IN ('general','donation','imam_appointment','islamic_question','complaint','suggestion','volunteer')),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new','in_review','resolved','closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ZAKAT & CHARITY
-- ============================================================

CREATE TABLE IF NOT EXISTS zakat_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  collection_date DATE NOT NULL,
  fund_source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS zakat_beneficiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  family_size INTEGER,
  financial_condition TEXT,
  verification_notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected','active')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS zakat_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id UUID NOT NULL REFERENCES zakat_beneficiaries(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  distribution_date DATE NOT NULL,
  distribution_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  entity VARCHAR(50),
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_donations_fund_id ON donations(fund_id);
CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_name);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(expense_category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(full_name);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_prayer_times_date ON prayer_times(date);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);

-- ============================================================
-- TRIGGER FOR updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','mosque_settings','prayer_times','jummah_schedules','announcements','events','khutbahs','members','committee_members','staff','donation_funds','donations','incomes','expenses','assets','maintenance_requests','documents','contact_requests','zakat_collections','zakat_beneficiaries','zakat_distributions']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t);
  END LOOP;
END;
$$;

-- ============================================================
-- AUTO UPDATE FUND COLLECTED AMOUNT
-- ============================================================

CREATE OR REPLACE FUNCTION update_fund_collected_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed' AND NEW.fund_id IS NOT NULL) THEN
    UPDATE donation_funds SET collected_amount = collected_amount + NEW.amount, updated_at = NOW() WHERE id = NEW.fund_id;
  ELSIF (TG_OP = 'DELETE' AND OLD.status = 'completed' AND OLD.fund_id IS NOT NULL) THEN
    UPDATE donation_funds SET collected_amount = collected_amount - OLD.amount, updated_at = NOW() WHERE id = OLD.fund_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status <> 'completed' AND NEW.fund_id IS NOT NULL) THEN
    UPDATE donation_funds SET collected_amount = collected_amount - OLD.amount, updated_at = NOW() WHERE id = NEW.fund_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status <> 'completed' AND NEW.status = 'completed' AND NEW.fund_id IS NOT NULL) THEN
    UPDATE donation_funds SET collected_amount = collected_amount + NEW.amount, updated_at = NOW() WHERE id = NEW.fund_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status = 'completed' AND OLD.fund_id <> NEW.fund_id) THEN
    UPDATE donation_funds SET collected_amount = collected_amount - OLD.amount, updated_at = NOW() WHERE id = OLD.fund_id;
    UPDATE donation_funds SET collected_amount = collected_amount + NEW.amount, updated_at = NOW() WHERE id = NEW.fund_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_fund_amount ON donations;
CREATE TRIGGER trg_update_fund_amount
  AFTER INSERT OR UPDATE OR DELETE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_fund_collected_amount();

-- ============================================================
-- HANDLE NEW USER CREATION (create profile)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- UPDATE LAST LOGIN
-- ============================================================

CREATE OR REPLACE FUNCTION handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET last_login = NOW(), updated_at = NOW() WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.sessions;
CREATE TRIGGER on_auth_user_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION handle_user_login();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_id UUID;
  user_role TEXT;
BEGIN
  SELECT p.role INTO user_role FROM public.profiles p WHERE p.id = auth.uid();
  IF user_role = 'super_admin' THEN
    RETURN true;
  END IF;

  SELECT r.id INTO user_role_id
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = auth.uid()
  LIMIT 1;

  RETURN EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = user_role_id AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosque_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE jummah_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE khutbahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE zakat_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE zakat_beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE zakat_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- PUBLIC READ TABLE (anyone can read)
-- mosque_settings: public read
CREATE POLICY "mosque_settings_public_read" ON mosque_settings FOR SELECT USING (true);
CREATE POLICY "mosque_settings_admin_update" ON mosque_settings FOR UPDATE USING (public.has_permission('settings.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "mosque_settings_admin_insert" ON mosque_settings FOR INSERT WITH CHECK (public.has_permission('settings.manage') OR public.current_user_role() = 'super_admin');

-- prayer_times: public read
CREATE POLICY "prayer_times_public_read" ON prayer_times FOR SELECT USING (true);
CREATE POLICY "prayer_times_admin_write" ON prayer_times FOR INSERT WITH CHECK (public.has_permission('prayer.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "prayer_times_admin_update" ON prayer_times FOR UPDATE USING (public.has_permission('prayer.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "prayer_times_admin_delete" ON prayer_times FOR DELETE USING (public.has_permission('prayer.update') OR public.current_user_role() = 'super_admin');

-- jummah_schedules: public read
CREATE POLICY "jummah_public_read" ON jummah_schedules FOR SELECT USING (true);
CREATE POLICY "jummah_admin_write" ON jummah_schedules FOR INSERT WITH CHECK (public.has_permission('prayer.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "jummah_admin_update" ON jummah_schedules FOR UPDATE USING (public.has_permission('prayer.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "jummah_admin_delete" ON jummah_schedules FOR DELETE USING (public.has_permission('prayer.update') OR public.current_user_role() = 'super_admin');

-- announcements: public read only published
CREATE POLICY "announcements_public_read" ON announcements FOR SELECT USING (status = 'published' AND (start_date IS NULL OR start_date <= CURRENT_DATE) AND (end_date IS NULL OR end_date >= CURRENT_DATE));
CREATE POLICY "announcements_admin_read" ON announcements FOR SELECT USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "announcements_admin_write" ON announcements FOR INSERT WITH CHECK (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "announcements_admin_update" ON announcements FOR UPDATE USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "announcements_admin_delete" ON announcements FOR DELETE USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');

-- events: public read only published
CREATE POLICY "events_public_read" ON events FOR SELECT USING (status = 'published');
CREATE POLICY "events_admin_read" ON events FOR SELECT USING (public.has_permission('event.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "events_admin_write" ON events FOR INSERT WITH CHECK (public.has_permission('event.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "events_admin_update" ON events FOR UPDATE USING (public.has_permission('event.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "events_admin_delete" ON events FOR DELETE USING (public.has_permission('event.manage') OR public.current_user_role() = 'super_admin');

-- khutbahs: public read only published
CREATE POLICY "khutbahs_public_read" ON khutbahs FOR SELECT USING (status = 'published');
CREATE POLICY "khutbahs_admin_read" ON khutbahs FOR SELECT USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "khutbahs_admin_write" ON khutbahs FOR INSERT WITH CHECK (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "khutbahs_admin_update" ON khutbahs FOR UPDATE USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "khutbahs_admin_delete" ON khutbahs FOR DELETE USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');

-- committee_members: public read (only current)
CREATE POLICY "committee_public_read" ON committee_members FOR SELECT USING (true);
CREATE POLICY "committee_admin_write" ON committee_members FOR INSERT WITH CHECK (public.has_permission('member.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "committee_admin_update" ON committee_members FOR UPDATE USING (public.has_permission('member.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "committee_admin_delete" ON committee_members FOR DELETE USING (public.has_permission('member.update') OR public.current_user_role() = 'super_admin');

-- donation_funds: public read (visible funds only)
CREATE POLICY "funds_public_read" ON donation_funds FOR SELECT USING (is_visible = true);
CREATE POLICY "funds_admin_read" ON donation_funds FOR SELECT USING (public.has_permission('donation.view') OR public.current_user_role() = 'super_admin');
CREATE POLICY "funds_admin_write" ON donation_funds FOR INSERT WITH CHECK (public.has_permission('donation.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "funds_admin_update" ON donation_funds FOR UPDATE USING (public.has_permission('donation.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "funds_admin_delete" ON donation_funds FOR DELETE USING (public.has_permission('donation.delete') OR public.current_user_role() = 'super_admin');

-- donations: authenticated users only, public can submit
CREATE POLICY "donations_submit" ON donations FOR INSERT WITH CHECK (true);
CREATE POLICY "donations_admin_read" ON donations FOR SELECT USING (public.has_permission('donation.view') OR public.current_user_role() = 'super_admin');
CREATE POLICY "donations_admin_write" ON donations FOR INSERT WITH CHECK (public.has_permission('donation.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "donations_admin_update" ON donations FOR UPDATE USING (public.has_permission('donation.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "donations_admin_delete" ON donations FOR DELETE USING (public.has_permission('donation.delete') OR public.current_user_role() = 'super_admin');

-- incomes: admin only
CREATE POLICY "incomes_admin_read" ON incomes FOR SELECT USING (public.has_permission('expense.view') OR public.has_permission('donation.view') OR public.current_user_role() = 'super_admin');
CREATE POLICY "incomes_admin_write" ON incomes FOR INSERT WITH CHECK (public.has_permission('expense.create') OR public.has_permission('donation.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "incomes_admin_update" ON incomes FOR UPDATE USING (public.has_permission('expense.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "incomes_admin_delete" ON incomes FOR DELETE USING (public.has_permission('expense.update') OR public.current_user_role() = 'super_admin');

-- expenses: admin only
CREATE POLICY "expenses_admin_read" ON expenses FOR SELECT USING (public.has_permission('expense.view') OR public.current_user_role() = 'super_admin');
CREATE POLICY "expenses_admin_write" ON expenses FOR INSERT WITH CHECK (public.has_permission('expense.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "expenses_admin_update" ON expenses FOR UPDATE USING (public.has_permission('expense.update') OR public.has_permission('expense.approve') OR public.current_user_role() = 'super_admin');
CREATE POLICY "expenses_admin_delete" ON expenses FOR DELETE USING (public.has_permission('expense.update') OR public.current_user_role() = 'super_admin');

-- members: admin read
CREATE POLICY "members_admin_read" ON members FOR SELECT USING (public.has_permission('member.view') OR public.current_user_role() = 'super_admin');
CREATE POLICY "members_admin_write" ON members FOR INSERT WITH CHECK (public.has_permission('member.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "members_admin_update" ON members FOR UPDATE USING (public.has_permission('member.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "members_admin_delete" ON members FOR DELETE USING (public.has_permission('member.update') OR public.current_user_role() = 'super_admin');

-- staff: admin only
CREATE POLICY "staff_admin_read" ON staff FOR SELECT USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "staff_admin_write" ON staff FOR INSERT WITH CHECK (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "staff_admin_update" ON staff FOR UPDATE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "staff_admin_delete" ON staff FOR DELETE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');

-- assets: admin only
CREATE POLICY "assets_admin_read" ON assets FOR SELECT USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "assets_admin_write" ON assets FOR INSERT WITH CHECK (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "assets_admin_update" ON assets FOR UPDATE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "assets_admin_delete" ON assets FOR DELETE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');

-- maintenance_requests: admin only
CREATE POLICY "maintenance_admin_read" ON maintenance_requests FOR SELECT USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "maintenance_admin_write" ON maintenance_requests FOR INSERT WITH CHECK (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "maintenance_admin_update" ON maintenance_requests FOR UPDATE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "maintenance_admin_delete" ON maintenance_requests FOR DELETE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');

-- documents: admin only read (restricted access)
CREATE POLICY "documents_admin_read" ON documents FOR SELECT USING ((public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin') AND (access_level = 'admin' OR access_level = 'restricted'));
CREATE POLICY "documents_public_read" ON documents FOR SELECT USING (access_level = 'public');
CREATE POLICY "documents_admin_write" ON documents FOR INSERT WITH CHECK (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "documents_admin_update" ON documents FOR UPDATE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "documents_admin_delete" ON documents FOR DELETE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');

-- contact_requests: public can insert, admin reads
CREATE POLICY "contacts_public_write" ON contact_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "contacts_admin_read" ON contact_requests FOR SELECT USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "contacts_admin_update" ON contact_requests FOR UPDATE USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "contacts_admin_delete" ON contact_requests FOR DELETE USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');

-- zakat: strict access, only super admin/treasurer
CREATE POLICY "zakat_collections_admin" ON zakat_collections FOR SELECT USING (public.has_permission('donation.view') OR public.current_user_role() = 'super_admin');
CREATE POLICY "zakat_collections_write" ON zakat_collections FOR INSERT WITH CHECK (public.has_permission('donation.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "zakat_collections_update" ON zakat_collections FOR UPDATE USING (public.has_permission('donation.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "zakat_collections_delete" ON zakat_collections FOR DELETE USING (public.has_permission('donation.delete') OR public.current_user_role() = 'super_admin');

CREATE POLICY "zakat_beneficiaries_admin" ON zakat_beneficiaries FOR SELECT USING (public.has_permission('donation.view') OR public.current_user_role() = 'super_admin');
CREATE POLICY "zakat_beneficiaries_write" ON zakat_beneficiaries FOR INSERT WITH CHECK (public.has_permission('donation.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "zakat_beneficiaries_update" ON zakat_beneficiaries FOR UPDATE USING (public.has_permission('donation.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "zakat_beneficiaries_delete" ON zakat_beneficiaries FOR DELETE USING (public.has_permission('donation.delete') OR public.current_user_role() = 'super_admin');

CREATE POLICY "zakat_distributions_admin" ON zakat_distributions FOR SELECT USING (public.has_permission('donation.view') OR public.current_user_role() = 'super_admin');
CREATE POLICY "zakat_distributions_write" ON zakat_distributions FOR INSERT WITH CHECK (public.has_permission('donation.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "zakat_distributions_update" ON zakat_distributions FOR UPDATE USING (public.has_permission('donation.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "zakat_distributions_delete" ON zakat_distributions FOR DELETE USING (public.has_permission('donation.delete') OR public.current_user_role() = 'super_admin');

-- audit_logs: super admin / admin only, no writes from client
CREATE POLICY "audit_logs_read" ON audit_logs FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin'));
CREATE POLICY "audit_logs_write" ON audit_logs FOR INSERT WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

-- profiles: user can read/update own, admin can manage all
CREATE POLICY "profiles_own_read" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_admin_read" ON profiles FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin'));
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_write" ON profiles FOR INSERT WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE USING (public.current_user_role() IN ('super_admin', 'admin'));
CREATE POLICY "profiles_admin_delete" ON profiles FOR DELETE USING (public.current_user_role() = 'super_admin');

-- roles: admin read, super admin write
CREATE POLICY "roles_admin_read" ON roles FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin'));
CREATE POLICY "roles_super_write" ON roles FOR INSERT WITH CHECK (public.current_user_role() = 'super_admin');
CREATE POLICY "roles_super_update" ON roles FOR UPDATE USING (public.current_user_role() = 'super_admin');

-- permissions: admin read
CREATE POLICY "permissions_admin_read" ON permissions FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin'));

-- role_permissions: super admin
CREATE POLICY "role_permissions_read" ON role_permissions FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin'));
CREATE POLICY "role_permissions_super_write" ON role_permissions FOR INSERT WITH CHECK (public.current_user_role() = 'super_admin');
CREATE POLICY "role_permissions_super_delete" ON role_permissions FOR DELETE USING (public.current_user_role() = 'super_admin');

-- user_roles: super admin
CREATE POLICY "user_roles_read" ON user_roles FOR SELECT USING (public.current_user_role() IN ('super_admin', 'admin'));
CREATE POLICY "user_roles_super_write" ON user_roles FOR INSERT WITH CHECK (public.current_user_role() = 'super_admin');
CREATE POLICY "user_roles_super_delete" ON user_roles FOR DELETE USING (public.current_user_role() = 'super_admin');
