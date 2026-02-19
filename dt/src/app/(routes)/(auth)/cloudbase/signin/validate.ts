import { z } from "zod";

/**
 * CloudBase 登录：username 为手机号/邮箱/自定义用户名
 * 中国手机号需带 +86 前缀，如 +86 138xxxxxxxx
 */
export const CloudbaseSignInSchema = z.object({
  username: z.string().min(1, { message: "请输入手机号、邮箱或用户名" }),
  password: z.string().min(1, { message: "请输入密码" }),
});

export type CloudbaseSignInValues = z.infer<typeof CloudbaseSignInSchema>;
