import { cache } from "react";

/**
 * better-auth 服务端已下线，认证逻辑已完全迁移到 CloudBase。
 * 此函数保留以兼容旧代码，但始终返回 null。
 * 如需获取会话信息，请使用 CloudBase Auth API。
 */
export const getServerSession = cache(async () => {
  return null;
});
