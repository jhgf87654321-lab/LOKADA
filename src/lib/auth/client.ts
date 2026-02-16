import { createAuthClient } from "better-auth/react";
import { nextCookies } from "better-auth/next-js";

export const { signIn, signUp, signOut, useSession, getSession } =
  createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [nextCookies()],
  });
