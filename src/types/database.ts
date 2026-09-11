// Database row types for all tables
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: 'active' | 'inactive';
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'super_admin' | 'admin' | 'treasurer' | 'imam' | 'muazzin' | 'committee_member' | 'staff' | 'member';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
}

export interface MosqueSetting {
  id: string;
  mosque_name: string;
  arabic_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  address: string;
  phone: string;
  email: string;
  website: string | null;
  facebook: string | null;
  youtube: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  currency: string;
  timezone: string;
  hijri_adjustment: number;
  footer_text: string | null;
  prayer_calculation_method: string;
  prayer_madhab: string;
  manual_override: boolean;
  donation_instructions: string | null;
  bank_details: string | null;
  bkash_number: string | null;
  nagad_number: string | null;
  rocket_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrayerTime {
  id: string;
  date: string;
  fajr_adhan: string;
  fajr_jamaat: string;
  sunrise: string;
  dhuhr_adhan: string;
  dhuhr_jamaat: string;
  asr_adhan: string;
  asr_jamaat: string;
  maghrib_adhan: string;
  maghrib_jamaat: string;
  isha_adhan: string;
  isha_jamaat: string;
  notes: string | null;
  manual_override: boolean;
  created_at: string;
  updated_at: string;
}

export interface JummahSchedule {
  id: string;
  date: string;
  khutbah_time: string;
  jamaat_time: string;
  imam_name: string | null;
  notes: string | null;
  session_number: number;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  priority: 'normal' | 'important' | 'emergency';
  start_date: string;
  end_date: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  speaker: string | null;
  featured_image: string | null;
  capacity: number | null;
  registration_enabled: boolean;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  featured: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Khutbah {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  date: string;
  description: string | null;
  article: string | null;
  audio_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  thumbnail_url: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Member {
  id: string;
  member_id: string;
  full_name: string;
  father_name: string | null;
  photo_url: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  occupation: string | null;
  blood_group: string | null;
  emergency_contact: string | null;
  date_joined: string;
  membership_type: 'regular' | 'lifetime' | 'honorary';
  status: 'active' | 'inactive' | 'suspended';
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  user_id: string | null;
  deleted_at: string | null;
}

export interface MemberListItem {
  id: string;
  source: "member" | "profile";
  member_id: string | null;
  user_id: string | null;
  full_name: string;
  father_name: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  occupation: string | null;
  blood_group: string | null;
  emergency_contact: string | null;
  date_joined: string | null;
  membership_type: Member['membership_type'] | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface CommitteeMember {
  id: string;
  name: string;
  photo_url: string | null;
  designation: string;
  phone: string | null;
  email: string | null;
  committee_period: string;
  start_date: string;
  end_date: string | null;
  display_order: number;
  is_current: boolean;
  biography: string | null;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  staff_id: string;
  name: string;
  photo_url: string | null;
  role: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  joining_date: string;
  salary: number | null;
  employment_status: 'active' | 'leave' | 'inactive' | 'former';
  documents: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
}

export interface DonationFund {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  target_amount: number;
  collected_amount: number;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  is_visible: boolean;
  image_url: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  donor_name: string;
  donor_phone: string | null;
  donor_email: string | null;
  fund_id: string | null;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'other';
  transaction_id: string | null;
  donation_date: string;
  is_anonymous: boolean;
  notes: string | null;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  user_id: string | null;
  deleted_at: string | null;
}

export interface Income {
  id: string;
  income_category: string;
  source: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'other';
  reference_number: string | null;
  date: string;
  description: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
}

export interface Expense {
  id: string;
  expense_category: string;
  vendor: string | null;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'other';
  date: string;
  voucher_number: string | null;
  description: string | null;
  receipt_url: string | null;
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
}

export interface Asset {
  id: string;
  asset_id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  quantity: number;
  purchase_date: string | null;
  purchase_cost: number | null;
  current_condition: 'excellent' | 'good' | 'fair' | 'poor' | 'non-functional';
  location: string | null;
  warranty_expiry: string | null;
  supplier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface MaintenanceRequest {
  id: string;
  ticket_id: string;
  asset_id: string | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_person: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  created_date: string;
  completion_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Document {
  id: string;
  title: string;
  category: string;
  file_url: string;
  description: string | null;
  access_level: 'public' | 'admin' | 'restricted';
  created_at: string;
  updated_at: string;
  uploaded_by: string | null;
}

export interface ContactRequest {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  subject: string | null;
  request_type: 'general' | 'donation' | 'imam_appointment' | 'islamic_question' | 'complaint' | 'suggestion' | 'volunteer';
  message: string;
  status: 'new' | 'in_review' | 'resolved' | 'closed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ZakatCollection {
  id: string;
  amount: number;
  collection_date: string;
  fund_source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ZakatBeneficiary {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  family_size: number | null;
  financial_condition: string | null;
  verification_notes: string | null;
  status: 'pending' | 'verified' | 'rejected' | 'active';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ZakatDistribution {
  id: string;
  beneficiary_id: string;
  amount: number;
  distribution_date: string;
  distribution_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  module: string;
  entity: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// Form types
export interface DonationFormData {
  donor_name: string;
  donor_phone: string;
  donor_email: string;
  fund_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  donation_date: string;
  is_anonymous: boolean;
  notes: string;
}

export interface ExpenseFormData {
  expense_category: string;
  vendor: string;
  amount: number;
  payment_method: string;
  date: string;
  voucher_number: string;
  description: string;
  status: string;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard types
export interface DashboardStats {
  donationsThisMonth: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  currentBalance: number;
  totalMembers: number;
  activeFunds: number;
  upcomingEvents: number;
  pendingRequests: number;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}
