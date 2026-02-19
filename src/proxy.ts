import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import {
  apiAuthPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
} from "./routes";

export async function proxy(request: NextRequest) {
  const session = getSessionCookie(request);
  const pathname = request.nextUrl.pathname;
  const isApiAuth = pathname.startsWith(apiAuthPrefix);
  const isApiDebug = pathname.startsWith("/api/debug");
  const isApiRoute = pathname.startsWith("/api/");

  // Never redirect API routes; let route handlers return JSON.
  if (isApiRoute) {
    return NextResponse.next();
  }

  if (isApiAuth || isApiDebug) {
    return NextResponse.next();
  }

  const isAuthRoute = authRoutes.some((path) => pathname.startsWith(path));
  if (isAuthRoute) {
    if (session) {
      return NextResponse.redirect(
        new URL(DEFAULT_LOGIN_REDIRECT, request.url),
      );
    }
    return NextResponse.next();
  }

  // 不再将未登录用户重定向到 /cloudbase/login，以避免重定向死循环。
  // 各页面自行处理鉴权（如 dashboard 展示「去登录」链接）。
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
