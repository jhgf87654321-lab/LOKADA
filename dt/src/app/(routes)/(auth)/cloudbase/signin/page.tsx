import { type Metadata } from "next";
import Link from "next/link";
import CloudbaseSignInForm from "./form";
import CloudbaseConfigAlert from "../components/cloudbase-config-alert";

export const metadata: Metadata = {
  title: "CloudBase 登录",
  description: "腾讯云 CloudBase 身份认证登录",
};

export default function CloudbaseSignInPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center">
      <div className="flex w-full flex-col rounded-2xl border border-foreground/10 px-8 py-5 md:w-96">
        <h1 className="text-xl font-semibold">CloudBase 登录</h1>
        <p className="text-muted-foreground text-sm">
          使用腾讯云 CloudBase 身份认证（手机号/邮箱/用户名 + 密码）
        </p>
        <CloudbaseConfigAlert />
        <CloudbaseSignInForm />
        <div className="flex items-center justify-center gap-2">
          <small className="text-muted-foreground">还没有账号？</small>
          <Link
            href="/cloudbase/signup"
            className="text-sm font-bold leading-none text-primary"
          >
            注册
          </Link>
        </div>
        <div className="mt-4 border-t border-foreground/10 pt-4">
          <Link
            href="/signin"
            className="text-muted-foreground text-xs hover:underline"
          >
            使用 Better Auth 登录
          </Link>
        </div>
      </div>
    </div>
  );
}
