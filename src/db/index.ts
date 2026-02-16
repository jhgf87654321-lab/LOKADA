import * as schema from "./schema";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

// Supabase connection pooler URL
const DB_URL = process.env.DATABASE_URL!;

console.log("[DB] Connecting to:", DB_URL.replace(/:[^:@]+@/, ":****@"));

const client = postgres(DB_URL, {
  ssl: { rejectUnauthorized: false },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  no_prepare: true,
});
export const db = drizzle(client, { schema });
