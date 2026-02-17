import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";

export const { signIn, signUp, signOut, useSession, getSession } =
  createAuthClient({
    // Use relative baseURL so preview/prod deployments always call same-origin `/api/auth/*`.
    // This avoids CORS between Vercel preview domains and production domains.
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
