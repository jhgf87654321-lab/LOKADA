import { db } from "@/db";
import { user } from "@/db/schema/auth/user";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(user).limit(1);
    return Response.json({ success: true, users: result });
  } catch (error) {
    return Response.json({ success: false, error: String(error) });
  }
}
