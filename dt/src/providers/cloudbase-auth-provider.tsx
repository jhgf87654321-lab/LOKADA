"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getCloudbaseAuth } from "@/lib/cloudbase";

type CloudbaseUser = {
  uid?: string;
  sub?: string;
  name?: string;
  username?: string;
  email?: string;
  picture?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  gender?: string;
};

type CloudbaseAuthContextValue = {
  user: CloudbaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isReady: boolean;
};

const CloudbaseAuthContext = createContext<CloudbaseAuthContextValue | null>(
  null
);

export function CloudbaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CloudbaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const syncUser = useCallback(async () => {
    const auth = getCloudbaseAuth();
    if (!auth) {
      setLoading(false);
      setIsReady(true);
      return;
    }
    try {
      const currentUser = await auth.getCurrentUser();
      setUser(
        currentUser
          ? {
              uid: currentUser.uid,
              sub: (currentUser as { sub?: string }).sub,
              name: currentUser.name,
              username: currentUser.username,
              email: currentUser.email,
              picture: currentUser.picture,
              emailVerified: currentUser.emailVerified,
              phoneNumber: (currentUser as { phoneNumber?: string }).phoneNumber,
              gender: currentUser.gender,
            }
          : null
      );
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    const auth = getCloudbaseAuth();
    if (!auth) {
      setLoading(false);
      setIsReady(true);
      return;
    }
    try {
      syncUser();
      if (typeof auth.onLoginStateChanged === "function") {
        auth.onLoginStateChanged((params: { data?: { eventType?: string } }) => {
          const eventType = params?.data?.eventType;
          if (eventType === "sign_in" || eventType === "sign_out" || eventType === "credentials_error") {
            void syncUser();
          }
        }).catch(() => {
          // 忽略监听器注册错误，不影响页面交互
        });
      }
    } catch {
      // CloudBase 初始化失败时，确保页面仍可交互
      setLoading(false);
      setIsReady(true);
    }
  }, [syncUser]);

  const signOut = useCallback(async () => {
    const auth = getCloudbaseAuth();
    if (auth) await auth.signOut();
    setUser(null);
  }, []);

  const value: CloudbaseAuthContextValue = {
    user,
    loading,
    signOut,
    isReady,
  };

  return (
    <CloudbaseAuthContext.Provider value={value}>
      {children}
    </CloudbaseAuthContext.Provider>
  );
}

export function useCloudbaseAuth() {
  const ctx = useContext(CloudbaseAuthContext);
  if (!ctx) {
    throw new Error("useCloudbaseAuth must be used within CloudbaseAuthProvider");
  }
  return ctx;
}

export function useCloudbaseAuthOptional() {
  return useContext(CloudbaseAuthContext);
}
