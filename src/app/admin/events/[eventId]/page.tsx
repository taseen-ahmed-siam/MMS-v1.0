import { notFound } from "next/navigation";
import { Metadata } from "next";

import { requirePermission } from "@/lib/access";
import { getMosqueSettings } from "@/lib/queries/public";
import {
  getEventById,
  getEventContributionRows,
  getEventContributionSummary,
} from "@/lib/queries/admin";
import { isEmailConfigured } from "@/lib/email";
import { EventContributionsClient } from "./event-contributions-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEventById(eventId);
  return { title: event ? `${event.title} · Contributions` : "Event Contributions" };
}

/**
 * Event contribution tracking.
 *
 * Nothing on this page stores money. Every figure is derived at render time from
 * the linked fund's approved donations, so approving a payment in /admin/donations
 * is all it takes for the member's status, the counts and the progress bar to move.
 */
export default async function EventContributionsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await requirePermission("event.manage");

  const { eventId } = await params;
  const event = await getEventById(eventId);
  if (!event) notFound();

  const [rows, summary, settings] = await Promise.all([
    getEventContributionRows(eventId),
    getEventContributionSummary(eventId),
    getMosqueSettings(),
  ]);

  return (
    <EventContributionsClient
      event={event}
      rows={rows}
      summary={summary}
      mosqueName={settings?.mosque_name || "Al-Noor Mosque"}
      emailConfigured={isEmailConfigured()}
    />
  );
}