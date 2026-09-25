import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Donation,
  Expense,
  Income,
  Member,
  MemberListItem,
  Event,
  Announcement,
  CommitteeMember,
  Staff,
  DonationFund,
  Khutbah,
  Asset,
  MaintenanceRequest,
  Document,
  ContactRequest,
  AuditLog,
  Role,
  Permission,
  Profile,
  ZakatCollection,
  ZakatBeneficiary,
  ZakatDistribution,
} from "@/types/database";

function isToday(dateStr: string | null | undefined) {
  if (!dateStr) return false;
  const today = new Date();
  return new Date(dateStr + "T00:00:00").toDateString() === today.toDateString();
}

export async function getDashboardStats() {
  const supabase = createAdminClient();
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [
    donations,
    incomes,
    expenses,
    members,
    memberProfiles,
    funds,
    events,
    requests,
  ] = await Promise.all([
    supabase.from("donations").select("*").gte("donation_date", monthStart).is("deleted_at", null),
    supabase.from("incomes").select("*").gte("date", monthStart).is("deleted_at", null),
    supabase.from("expenses").select("*").gte("date", monthStart).is("deleted_at", null),
    supabase.from("members").select("*").is("deleted_at", null),
    supabase.from("profiles").select("*").eq("role", "member"),
    supabase.from("donation_funds").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "published").gte("start_date", today.toISOString().split("T")[0]),
    supabase.from("contact_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const donationsThisMonth = (donations.data || []).filter(
    (d: Donation) => d.status === "completed"
  ).reduce((sum: number, d: Donation) => sum + Number(d.amount), 0);
  const incomeThisMonth = (incomes.data || []).reduce(
    (sum: number, i: Income) => sum + Number(i.amount),
    0
  );
  const expensesThisMonth = (expenses.data || []).reduce(
    (sum: number, e: Expense) => sum + Number(e.amount),
    0
  );

  return {
    donationsThisMonth,
    incomeThisMonth,
    expensesThisMonth,
    currentBalance: incomeThisMonth - expensesThisMonth,
    totalMembers: buildMemberList(
      (members.data as Member[]) ?? [],
      (memberProfiles.data as Profile[]) ?? []
    ).filter((m) => m.status === "active").length,
    activeFunds: funds.count || 0,
    upcomingEvents: events.count || 0,
    pendingRequests: requests.count || 0,
  };
}

export async function getDonationVsExpenseChart() {
  const supabase = await createClient();
  const now = new Date();
  const labels = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${month} ${year}`;
  });
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    .toISOString()
    .split("T")[0];

  const [donations, expenses, incomes] = await Promise.all([
    supabase
      .from("donations")
      .select("amount, donation_date, status")
      .gte("donation_date", startDate)
      .is("deleted_at", null)
      .eq("status", "completed"),
    supabase
      .from("expenses")
      .select("amount, date")
      .gte("date", startDate)
      .is("deleted_at", null),
    supabase
      .from("incomes")
      .select("amount, date")
      .gte("date", startDate)
      .is("deleted_at", null),
  ]);

  const map = new Map<string, { donations: number; expenses: number; income: number }>();
  labels.forEach((l) => map.set(l, { donations: 0, expenses: 0, income: 0 }));

  const monthKey = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`;
  };

  (donations.data || []).forEach((d) => {
    const k = monthKey(d.donation_date);
    if (map.has(k)) map.get(k)!.donations += Number(d.amount);
  });
  (expenses.data || []).forEach((e) => {
    const k = monthKey(e.date);
    if (map.has(k)) map.get(k)!.expenses += Number(e.amount);
  });
  (incomes.data || []).forEach((i) => {
    const k = monthKey(i.date);
    if (map.has(k)) map.get(k)!.income += Number(i.amount);
  });

  return labels.map((l) => ({ name: l, ...map.get(l)! }));
}

export async function getDonationsByFund() {
  const supabase = await createClient();
  const [fundsRes, donationsRes] = await Promise.all([
    supabase.from("donation_funds").select("id, name"),
    supabase
      .from("donations")
      .select("fund_id, amount, status")
      .eq("status", "completed")
      .is("deleted_at", null),
  ]);

  const fundNames = new Map<string, string>();
  (fundsRes.data || []).forEach((f) => fundNames.set(f.id, f.name));

  const totals = new Map<string, number>();
  (donationsRes.data || []).forEach((d) => {
    if (!d.fund_id) return;
    const name = fundNames.get(d.fund_id) || "Other";
    totals.set(name, (totals.get(name) || 0) + Number(d.amount));
  });

  return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
}

