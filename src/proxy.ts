import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const DEAD_SESSION_CODES = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
  "session_expired",
  "invalid_refresh_token",
]);

function isDeadSession(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, status } = error as { code?: string; status?: number };
  if (code && DEAD_SESSION_CODES.has(code)) return true;
  return status === 401 || status === 403;
}

export async function proxy(request: NextRequest) {
  const { supabase, getResponse } = updateSession(request);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // A dead refresh token would otherwise be replayed on every subsequent
  // request, so drop the stale session cookies once.
  if (error && isDeadSession(error)) {
    await supabase.auth.signOut();
  }

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  const response = getResponse();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};