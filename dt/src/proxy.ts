import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 "proxy" hook (successor to middleware).
 *
 * This project previously used Better Auth route-guard logic here, but that
 * caused redirect loops (e.g. redirecting to /login when /login didn't exist).
 *
 * For the standalone CloudBase login/register module, keep this as a no-op so
 * no routes are blocked.
 */
export async function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
