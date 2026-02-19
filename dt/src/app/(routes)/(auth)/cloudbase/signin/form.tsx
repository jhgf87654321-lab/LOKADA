"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CloudbaseSignInSchema,
  type CloudbaseSignInValues,
} from "./validate";
import InputStartIcon from "../../components/input-start-icon";
import InputPasswordContainer from "../../components/input-password";
import { cn } from "@/lib/utils";
import { AtSign } from "lucide-react";
import { getCloudbaseAuth } from "@/lib/cloudbase";

export default function CloudbaseSignInForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CloudbaseSignInValues>({
    resolver: zodResolver(CloudbaseSignInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(data: CloudbaseSignInValues) {
    startTransition(async () => {
      const auth = getCloudbaseAuth();
      if (!auth) {
        toast.error("CloudBase 未配置，请设置环境变量");
        return;
      }
      try {
        await auth.signIn({
          username: data.username,
          password: data.password,
        });
        toast.success("登录成功");
        router.push("/cloudbase");
        router.refresh();
      } catch (err: unknown) {
        const raw =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "";
        const isCorsOrPermission =
          /cors|permission|安全来源|denied|域名/i.test(raw);
        const message = isCorsOrPermission
          ? "连接被拒绝：请在云开发控制台「安全来源」中添加当前访问域名（如 http://localhost:3000）"
          : raw || "登录失败，请检查用户名与密码";
        toast.error(message);
      }
    });
  }

  const getInputClassName = (fieldName: keyof CloudbaseSignInValues) =>
    cn(
      form.formState.errors[fieldName] &&
        "border-destructive/80 text-destructive focus-visible:border-destructive/80 focus-visible:ring-destructive/20"
    );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="my-8 flex w-full flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputStartIcon icon={AtSign}>
                  <Input
                    placeholder="手机号 / 邮箱 / 用户名（手机号请加 +86 前缀）"
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
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputPasswordContainer>
                  <Input
                    className={cn("pe-9", getInputClassName("password"))}
                    placeholder="密码"
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
          登录
        </Button>
      </form>
    </Form>
  );
}
