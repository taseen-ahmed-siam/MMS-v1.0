import { NextRequest, NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/session";
import { getPermissionsForRole } from "@/lib/access";
import { permissionsAllow } from "@/lib/permissions";
import { getMembersForDonation } from "@/lib/queries/admin";

/**
 * Members that can be linked to a donation recorded by an admin.
 *
 * Searched in Postgres rather than shipped to the browser, because a mosque can
 * hold thousands of members. The response carries member contact details, so it
 * is gated on `donation.create` -- the same permission that gates writing a
 * donation.
 */
export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (profile.status !== "active") {
    return NextResponse.json({ error: "Your account is not active." }, { status: 403 });
  }

  const permissions = await getPermissionsForRole(profile.role);
  if (!permissionsAllow(permissions, "donation.create")) {
    return NextResponse.json(
      { error: "You do not have permission to record donations." },
      { status: 403 }
    );
  }

  const search = request.nextUrl.searchParams.get("search") ?? "";
  const members = await getMembersForDonation({ search, limit: 20 });
  return NextResponse.json({ members });
}