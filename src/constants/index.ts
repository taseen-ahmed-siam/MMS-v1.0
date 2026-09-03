export const SITE_CONFIG = {
  name: "Al-Noor Mosque",
  arabicName: "مسجد النور",
  description: "A place of peace, prayer, and community",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

export const PRAYER_NAMES = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
] as const;

export const DONATION_STATUSES = [
  { value: "pending", label: "Pending", color: "text-yellow-600" },
  { value: "completed", label: "Completed", color: "text-green-600" },
  { value: "cancelled", label: "Cancelled", color: "text-red-600" },
  { value: "refunded", label: "Refunded", color: "text-orange-600" },
] as const;

export const EXPENSE_STATUSES = [
  { value: "draft", label: "Draft", color: "text-gray-600" },
  { value: "pending", label: "Pending", color: "text-yellow-600" },
  { value: "approved", label: "Approved", color: "text-blue-600" },
  { value: "paid", label: "Paid", color: "text-green-600" },
  { value: "rejected", label: "Rejected", color: "text-red-600" },
] as const;

export const INCOME_CATEGORIES = [
  "Donation",
  "Membership",
  "Property Rent",
  "Shop Rent",
  "Event Collection",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Electricity",
  "Water",
  "Gas",
  "Internet",
  "Staff Salary",
  "Imam Salary",
  "Muazzin Salary",
  "Maintenance",
  "Cleaning",
  "Construction",
  "Islamic Program",
  "Ramadan",
  "Charity",
  "Other",
] as const;

export const MEMBER_STATUSES = [
  { value: "active", label: "Active", color: "text-green-600" },
  { value: "inactive", label: "Inactive", color: "text-gray-600" },
  { value: "suspended", label: "Suspended", color: "text-red-600" },
] as const;

export const MEMBERSHIP_TYPES = [
  { value: "regular", label: "Regular" },
  { value: "lifetime", label: "Lifetime" },
  { value: "honorary", label: "Honorary" },
] as const;

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const EVENT_TYPES = [
  "Tafsir",
  "Islamic Lecture",
  "Quran Competition",
  "Youth Seminar",
  "Ramadan Event",
  "Charity Program",
  "Workshop",
  "Community Gathering",
  "Other",
] as const;

export const EVENT_STATUSES = [
  { value: "draft", label: "Draft", color: "text-gray-600" },
  { value: "published", label: "Published", color: "text-green-600" },
  { value: "cancelled", label: "Cancelled", color: "text-red-600" },
  { value: "completed", label: "Completed", color: "text-blue-600" },
] as const;

export const ANNOUNCEMENT_PRIORITIES = [
  { value: "normal", label: "Normal", color: "text-gray-600" },
  { value: "important", label: "Important", color: "text-yellow-600" },
  { value: "emergency", label: "Emergency", color: "text-red-600" },
] as const;

export const ASSET_CATEGORIES = [
  "AC",
  "Fan",
  "Microphone",
  "Speaker",
  "Amplifier",
  "Carpet",
  "Generator",
  "IPS",
  "Laptop",
  "CCTV",
  "Furniture",
  "Quran",
  "Other",
] as const;

export const ASSET_CONDITIONS = [
  { value: "excellent", label: "Excellent", color: "text-green-600" },
  { value: "good", label: "Good", color: "text-blue-600" },
  { value: "fair", label: "Fair", color: "text-yellow-600" },
  { value: "poor", label: "Poor", color: "text-orange-600" },
  { value: "non-functional", label: "Non-functional", color: "text-red-600" },
] as const;

export const MAINTENANCE_PRIORITIES = [
  { value: "low", label: "Low", color: "text-gray-600" },
  { value: "medium", label: "Medium", color: "text-yellow-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "urgent", label: "Urgent", color: "text-red-600" },
] as const;

export const MAINTENANCE_STATUSES = [
  { value: "pending", label: "Pending", color: "text-yellow-600" },
  { value: "in_progress", label: "In Progress", color: "text-blue-600" },
  { value: "completed", label: "Completed", color: "text-green-600" },
  { value: "cancelled", label: "Cancelled", color: "text-red-600" },
] as const;

export const DOCUMENT_CATEGORIES = [
  "Registration",
  "Land",
  "Property",
  "Bills",
  "Receipts",
  "Contracts",
  "Committee",
  "Staff",
  "Other",
] as const;

export const CONTACT_REQUEST_TYPES = [
  { value: "general", label: "General Inquiry" },
  { value: "donation", label: "Donation Query" },
  { value: "imam_appointment", label: "Imam Appointment" },
  { value: "islamic_question", label: "Islamic Question" },
  { value: "complaint", label: "Complaint" },
  { value: "suggestion", label: "Suggestion" },
  { value: "volunteer", label: "Volunteer Request" },
] as const;

export const CONTACT_STATUSES = [
  { value: "new", label: "New", color: "text-blue-600" },
  { value: "in_review", label: "In Review", color: "text-yellow-600" },
  { value: "resolved", label: "Resolved", color: "text-green-600" },
  { value: "closed", label: "Closed", color: "text-gray-600" },
] as const;

export const STAFF_ROLES = [
  "Imam",
  "Khatib",
  "Muazzin",
  "Khadem",
  "Cleaner",
  "Security",
  "Office Staff",
] as const;

export const STAFF_STATUSES = [
  { value: "active", label: "Active", color: "text-green-600" },
  { value: "leave", label: "Leave", color: "text-yellow-600" },
  { value: "inactive", label: "Inactive", color: "text-gray-600" },
  { value: "former", label: "Former", color: "text-red-600" },
] as const;

export const COMMITTEE_DESIGNATIONS = [
  "President",
  "Vice President",
  "Secretary",
  "Joint Secretary",
  "Treasurer",
  "Member",
] as const;

export const USER_ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "treasurer", label: "Treasurer" },
  { value: "imam", label: "Imam" },
  { value: "muazzin", label: "Muazzin" },
  { value: "committee_member", label: "Committee Member" },
  { value: "staff", label: "Staff" },
  { value: "member", label: "Member" },
] as const;

export const PRESET_DONATION_AMOUNTS = [500, 1000, 2000, 5000, 10000] as const;

export const PAGE_SIZE = 20;

export const CURRENCY_SYMBOL = "৳";

export const COLORS = {
  primary: "#064E3B",
  secondary: "#065F46",
  accent: "#C8A951",
  background: "#FAF8F2",
  card: "#FFFFFF",
  muted: "#F3F4F0",
  text: "#17201C",
  danger: "#B91C1C",
  success: "#15803D",
  warning: "#B45309",
} as const;
