import "server-only";

import nodemailer from "nodemailer";
import { formatReminderDueDate, formatTaka, type ReminderDetails } from "@/lib/reminders";

type ReminderMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

type HtmlDetails = ReminderDetails & {
  mosqueAddress?: string | null;
  mosquePhone?: string | null;
  logoUrl?: string | null;
  adminMessage: string;
};

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });
}

/**
 * The transport is built per send rather than cached so that turning email on or
 * off is only an env change. Credentials live exclusively in this server-only
 * module and are never referenced from client code.
 */
export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Resolved sender identity. Always derived from configuration, never from
 * request data, so an admin cannot make the mosque appear to send from anywhere.
 */
export function senderIdentity() {
  const address = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const name = process.env.EMAIL_FROM_NAME || "Mosque Administration";
  return address ? { name, address, formatted: `${name} <${address}>` } : null;
}

export async function sendReminderEmail({ to, subject, html, text, replyTo }: ReminderMailInput) {
  const sender = senderIdentity();
  if (!sender) {
    throw new Error("Email sender is not configured");
  }

  const transport = createTransport();
  if (!transport) {
    throw new Error("Email transport is not configured");
  }

  await transport.sendMail({
    from: sender.formatted,
    to,
    subject,
    html,
    text,
    replyTo: replyTo || sender.address,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Table-based, inline-styled HTML: mail clients strip app-level CSS, so every
 * rule is inlined and the 560px max width collapses cleanly on phones.
 */
export function buildReminderHtml(details: HtmlDetails) {
  const eventName = escapeHtml(details.eventName);
  const mosqueName = escapeHtml(details.mosqueName);

  const messageBlock = details.adminMessage
    .trim()
    .split(/\n{2,}/)
    .map((block) => escapeHtml(block).replace(/\n/g, "<br />"))
    .map((html) => `<p style="margin:0 0 12px;">${html}</p>`)
    .join("");

  // The admin's wording usually closes with a sign-off and the mosque name. Append
  // each missing piece independently so an edited message never gets a duplicated
  // closing, and a stripped-down one still gets a proper ending.
  const customMessage = details.adminMessage.trim();
  const hasSignOff = /jazak\s*allahu\s*khairan|Allah\s+(?:yufraq|made)\s+(?:al-?khair|barak)|(?:May Allah|Allah)\s+(?:reward|bless)/i.test(
    customMessage
  );
  const hasSignature = customMessage.toLowerCase().endsWith(details.mosqueName.toLowerCase());
  const footer = [
    hasSignOff ? "" : "<p style=\"margin:24px 0 0;font-size:15px;color:#17201c;\">JazakAllahu Khairan.</p>",
    hasSignature ? "" : `<p style="margin:4px 0 0;font-size:14px;color:#5b6b62;">${mosqueName}</p>`,
  ].join("");

  const amountRow = (label: string, value: string, strong = false) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e8e4d8;font-size:14px;color:#5b6b62;">${label}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e8e4d8;text-align:right;font-size:15px;color:#17201c;${strong ? "font-weight:700;" : "font-weight:500;"}">${value}</td>
      </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Contribution Reminder - ${eventName}</title>
</head>
<body style="margin:0;padding:0;background-color:#faf8f2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf8f2;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ece7d8;">
          <tr>
            <td style="background-color:#064e3b;padding:24px;text-align:center;">
              ${
                details.logoUrl
                  ? `<img src="${escapeHtml(details.logoUrl)}" alt="${mosqueName}" width="56" height="56" style="display:block;margin:0 auto 12px;border-radius:12px;background-color:#ffffff;object-fit:contain;" />`
                  : ""
              }
              <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#c8a951;">${mosqueName}</p>
              <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#ffffff;">Contribution Reminder</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 24px 8px;">
              <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#3c4a42;">
                This is a friendly reminder regarding your contribution for
                <strong style="color:#064e3b;">${eventName}</strong> organised by ${mosqueName}.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f5ee;border-radius:12px;padding:4px 16px;">
                ${amountRow("Assigned Contribution", formatTaka(details.assignedAmount))}
                ${amountRow("Paid", formatTaka(details.paidAmount))}
                ${amountRow("Remaining", formatTaka(details.remainingAmount), true)}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                <tr>
                  <td style="padding:10px 0;font-size:14px;color:#5b6b62;">Due Date</td>
                  <td style="padding:10px 0;text-align:right;font-size:15px;font-weight:700;color:#b45309;">${escapeHtml(formatReminderDueDate(details.dueDate))}</td>
                </tr>
              </table>

              ${
                messageBlock
                  ? `<div style="margin-top:24px;padding:16px;background-color:#f7f5ee;border-left:3px solid #c8a951;border-radius:0 8px 8px 0;font-size:14px;line-height:1.7;color:#3c4a42;">${messageBlock}</div>`
                  : ""
              }

              ${footer}
            </td>
          </tr>

          <tr>
            <td style="border-top:1px solid #ece7d8;padding:20px 24px 24px;text-align:center;">
              ${
                details.mosqueAddress
                  ? `<p style="margin:0 0 4px;font-size:12px;color:#8a978f;">${escapeHtml(details.mosqueAddress)}</p>`
                  : ""
              }
              ${
                details.mosquePhone
                  ? `<p style="margin:0;font-size:12px;color:#8a978f;">${escapeHtml(details.mosquePhone)}</p>`
                  : ""
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}