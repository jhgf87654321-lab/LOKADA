"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CloudbaseSignUpSchema,
  CloudbaseGetCodeSchema,
  type CloudbaseSignUpValues,
  type CloudbaseGetCodeValues,
} from "./validate";
import InputStartIcon from "../../components/input-start-icon";
import InputPasswordContainer from "../../components/input-password";
import { cn } from "@/lib/utils";
import { AtSign, MailIcon, UserIcon } from "lucide-react";
import { getCloudbaseAuth } from "@/lib/cloudbase";

type Step = "email" | "register";

export default function CloudbaseSignUpForm() {
  const [step, setStep] = useState<Step>("email");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [emailForRegister, setEmailForRegister] = useState("");
  const [isPending, startTransition] = useTransition();
  const [codeSending, setCodeSending] = useState(false);
  const router = useRouter();

  const emailForm = useForm<CloudbaseGetCodeValues>({
    resolver: zodResolver(CloudbaseGetCodeSchema),
    defaultValues: { email: "" },
  });

  const registerForm = useForm<CloudbaseSignUpValues>({
    resolver: zodResolver(CloudbaseSignUpSchema),
    defaultValues: {
      email: "",
      verification_code: "",
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onGetCode = (data: CloudbaseGetCodeValues) => {
    setCodeSending(true);
    const auth = getCloudbaseAuth();
    if (!auth) {
      toast.error("CloudBase 未配置");
      setCodeSending(false);
      return;
    }
    auth
      .getVerification({ email: data.email })
      .then((res: { verification_id: string; is_user?: boolean }) => {
        setVerificationId(res.verification_id);
        setEmailForRegister(data.email);
        registerForm.setValue("email", data.email);
        setStep("register");
        toast.success("验证码已发送到邮箱，请查收");
      })
      .catch((err: unknown) => {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "发送验证码失败";
        toast.error(msg);
      })
      .finally(() => setCodeSending(false));
  };

  const onSubmit = (data: CloudbaseSignUpValues) => {
    if (!verificationId) {
      toast.error("请先获取邮箱验证码");
      return;
    }
    startTransition(async () => {
      const auth = getCloudbaseAuth();
      if (!auth) {
        toast.error("CloudBase 未配置");
        return;
      }
      try {
        const verifyRes = await auth.verify({
          verification_id: verificationId,
          verification_code: data.verification_code,
        });
        const token =
          (verifyRes as { verification_token?: string })?.verification_token;
        if (!token) {
          toast.error("验证码校验失败");
          return;
        }
        setVerificationToken(token);

        await auth.signUp({
          email: data.email,
          verification_code: data.verification_code,
          verification_token: token,
          name: data.name,
          password: data.password,
          username: data.username,
        });
        toast.success("注册成功");
        router.push("/cloudbase");
        router.refresh();
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "注册失败";
        toast.error(message);
      }
    });
  };

  const getInputClassName = (fieldName: keyof CloudbaseSignUpValues) =>
    cn(
      registerForm.formState.errors[fieldName] &&
        "border-destructive/80 text-destructive focus-visible:border-destructive/80 focus-visible:ring-destructive/20"
    );

  if (step === "email") {
    return (
      <Form {...emailForm}>
        <form
          onSubmit={emailForm.handleSubmit(onGetCode)}
          className="z-50 my-8 flex w-full flex-col gap-5"
        >
          <FormField
            control={emailForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <InputStartIcon icon={MailIcon}>
                    <Input
                      placeholder="邮箱"
                      className="peer ps-9"
                      disabled={codeSending}
                      {...field}
                    />
                  </InputStartIcon>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={codeSending} className="mt-5 w-full">
            {codeSending ? "发送中…" : "获取验证码"}
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <Form {...registerForm}>
      <form
        onSubmit={registerForm.handleSubmit(onSubmit)}
        className="z-50 my-8 flex w-full flex-col gap-5"
      >
        <FormField
          control={registerForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="邮箱"
                  disabled
                  className="bg-muted"
                  {...field}
                  value={emailForRegister}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={registerForm.control}
          name="verification_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱验证码</FormLabel>
              <FormControl>
                <Input
                  placeholder="请输入 6 位验证码"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={registerForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputStartIcon icon={UserIcon}>
                  <Input
                    placeholder="昵称"
                    className={cn("peer ps-9", getInputClassName("name"))}
                    disabled={isPending}
                    {...field}
                  />
                </InputStartIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={registerForm.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputStartIcon icon={AtSign}>
                  <Input
                    placeholder="用户名（5-24 位，支持中英文、数字、_-）"
                    className={cn("peer ps-9", getInputClassName("username"))}
                    disabled={isPending}
                    {...field}
                  />
                </InputStartIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={registerForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputPasswordContainer>
                  <Input
                    className={cn("pe-9", getInputClassName("password"))}
                    placeholder="密码（至少 6 位）"
                    disabled={isPending}
                    {...field}
                  />
                </InputPasswordContainer>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={registerForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputPasswordContainer>
                  <Input
                    className={cn("pe-9", getInputClassName("confirmPassword"))}
                    placeholder="确认密码"
                    disabled={isPending}
                    {...field}
                  />
                </InputPasswordContainer>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="mt-5 w-full">
          注册
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground text-sm"
          onClick={() => setStep("email")}
        >
          更换邮箱
        </Button>
      </form>
    </Form>
  );
}
