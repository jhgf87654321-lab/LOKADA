import { db } from "@/db";
import { user } from "@/db/schema/auth/user";
import { account } from "@/db/schema/auth/account";
import { eq } from "drizzle-orm";

/**
 * GET /api/debug/signup-dry-run
 * Tries a minimal user + account insert and returns the exact DB error (for debugging 500 on sign-up).
 */
export async function GET() {
  const testId = `debug-${Date.now()}`;
  const testEmail = `debug-${Date.now()}@example.com`;

  try {
    await db.insert(user).values({
      id: testId,
      name: "Debug User",
      email: testEmail,
      emailVerified: false,
      username: "debuguser",
      display_username: "debuguser",
      role: "user",
      gender: false,
    });
    await db.insert(account).values({
      id: `acc-${testId}`,
      accountId: testId,
      providerId: "credential",
      userId: testId,
      password: "hashed",
    });
    await db.delete(account).where(eq(account.id, `acc-${testId}`));
    await db.delete(user).where(eq(user.id, testId));

    return Response.json({ success: true, message: "Insert/delete OK" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    const e = err as Record<string, unknown> | null;
    const detail = e?.detail ?? (err instanceof Error && "cause" in err ? String((err as Error & { cause?: unknown }).cause) : undefined);
    const code = e?.code ?? undefined;

    console.error("[debug/signup-dry-run]", message, { detail, code, stack });

    return Response.json(
      {
        error: message,
        message,
        detail,
        code,
        fullError: e ? Object.fromEntries(Object.entries(e).filter(([k]) => !["stack"].includes(k))) : undefined,
        hint: "Schema uses table 'users'. If your table is named 'user', change pgTable('users', ...) back to pgTable('user', ...).",
      },
      { status: 500 }
    );
  }
}
