/**
 * 腾讯云 CloudBase 初始化与 Auth 实例
 * 文档: https://docs.cloudbase.net/api-reference/webv2/authentication#authsignin
 *
 * 集成说明：将此文件复制到项目的 src/lib/cloudbase.ts
 */

import cloudbase from "@cloudbase/js-sdk";

const env = process.env.NEXT_PUBLIC_CLOUDBASE_ENV;
const clientId = process.env.NEXT_PUBLIC_CLOUDBASE_CLIENT_ID;
const region = process.env.NEXT_PUBLIC_CLOUDBASE_REGION ?? "ap-shanghai";

let appInstance: ReturnType<typeof cloudbase.init> | null = null;

export function getCloudbaseApp() {
  if (typeof window === "undefined") return null;
  if (!env || !clientId) {
    console.warn("[CloudBase] 环境变量未配置: NEXT_PUBLIC_CLOUDBASE_ENV 或 NEXT_PUBLIC_CLOUDBASE_CLIENT_ID");
    return null;
  }
  if (!appInstance) {
    appInstance = cloudbase.init({ env, clientId, region });
  }
  return appInstance;
}

export function getCloudbaseAuth() {
  const app = getCloudbaseApp();
  return app ? app.auth() : null;
}
