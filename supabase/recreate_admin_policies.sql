-- ============================================================
-- RECREATE ADMIN RLS POLICIES (rerun after DROP CASCADE on has_permission)
-- Mirrors supabase/migrations/001_initial_schema.sql
-- Run all in the Supabase SQL Editor
-- ============================================================

-- DONATIONS
CREATE POLICY "donations_admin_read" ON donations FOR SELECT USING (public.has_permission('donation.view') OR public.current_user_role() = 'super_admin');
CREATE POLICY "donations_admin_write" ON donations FOR INSERT WITH CHECK (public.has_permission('donation.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "donations_admin_update" ON donations FOR UPDATE USING (public.has_permission('donation.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "donations_admin_delete" ON donations FOR DELETE USING (public.has_permission('donation.delete') OR public.current_user_role() = 'super_admin');

-- EXPENSES
CREATE POLICY "expenses_admin_read" ON expenses FOR SELECT USING (public.has_permission('expense.view') OR public.current_user_role() = 'super_admin');
CREATE POLICY "expenses_admin_write" ON expenses FOR INSERT WITH CHECK (public.has_permission('expense.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "expenses_admin_update" ON expenses FOR UPDATE USING (public.has_permission('expense.update') OR public.has_permission('expense.approve') OR public.current_user_role() = 'super_admin');
CREATE POLICY "expenses_admin_delete" ON expenses FOR DELETE USING (public.has_permission('expense.update') OR public.current_user_role() = 'super_admin');

-- INCOMES
CREATE POLICY "incomes_admin_read" ON incomes FOR SELECT USING (public.has_permission('expense.view') OR public.has_permission('donation.view') OR public.current_user_role() = 'super_admin');
CREATE POLICY "incomes_admin_write" ON incomes FOR INSERT WITH CHECK (public.has_permission('expense.create') OR public.has_permission('donation.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "incomes_admin_update" ON incomes FOR UPDATE USING (public.has_permission('expense.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "incomes_admin_delete" ON incomes FOR DELETE USING (public.has_permission('expense.update') OR public.current_user_role() = 'super_admin');

-- MEMBERS
CREATE POLICY "members_admin_read" ON members FOR SELECT USING (public.has_permission('member.view') OR public.current_user_role() = 'super_admin');
CREATE POLICY "members_admin_write" ON members FOR INSERT WITH CHECK (public.has_permission('member.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "members_admin_update" ON members FOR UPDATE USING (public.has_permission('member.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "members_admin_delete" ON members FOR DELETE USING (public.has_permission('member.update') OR public.current_user_role() = 'super_admin');

-- DONATION FUNDS
CREATE POLICY "funds_admin_read" ON donation_funds FOR SELECT USING (public.has_permission('donation.view') OR public.current_user_role() = 'super_admin');
CREATE POLICY "funds_admin_write" ON donation_funds FOR INSERT WITH CHECK (public.has_permission('donation.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "funds_admin_update" ON donation_funds FOR UPDATE USING (public.has_permission('donation.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "funds_admin_delete" ON donation_funds FOR DELETE USING (public.has_permission('donation.delete') OR public.current_user_role() = 'super_admin');

-- EVENTS
CREATE POLICY "events_admin_read" ON events FOR SELECT USING (public.has_permission('event.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "events_admin_write" ON events FOR INSERT WITH CHECK (public.has_permission('event.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "events_admin_update" ON events FOR UPDATE USING (public.has_permission('event.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "events_admin_delete" ON events FOR DELETE USING (public.has_permission('event.manage') OR public.current_user_role() = 'super_admin');

-- ANNOUNCEMENTS
CREATE POLICY "announcements_admin_read" ON announcements FOR SELECT USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "announcements_admin_write" ON announcements FOR INSERT WITH CHECK (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "announcements_admin_update" ON announcements FOR UPDATE USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "announcements_admin_delete" ON announcements FOR DELETE USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');

-- KHUTBAHS
CREATE POLICY "khutbahs_admin_read" ON khutbahs FOR SELECT USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "khutbahs_admin_write" ON khutbahs FOR INSERT WITH CHECK (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "khutbahs_admin_update" ON khutbahs FOR UPDATE USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "khutbahs_admin_delete" ON khutbahs FOR DELETE USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');

-- JUMMAH
CREATE POLICY "jummah_admin_write" ON jummah_schedules FOR INSERT WITH CHECK (public.has_permission('prayer.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "jummah_admin_update" ON jummah_schedules FOR UPDATE USING (public.has_permission('prayer.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "jummah_admin_delete" ON jummah_schedules FOR DELETE USING (public.has_permission('prayer.update') OR public.current_user_role() = 'super_admin');

-- PRAYER TIMES
CREATE POLICY "prayer_times_admin_write" ON prayer_times FOR INSERT WITH CHECK (public.has_permission('prayer.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "prayer_times_admin_update" ON prayer_times FOR UPDATE USING (public.has_permission('prayer.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "prayer_times_admin_delete" ON prayer_times FOR DELETE USING (public.has_permission('prayer.update') OR public.current_user_role() = 'super_admin');

-- STAFF
CREATE POLICY "staff_admin_read" ON staff FOR SELECT USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "staff_admin_write" ON staff FOR INSERT WITH CHECK (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "staff_admin_update" ON staff FOR UPDATE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "staff_admin_delete" ON staff FOR DELETE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');

-- ASSETS
CREATE POLICY "assets_admin_read" ON assets FOR SELECT USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "assets_admin_write" ON assets FOR INSERT WITH CHECK (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "assets_admin_update" ON assets FOR UPDATE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "assets_admin_delete" ON assets FOR DELETE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');

-- MAINTENANCE
CREATE POLICY "maintenance_admin_read" ON maintenance_requests FOR SELECT USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "maintenance_admin_write" ON maintenance_requests FOR INSERT WITH CHECK (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "maintenance_admin_update" ON maintenance_requests FOR UPDATE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "maintenance_admin_delete" ON maintenance_requests FOR DELETE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');

-- DOCUMENTS
CREATE POLICY "documents_admin_read" ON documents FOR SELECT USING ((public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin') AND (access_level = 'admin' OR access_level = 'restricted'));
CREATE POLICY "documents_admin_write" ON documents FOR INSERT WITH CHECK (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "documents_admin_update" ON documents FOR UPDATE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "documents_admin_delete" ON documents FOR DELETE USING (public.has_permission('staff.manage') OR public.current_user_role() = 'super_admin');

-- COMMITTEE
CREATE POLICY "committee_admin_write" ON committee_members FOR INSERT WITH CHECK (public.has_permission('member.create') OR public.current_user_role() = 'super_admin');
CREATE POLICY "committee_admin_update" ON committee_members FOR UPDATE USING (public.has_permission('member.update') OR public.current_user_role() = 'super_admin');
CREATE POLICY "committee_admin_delete" ON committee_members FOR DELETE USING (public.has_permission('member.update') OR public.current_user_role() = 'super_admin');

-- CONTACT REQUESTS
CREATE POLICY "contacts_admin_read" ON contact_requests FOR SELECT USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "contacts_admin_update" ON contact_requests FOR UPDATE USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "contacts_admin_delete" ON contact_requests FOR DELETE USING (public.has_permission('announcement.manage') OR public.current_user_role() = 'super_admin');

-- ZAKAT
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

-- MOSQUE SETTINGS (managed via RLS too)
CREATE POLICY "mosque_settings_admin_update" ON mosque_settings FOR UPDATE USING (public.has_permission('settings.manage') OR public.current_user_role() = 'super_admin');
CREATE POLICY "mosque_settings_admin_insert" ON mosque_settings FOR INSERT WITH CHECK (public.has_permission('settings.manage') OR public.current_user_role() = 'super_admin');