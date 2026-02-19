"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCloudbaseAuth } from "@/lib/cloudbase";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<null | {
    uid?: string;
    sub?: string;
    name?: string;
    username?: string;
    email?: string;
  }>(null);

  useEffect(() => {
    const auth = getCloudbaseAuth();
    if (!auth) {
      setLoading(false);
      router.push("/cloudbase/login");
      return;
    }

    auth
      .getCurrentUser()
      .then((u: any) => {
        if (!u) {
          router.push("/cloudbase/login");
          return;
        }
        setUser({
          uid: u.uid,
          sub: u.sub,
          name: u.name,
          username: u.username,
          email: u.email,
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSignOut = async () => {
    const auth = getCloudbaseAuth();
    if (auth) {
      try {
        await auth.signOut();
        router.push("/cloudbase/login");
        router.refresh();
      } catch (err) {
        console.error("退出失败:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="cloudbase-auth-page">
        <div className="cloudbase-auth-container">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="cloudbase-auth-page">
      <div className="cloudbase-auth-container">
        <h1>用户中心</h1>
        <div className="cloudbase-user-info">
          {user.name && (
            <div className="cloudbase-info-item">
              <span className="cloudbase-info-label">昵称：</span>
              <span>{user.name}</span>
            </div>
          )}
          {user.username && (
            <div className="cloudbase-info-item">
              <span className="cloudbase-info-label">用户名：</span>
              <span>{user.username}</span>
            </div>
          )}
          {user.email && (
            <div className="cloudbase-info-item">
              <span className="cloudbase-info-label">邮箱：</span>
              <span>{user.email}</span>
            </div>
          )}
          {(user.uid || user.sub) && (
            <div className="cloudbase-info-item">
              <span className="cloudbase-info-label">ID：</span>
              <span className="cloudbase-info-id">{user.uid || user.sub}</span>
            </div>
          )}
        </div>
        <div className="cloudbase-auth-actions">
          <button onClick={handleSignOut} className="cloudbase-button cloudbase-button-secondary">
            退出登录
          </button>
          <a href="/" className="cloudbase-link-button">返回首页</a>
        </div>
      </div>
    </div>
  );
}
