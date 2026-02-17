import { auth } from "@/lib/auth/server";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const handler = toNextJsHandler(auth);

async function withErrorLog(
  req: NextRequest,
  context: { params: Promise<{ all: string[] }> },
  method: "GET" | "POST"
) {
  try {
    const res = await (method === "GET" ? handler.GET(req) : handler.POST(req));
    if (res && (res.status >= 500 || res.status === 403)) {
      const clone = res.clone();
      let body: string | null = null;
      try {
        body = await clone.text();
      } catch {
        // ignore
      }
      console.error("[auth] %s %s -> %s", method, req.nextUrl.pathname, res.status, body || "");
      // Return JSON with message so client toast can show it
      try {
        const parsed = body ? JSON.parse(body) : {};
        const msg = parsed.message ?? parsed.error ?? body ?? (res.status === 403 ? "Forbidden" : "Internal Server Error");
        return NextResponse.json({ error: msg, message: msg }, { status: res.status });
      } catch {
        return res;
      }
    }
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[auth] %s %s threw:", method, req.nextUrl.pathname, message);
    if (stack) console.error(stack);
    return NextResponse.json(
      { error: message, message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ all: string[] }> }) {
  return withErrorLog(req, context, "GET");
}

export async function POST(req: NextRequest, context: { params: Promise<{ all: string[] }> }) {
  return withErrorLog(req, context, "POST");
}
