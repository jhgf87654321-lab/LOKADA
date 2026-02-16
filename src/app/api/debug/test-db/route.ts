import { sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth/user";

export async function GET() {
  const logs: string[] = [];
  const results: Record<string, unknown> = {};

  function log(msg: string) {
    console.log(msg);
    logs.push(msg);
  }

  // Log the connection URL being used (masked)
  const dbUrl = process.env.DATABASE_URL || "NOT SET";
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ":****@");
  results._envCheck = { DATABASE_URL: maskedUrl };
  log("DATABASE_URL: " + maskedUrl);

  // Test 1: Raw SQL query through drizzle
  try {
    log("Testing drizzle connection...");
    const raw = await db.execute(sql`SELECT current_user, current_database(), version()`);
    log("Drizzle connection SUCCESS");
    results.connection = { success: true };
  } catch (error: any) {
    log("Drizzle connection FAILED: " + error.message);
    results.connection = { success: false, error: error.message, code: error.code };
  }

  // Test 2: Check tables exist
  try {
    log("Checking tables...");
    const tables = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user', 'account', 'session', 'verification')`
    );
    log("Tables check SUCCESS, found: " + JSON.stringify(tables));
    results.tables = { success: true, data: tables };
  } catch (error: any) {
    log("Tables check FAILED: " + error.message);
    results.tables = { success: false, error: error.message };
  }

  // Test 3: Try raw SELECT from user table
  try {
    log("SELECT from user table...");
    const users = await db.execute(sql`SELECT * FROM "user" LIMIT 1`);
    log("SELECT SUCCESS, count: " + users.length);
    results.rawSelect = { success: true, count: users.length };
  } catch (error: any) {
    log("SELECT FAILED: " + error.message);
    results.rawSelect = { success: false, error: error.message, code: error.code };
  }

  // Test 4: Try INSERT
  try {
    const testUserId = crypto.randomUUID();
    const testEmail = "test" + Date.now() + "@example.com";
    log("INSERT test user: " + testUserId);

    const existingUsers = await db.execute(sql`SELECT COUNT(*) FROM "user"`);
    log("Existing users: " + JSON.stringify(existingUsers));

    await db.execute(sql`
      INSERT INTO "user" ("id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt")
      VALUES (${testUserId}, 'Test User', ${testEmail}, false, NULL, NOW(), NOW())
    `);
    log("INSERT SUCCESS");

    await db.execute(sql`DELETE FROM "user" WHERE id = ${testUserId}`);
    log("DELETE SUCCESS");

    results.drizzleInsert = { success: true };
  } catch (error: any) {
    log("INSERT FAILED: " + error.message);
    log("Error details: " + JSON.stringify(error));
    results.drizzleInsert = {
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      column: error.column
    };
  }

  results._logs = logs;

  return Response.json(results, { status: 200 });
}
