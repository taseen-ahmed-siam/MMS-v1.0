import { NextRequest, NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/session";
import { getPermissionsForRole } from "@/lib/access";
import { permissionsAllow } from "@/lib/permissions";
import { getAssignableMembers } from "@/lib/queries/admin";

/**
 * Members that can still be assigned to an event. Used by the admin picker so a
 * large member list is searched in Postgres instead of shipping every member to
 * the browser. The response carries member contact details, so the same
 * `event.manage` permission that gates the page also gates this endpoint.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (profile.status !== "active") {
    return NextResponse.json({ error: "Your account is not active." }, { status: 403 });
  }

  const permissions = await getPermissionsForRole(profile.role);
  if (!permissionsAllow(permissions, "event.manage")) {
    return NextResponse.json(
      { error: "You do not have permission to manage event members." },
      { status: 403 }
    );
  }

  const { eventId } = await params;
  const search = request.nextUrl.searchParams.get("search") ?? "";

  const members = await getAssignableMembers(eventId, { search, limit: 300 });
  return NextResponse.json({ members });
}