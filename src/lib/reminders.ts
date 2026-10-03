/**
 * Shared reminder copy for contribution emails.
 *
 * Deliberately free of any `server-only` import so the admin form can prefill the
 * subject and message with exactly what the server will send. Keeping a single
 * implementation means the modal can never show one wording and mail another.
 */

export type ReminderDetails = {
  memberName: string;
  eventName: string;
  assignedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string | null;
  mosqueName: string;
};

/**
 * Deliverable-address test shared by the bulk preview and the server, so the
 * "Eligible recipients" count can never promise a send that the server then
 * skips. Deliberately conservative: it rejects the same shapes a real SMTP
 * server would bounce, rather than trying to out-guess RFC 5322.
 */
export function isDeliverableEmail(value: string | null | undefined): value is string {
  if (!value) return false;
  const email = value.trim();
  if (email.length < 3 || email.length > 254) return false;
  if (/\s/.test(email)) return false;
  const at = email.indexOf("@");
  if (at < 1 || at !== email.lastIndexOf("@")) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > 64) return false;
  // A dotless domain cannot receive mail, so `user@localhost` is not deliverable.
  const dot = domain.lastIndexOf(".");
  if (dot < 1 || dot === domain.length - 1) return false;
  if (domain.includes("..")) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  return /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(email);
}

export function formatTaka(amount: number) {
  return `৳${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatReminderDueDate(value: string | null | undefined) {
  if (!value) return "the scheduled date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function buildReminderSubject(eventName: string, mosqueName: string) {
  return `Contribution Reminder - ${eventName} | ${mosqueName}`;
}

/**
 * Bulk templates.
 *
 * A bulk send is personalised per recipient, so the admin edits a template with
 * placeholders rather than one already-resolved message. Resolution happens on
 * the server for every recipient individually: nobody receives another member's
 * figures, and no message ever leaves with a literal `{{placeholder}}` in it.
 */
export const REMINDER_PLACEHOLDERS = [
  "member_name",
  "event_name",
  "assigned_amount",
  "paid_amount",
  "remaining_amount",
  "due_date",
  "mosque_name",
] as const;

export type ReminderPlaceholder = (typeof REMINDER_PLACEHOLDERS)[number];

export function buildBulkReminderSubjectTemplate() {
  return "Contribution Reminder - {{event_name}} | {{mosque_name}}";
}

export function buildBulkReminderMessageTemplate() {
  return [
    "Assalamu Alaikum {{member_name}},",
    "",
    'This is a friendly reminder regarding your contribution for "{{event_name}}" organised by {{mosque_name}}.',
    "",
    "Assigned Contribution: {{assigned_amount}}",
    "Paid: {{paid_amount}}",
    "Remaining: {{remaining_amount}}",
    "Due Date: {{due_date}}",
    "",
    "We would appreciate your contribution within the scheduled period.",
    "",
    "JazakAllahu Khairan.",
    "{{mosque_name}}",
  ].join("\n");
}

/**
 * Placeholders the admin typed that we do not recognise. Reported instead of
 * silently ignored, because an unresolved `{{asigned}}` in a mail that has
 * already gone to 290 people cannot be taken back.
 */
export function findUnknownPlaceholders(template: string): string[] {
  const found = template.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) ?? [];
  const unknown = new Set<string>();
  found.forEach((token) => {
    const name = token.replace(/[{}\s]/g, "");
    if (!(REMINDER_PLACEHOLDERS as readonly string[]).includes(name)) unknown.add(name);
  });
  return [...unknown];
}

/**
 * Resolve a template for one recipient. Whitespace inside the braces is
 * tolerated, and every placeholder comes from that member's own derived row.
 */
export function renderReminderTemplate(template: string, details: ReminderDetails) {
  const values: Record<ReminderPlaceholder, string> = {
    member_name: details.memberName,
    event_name: details.eventName,
    assigned_amount: formatTaka(details.assignedAmount),
    paid_amount: formatTaka(details.paidAmount),
    remaining_amount: formatTaka(details.remainingAmount),
    due_date: formatReminderDueDate(details.dueDate),
    mosque_name: details.mosqueName,
  };

  return template.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (match, name: string) =>
      name in values ? values[name as ReminderPlaceholder] : match
  );
}

/** Default message body. The admin can edit any part of it before sending. */
export function buildReminderMessage(details: ReminderDetails) {
  const { memberName, eventName, mosqueName } = details;

  return [
    `Assalamu Alaikum ${memberName},`,
    "",
    `This is a friendly reminder regarding your contribution for "${eventName}" organised by ${mosqueName}.`,
    "",
    `Assigned Contribution: ${formatTaka(details.assignedAmount)}`,
    `Paid: ${formatTaka(details.paidAmount)}`,
    `Remaining: ${formatTaka(details.remainingAmount)}`,
    `Due Date: ${formatReminderDueDate(details.dueDate)}`,
    "",
    "We would appreciate your contribution within the scheduled period.",
    "",
    "JazakAllahu Khairan.",
    mosqueName,
  ].join("\n");
}