export async function getRecentDonations(limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donations")
    .select("*, donation_funds(name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as (Donation & { donation_funds: { name: string } | null })[]) ?? [];
}

export async function getRecentExpenses(limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Expense[]) ?? [];
}

export async function getNewMembers(limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Member[]) ?? [];
}

export async function getRecentActivity(limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as AuditLog[]) ?? [];
}

export async function getDonations({
  search = "",
  status,
  fundId,
  from,
  to,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  fundId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("donations")
    .select("*, donation_funds(name)", { count: "exact" })
    .is("deleted_at", null);

  if (search) {
    query = query.or(`donor_name.ilike.%${search}%,donor_phone.ilike.%${search}%,receipt_number.ilike.%${search}%`);
  }
  if (status) query = query.eq("status", status);
  if (fundId) query = query.eq("fund_id", fundId);
  if (from) query = query.gte("donation_date", from);
  if (to) query = query.lte("donation_date", to);

  const fromIndex = (page - 1) * pageSize;
  const { data, count } = await query
    .order("donation_date", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);

  return {
    data: (data as (Donation & { donation_funds: { name: string } | null })[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getDonationById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donations")
    .select("*, donation_funds(name)")
    .eq("id", id)
    .single();
  return data as (Donation & { donation_funds: { name: string } | null }) | null;
}

export async function getExpenses({
  search = "",
  status,
  category,
  from,
  to,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  category?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("expenses")
    .select("*", { count: "exact" })
    .is("deleted_at", null);

  if (search) {
    query = query.or(
      `vendor.ilike.%${search}%,expense_category.ilike.%${search}%,description.ilike.%${search}%,voucher_number.ilike.%${search}%`
    );
  }
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("expense_category", category);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const fromIndex = (page - 1) * pageSize;
  const { data, count } = await query
    .order("date", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);

  return {
    data: (data as Expense[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getIncomes({
  search = "",
  category,
  from,
  to,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  category?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("incomes")
    .select("*", { count: "exact" })
    .is("deleted_at", null);

  if (search) {
    query = query.or(
      `source.ilike.%${search}%,income_category.ilike.%${search}%,description.ilike.%${search}%`
    );
  }
  if (category) query = query.eq("income_category", category);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const fromIndex = (page - 1) * pageSize;
  const { data, count } = await query
    .order("date", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);

  return {
    data: (data as Income[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export function memberFromMemberRow(row: Member): MemberListItem {
  return {
    source: "member",
    id: row.id,
    member_id: row.member_id,
    user_id: row.user_id ?? null,
    full_name: row.full_name,
    father_name: row.father_name,
    photo_url: row.photo_url,
    phone: row.phone,
    email: row.email,
    address: row.address,
    occupation: row.occupation,
    blood_group: row.blood_group,
    emergency_contact: row.emergency_contact,
    date_joined: row.date_joined,
    membership_type: row.membership_type,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
  };
}

export function memberFromProfile(row: Profile): MemberListItem {
  return {
    source: "profile",
    id: row.id,
    member_id: null,
    user_id: row.id,
    full_name: row.full_name,
    father_name: null,
    photo_url: row.avatar_url,
    phone: row.phone,
    email: row.email,
    address: null,
    occupation: null,
    blood_group: null,
    emergency_contact: null,
    date_joined: row.created_at ? row.created_at.split("T")[0] : null,
    membership_type: null,
    status: row.status,
    notes: null,
    created_at: row.created_at,
  };
}

export function buildMemberList(
  members: Member[],
  profiles: Profile[]
): MemberListItem[] {
  const linkedIds = new Set<string>();
  const memberEmails = new Set<string>();
  members.forEach((m) => {
    if (m.user_id) linkedIds.add(m.user_id);
    if (m.email) memberEmails.add(m.email.toLowerCase());
  });

  const list: MemberListItem[] = members.map(memberFromMemberRow);
  profiles.forEach((profile) => {
    if (profile.role !== "member") return;
    if (linkedIds.has(profile.id)) return;
    if (profile.email && memberEmails.has(profile.email.toLowerCase())) return;
    list.push(memberFromProfile(profile));
  });

  return list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function getMembers({
  search = "",
  status,
  membershipType,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  membershipType?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createClient();
  const [membersResult, profilesResult] = await Promise.all([
    supabase.from("members").select("*").is("deleted_at", null),
    supabase.from("profiles").select("*").eq("role", "member"),
  ]);

  const list = buildMemberList(
    (membersResult.data as Member[]) ?? [],
    (profilesResult.data as Profile[]) ?? []
  );

  const q = search.trim().toLowerCase();
  let filtered = list;
  if (q) {
    filtered = filtered.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.member_id?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }
  if (status) filtered = filtered.filter((m) => m.status === status);
  if (membershipType) {
    filtered = filtered.filter((m) => m.membership_type === membershipType);
  }

  const fromIndex = (page - 1) * pageSize;
  const pageData = filtered.slice(fromIndex, fromIndex + pageSize);

  return {
    data: pageData,
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize),
  };
}

export async function getAllMembers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("*")
    .is("deleted_at", null)
    .order("full_name", { ascending: true });
  return (data as Member[]) ?? [];
}

export async function getFunds() {
  const supabase = await createClient();
  const [fundsResult, donationsResult] = await Promise.all([
    supabase
      .from("donation_funds")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("donations")
      .select("fund_id, amount")
      .eq("status", "completed")
      .is("deleted_at", null)
      .not("fund_id", "is", null),
  ]);

  const funds = (fundsResult.data as DonationFund[]) ?? [];
  if (fundsResult.error || donationsResult.error) return funds;

  const collectedByFund = new Map<string, number>();
  const completedDonations = (donationsResult.data ?? []) as {
    fund_id: string | null;
    amount: number | string | null;
  }[];
  completedDonations.forEach((donation) => {
    if (!donation.fund_id) return;
    const amount = Number(donation.amount) || 0;
    collectedByFund.set(donation.fund_id, (collectedByFund.get(donation.fund_id) ?? 0) + amount);
  });

  return funds.map((fund) => ({
    ...fund,
    collected_amount: collectedByFund.get(fund.id) ?? 0,
  }));
}

export async function getCommittee() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("committee_members")
    .select("*")
    .order("display_order", { ascending: true });
  return (data as CommitteeMember[]) ?? [];
}

export async function getStaff({
  search = "",
  status,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createClient();
  let query = supabase.from("staff").select("*", { count: "exact" }).is("deleted_at", null);

  if (search) {
    query = query.or(`name.ilike.%${search}%,staff_id.ilike.%${search}%,role.ilike.%${search}%`);
  }
  if (status) query = query.eq("employment_status", status);

  const fromIndex = (page - 1) * pageSize;
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);

  return {
    data: (data as Staff[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getAllEvents({
  search = "",
  status,
  event_type,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  event_type?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createClient();
  let query = supabase.from("events").select("*", { count: "exact" });

  if (search) query = query.or(`title.ilike.%${search}%,event_type.ilike.%${search}%`);
  if (status) query = query.eq("status", status);
  if (event_type) query = query.eq("event_type", event_type);

  const fromIndex = (page - 1) * pageSize;
  const { data, count } = await query
    .order("start_date", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);

  return {
    data: (data as Event[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getAllAnnouncements({
  search = "",
  status,
  priority,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  priority?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createClient();
  let query = supabase.from("announcements").select("*", { count: "exact" });

  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);

  const fromIndex = (page - 1) * pageSize;
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);

  return {
    data: (data as Announcement[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getAllKhutbahs({
  search = "",
  status,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createClient();
  let query = supabase.from("khutbahs").select("*", { count: "exact" });

  if (search) query = query.or(`title.ilike.%${search}%,speaker.ilike.%${search}%`);
  if (status) query = query.eq("status", status);

  const fromIndex = (page - 1) * pageSize;
  const { data, count } = await query
    .order("date", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);

  return {
    data: (data as Khutbah[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getAllAssets({
  search = "",
  category,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createClient();
  let query = supabase.from("assets").select("*", { count: "exact" });

  if (search) query = query.or(`name.ilike.%${search}%,asset_id.ilike.%${search}%,brand.ilike.%${search}%`);
  if (category) query = query.eq("category", category);

  const fromIndex = (page - 1) * pageSize;
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);

  return {
    data: (data as Asset[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getMaintenanceRequests({
  search = "",
  status,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("maintenance_requests")
    .select("*, assets(name)", { count: "exact" });

  if (search) {
    query = query.or(`title.ilike.%${search}%,ticket_id.ilike.%${search}%,assigned_person.ilike.%${search}%`);
  }
  if (status) query = query.eq("status", status);

  const fromIndex = (page - 1) * pageSize;
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);

  return {
    data: (data as (MaintenanceRequest & { assets: { name: string } | null })[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getDocuments({
  search = "",
  category,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createClient();
  let query = supabase.from("documents").select("*", { count: "exact" });

  if (search) query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`);
  if (category) query = query.eq("category", category);

  const fromIndex = (page - 1) * pageSize;
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);

  return {
    data: (data as Document[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getContactRequests({
  search = "",
  status,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createClient();
  let query = supabase.from("contact_requests").select("*", { count: "exact" });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`);
  }
  if (status) query = query.eq("status", status);

  const fromIndex = (page - 1) * pageSize;
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);

  return {
    data: (data as ContactRequest[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getAuditLogs({
  search = "",
  module,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  module?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createClient();
  let query = supabase.from("audit_logs").select("*", { count: "exact" });

  if (search) {
    query = query.or(
      `action.ilike.%${search}%,module.ilike.%${search}%,entity.ilike.%${search}%,user_name.ilike.%${search}%`
    );
  }
  if (module) query = query.eq("module", module);

  const fromIndex = (page - 1) * pageSize;
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);

  return {
    data: (data as AuditLog[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getUsers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Profile[]) ?? [];
}

export async function getRoles() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("roles")
    .select("*")
    .order("name", { ascending: true });
  return (data as Role[]) ?? [];
}

export async function getAllPermissions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("permissions")
    .select("*")
    .order("module", { ascending: true });
  return (data as Permission[]) ?? [];
}

export async function getRolePermissions(roleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", roleId);
  return (data || []).map((rp) => rp.permission_id);
}

export async function getZakatCollections() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("zakat_collections")
    .select("*")
    .order("collection_date", { ascending: false });
  return (data as ZakatCollection[]) ?? [];
}

export async function getZakatBeneficiaries() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("zakat_beneficiaries")
    .select("*, zakat_distributions(amount)")
    .order("created_at", { ascending: false });
  return (data as (ZakatBeneficiary & { zakat_distributions: { amount: number }[] })[]) ?? [];
}

export async function getZakatDistributions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("zakat_distributions")
    .select("*, zakat_beneficiaries(name)")
    .order("distribution_date", { ascending: false });
  return (data as (ZakatDistribution & { zakat_beneficiaries: { name: string } | null })[]) ?? [];
}

export async function getMonthlyFinancialSummary() {
  const supabase = await createClient();
  const year = new Date().getFullYear();
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;

  const [donations, expenses, incomes] = await Promise.all([
    supabase
      .from("donations")
      .select("amount, donation_date")
      .gte("donation_date", start)
      .lt("donation_date", end)
      .eq("status", "completed")
      .is("deleted_at", null),
    supabase
      .from("expenses")
      .select("amount, date")
      .gte("date", start)
      .lt("date", end)
      .is("deleted_at", null),
    supabase
      .from("incomes")
      .select("amount, date")
      .gte("date", start)
      .lt("date", end)
      .is("deleted_at", null),
  ]);

  const monthLabels = Array.from({ length: 12 }, (_, i) =>
    new Date(year, i, 1).toLocaleString("en-US", { month: "short" })
  );
  const keyOf = (dateStr: string) => new Date(dateStr + "T00:00:00").getMonth();

  const data = monthLabels.map((name, idx) => ({
    name,
    income: 0,
    expenses: 0,
  }));

  (incomes.data || []).forEach((i) => (data[keyOf(i.date)].income += Number(i.amount)));
  (expenses.data || []).forEach((e) => (data[keyOf(e.date)].expenses += Number(e.amount)));

  return data;
}

export async function getExpenseByCategory() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("expense_category, amount")
    .is("deleted_at", null);
  const totals = new Map<string, number>();
  (data || []).forEach((e) => {
    totals.set(e.expense_category, (totals.get(e.expense_category) || 0) + Number(e.amount));
  });
  return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
}

export async function getIncomeByCategory() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("incomes")
    .select("income_category, amount")
    .is("deleted_at", null);
  const totals = new Map<string, number>();
  (data || []).forEach((i) => {
    totals.set(i.income_category, (totals.get(i.income_category) || 0) + Number(i.amount));
  });
  return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
}

export async function getMyDonations({
  userId,
  page = 1,
  pageSize = 20,
}: {
  userId: string;
  page?: number;
  pageSize?: number;
} = {
  userId: "",
}) {
  const supabase = await createClient();

  const fromIndex = (page - 1) * pageSize;
  const { data, count } = await supabase
    .from("donations")
    .select("*, donation_funds(name)", { count: "exact" })
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("donation_date", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);

  const { data: amountRows } = await supabase
    .from("donations")
    .select("amount")
    .eq("user_id", userId)
    .is("deleted_at", null);

  const totalAmount = (amountRows ?? []).reduce(
    (sum, row) => sum + Number((row as { amount: number }).amount ?? 0),
    0
  );

  return {
    data: (data as (Donation & { donation_funds: { name: string } | null })[]) ?? [],
    total: count ?? 0,
    totalAmount,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}
