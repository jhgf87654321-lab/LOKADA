import { type Metadata } from "next";
import Link from "next/link";
import CloudbaseSignUpForm from "./form";
import CloudbaseConfigAlert from "../components/cloudbase-config-alert";

export const metadata: Metadata = {
  title: "CloudBase 注册",
  description: "腾讯云 CloudBase 身份认证注册（邮箱验证码）",
};

export default function CloudbaseSignUpPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center">
      <div className="flex w-full flex-col rounded-2xl border border-foreground/10 px-8 py-5 md:w-96">
        <h1 className="text-xl font-semibold">CloudBase 注册</h1>
        <p className="text-muted-foreground text-sm">
          使用邮箱验证码注册（先获取验证码再填写资料）
        </p>
        <CloudbaseConfigAlert />
        <CloudbaseSignUpForm />
        <div className="flex items-center justify-center gap-2">
          <small className="text-muted-foreground">已有账号？</small>
          <Link
            href="/cloudbase/signin"
            className="text-sm font-bold leading-none text-primary"
          >
            登录
          </Link>
        </div>
        <div className="mt-4 border-t border-foreground/10 pt-4">
          <Link
            href="/signup"
            className="text-muted-foreground text-xs hover:underline"
          >
            使用 Better Auth 注册
          </Link>
        </div>
      </div>
    </div>
  );
}
