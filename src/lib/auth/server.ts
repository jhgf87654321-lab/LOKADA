import { db } from "@/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema";

const baseURL = process.env.BETTER_AUTH_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const auth = betterAuth({
  baseURL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  advanced: {
    cookiePrefix: "lokada",
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
});
