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
  user: {
    additionalFields: {
      username: { type: "string", required: false },
      display_username: { type: "string", required: false },
      role: { type: "string", required: false, defaultValue: "user", input: false },
      gender: { type: "boolean", required: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: (user) => {
          return {
            data: {
              ...user,
              display_username: (user as Record<string, unknown>).display_username ?? (user as Record<string, unknown>).username ?? "",
              role: (user as Record<string, unknown>).role ?? "user",
            },
          };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
});
