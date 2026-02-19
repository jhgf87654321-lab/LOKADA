import { z } from "zod";

/**
 * CloudBase 注册：用户名 5-24 位，支持中英文、数字、_-
 * 文档: https://docs.cloudbase.net/api-reference/webv2/authentication#authsignup
 */
export const CloudbaseSignUpSchema = z
  .object({
    email: z.string().email("请输入有效邮箱"),
    verification_code: z.string().min(1, "请输入邮箱验证码"),
    name: z.string().min(1, "请输入昵称"),
    username: z
      .string()
      .min(5, "用户名为 5-24 位")
      .max(24, "用户名为 5-24 位")
      .regex(
        /^[\w\u4e00-\u9fa5\-_]+$/,
        "仅支持中英文、数字、_、-"
      ),
    password: z.string().min(6, "密码至少 6 位"),
    confirmPassword: z.string().min(1, "请确认密码"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"],
  });

export type CloudbaseSignUpValues = z.infer<typeof CloudbaseSignUpSchema>;

export const CloudbaseGetCodeSchema = z.object({
  email: z.string().email("请输入有效邮箱"),
});

export type CloudbaseGetCodeValues = z.infer<typeof CloudbaseGetCodeSchema>;
