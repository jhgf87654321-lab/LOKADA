import Link from "next/link";
import CloudbaseLoginForm from "./form";

/**
 * CloudBase 独立登录页面
 * 完全独立于 Better Auth
 */
export default function CloudbaseLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">CloudBase 登录</h1>
          <p className="text-muted-foreground text-sm">
            使用腾讯云 CloudBase 身份认证系统
          </p>
        </div>

        <CloudbaseLoginForm />

        <div className="space-y-4 text-center text-sm">
          <div>
            <span className="text-muted-foreground">还没有账号？</span>{" "}
            <Link
              href="/auth/cloudbase/register"
              className="font-medium text-primary hover:underline"
            >
              立即注册
            </Link>
          </div>
          <div className="border-t border-border pt-4">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
