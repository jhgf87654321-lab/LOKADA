import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";

export const { signIn, signUp, signOut, useSession, getSession } =
  createAuthClient({
    // Always call same-origin in the browser (prevents Vercel preview -> prod CORS).
    // Avoid relying on env-based base URL inference.
    baseURL:
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      nextCookies(),
      // Ensure client types accept server-side user.additionalFields (e.g. username, gender)
      inferAdditionalFields({
        user: {
          username: { type: "string", required: false },
          display_username: { type: "string", required: false },
          role: { type: "string", required: false, defaultValue: "user", input: false },
          gender: { type: "boolean", required: false },
        },
      }),
    ],
  });
