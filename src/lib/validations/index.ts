import { z } from "zod";

const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;

export const paymentMethods = [
  "cash",
  "bank_transfer",
  "bkash",
  "nagad",
  "rocket",
  "card",
  "other",
] as const;

export const donationStatuses = ["pending", "completed", "cancelled", "refunded"] as const;
export const expenseStatuses = ["draft", "pending", "approved", "paid", "rejected"] as const;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const prayerTimeSchema = z.object({
  date: z.string().min(1, "Date is required"),
  fajr_adhan: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  fajr_jamaat: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  sunrise: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  dhuhr_adhan: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  dhuhr_jamaat: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  asr_adhan: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  asr_jamaat: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  maghrib_adhan: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  maghrib_jamaat: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  isha_adhan: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  isha_jamaat: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  notes: z.string().optional(),
});

export const donationSchema = z.object({
  donor_name: z.string().min(2, "Donor name is required"),
  donor_phone: z
    .string()
    .regex(phoneRegex, "Please enter a valid Bangladeshi phone number")
    .optional()
    .or(z.literal("")),
  donor_email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  fund_id: z.string().optional().nullable(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payment_method: z.enum(paymentMethods),
  transaction_id: z.string().optional(),
  donation_date: z.string().min(1, "Date is required"),
  is_anonymous: z.boolean().default(false),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  expense_category: z.string().min(1, "Category is required"),
  vendor: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payment_method: z.enum(paymentMethods),
  date: z.string().min(1, "Date is required"),
  voucher_number: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(expenseStatuses).default("draft"),
});

export const incomeSchema = z.object({
  income_category: z.string().min(1, "Category is required"),
  source: z.string().min(1, "Source is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payment_method: z.enum(paymentMethods),
  reference_number: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
});

export const fundSchema = z.object({
  name: z.string().min(2, "Fund name is required"),
  description: z.string().optional(),
  target_amount: z.coerce.number().min(0, "Target amount cannot be negative"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(["active", "completed", "paused", "cancelled"]),
  is_visible: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export const memberSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  father_name: z.string().optional(),
  phone: z.string().regex(phoneRegex, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  address: z.string().optional(),
  occupation: z.string().optional(),
  blood_group: z.string().optional(),
  emergency_contact: z.string().optional(),
  date_joined: z.string().optional(),
  membership_type: z.enum(["regular", "lifetime", "honorary"]),
  status: z.enum(["active", "inactive", "suspended"]),
  notes: z.string().optional(),
});

export const committeeMemberSchema = z.object({
  name: z.string().min(2, "Name is required"),
  designation: z.string().min(1, "Designation is required"),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  committee_period: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  display_order: z.coerce.number().default(0),
  is_current: z.boolean().default(true),
  biography: z.string().optional(),
});

export const staffSchema = z.object({
  name: z.string().min(2, "Name is required"),
  role: z.string().min(1, "Role is required"),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  address: z.string().optional(),
  joining_date: z.string().optional(),
  salary: z.coerce.number().min(0, "Salary cannot be negative").optional().nullable(),
  employment_status: z.enum(["active", "leave", "inactive", "former"]),
  notes: z.string().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  event_type: z.string().min(1, "Event type is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  venue: z.string().optional(),
  speaker: z.string().optional(),
  capacity: z.coerce.number().min(0).optional().nullable(),
  registration_enabled: z.boolean().default(false),
  status: z.enum(["draft", "published", "cancelled", "completed"]),
  featured: z.boolean().default(false),
});

export const announcementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["normal", "important", "emergency"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
});

export const khutbahSchema = z.object({
  title: z.string().min(2, "Title is required"),
  speaker: z.string().min(1, "Speaker is required"),
  date: z.string().optional(),
  description: z.string().optional(),
  article: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

export const assetSchema = z.object({
  name: z.string().min(2, "Asset name is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  model: z.string().optional(),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  purchase_date: z.string().optional(),
  purchase_cost: z.coerce.number().min(0).optional().nullable(),
  current_condition: z.enum(["excellent", "good", "fair", "poor", "non-functional"]),
  location: z.string().optional(),
  warranty_expiry: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

export const maintenanceSchema = z.object({
  title: z.string().min(2, "Title is required"),
  asset_id: z.string().optional().nullable(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigned_person: z.string().optional(),
  estimated_cost: z.coerce.number().min(0).optional().nullable(),
  actual_cost: z.coerce.number().min(0).optional().nullable(),
  created_date: z.string().optional(),
  completion_date: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
});

export const documentSchema = z.object({
  title: z.string().min(2, "Title is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  access_level: z.enum(["public", "admin", "restricted"]),
});

export const contactRequestSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  subject: z.string().optional(),
  request_type: z.enum([
    "general",
    "donation",
    "imam_appointment",
    "islamic_question",
    "complaint",
    "suggestion",
    "volunteer",
  ]),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const zakatCollectionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  collection_date: z.string().min(1, "Date is required"),
  fund_source: z.string().optional(),
  notes: z.string().optional(),
});

export const zakatBeneficiarySchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  family_size: z.coerce.number().min(0).optional().nullable(),
  financial_condition: z.string().optional(),
  verification_notes: z.string().optional(),
  status: z.enum(["pending", "verified", "rejected", "active"]),
});

export const zakatDistributionSchema = z.object({
  beneficiary_id: z.string().min(1, "Beneficiary is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  distribution_date: z.string().min(1, "Date is required"),
  distribution_method: z.string().optional(),
  notes: z.string().optional(),
});

export const mosqueSettingsSchema = z.object({
  mosque_name: z.string().min(1, "Mosque name is required"),
  arabic_name: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  website: z.string().optional(),
  facebook: z.string().optional(),
  youtube: z.string().optional(),
  google_maps_url: z.string().optional(),
  currency: z.string().default("BDT"),
  timezone: z.string().default("Asia/Dhaka"),
  hijri_adjustment: z.coerce.number().default(0),
  footer_text: z.string().optional(),
  prayer_calculation_method: z.string().optional(),
  prayer_madhab: z.string().optional(),
  manual_override: z.boolean().default(true),
  donation_instructions: z.string().optional(),
  bank_details: z.string().optional(),
  bkash_number: z.string().optional(),
  nagad_number: z.string().optional(),
  rocket_number: z.string().optional(),
});
