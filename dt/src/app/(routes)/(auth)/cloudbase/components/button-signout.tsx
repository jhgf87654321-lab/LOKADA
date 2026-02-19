"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCloudbaseAuthOptional } from "@/providers/cloudbase-auth-provider";
import { getCloudbaseAuth } from "@/lib/cloudbase";

export default function CloudbaseSignOutButton() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const ctx = useCloudbaseAuthOptional();

  const onSignOut = async () => {
    setIsPending(true);
    try {
      const auth = getCloudbaseAuth();
      if (auth) await auth.signOut();
      ctx?.signOut?.();
      router.push("/cloudbase/signin");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      disabled={isPending}
      onClick={onSignOut}
      variant="destructive"
    >
      退出登录
    </Button>
  );
}
