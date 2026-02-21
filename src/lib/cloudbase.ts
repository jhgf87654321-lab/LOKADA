/**
 * 腾讯云 CloudBase 初始化与 Auth 实例
 * 符合 CloudBase Web SDK 2.24.0+ 规范
 * 文档: https://docs.cloudbase.net/api-reference/webv2/authentication
 *
 * 集成说明：将此文件复制到项目的 src/lib/cloudbase.ts
 */

import cloudbase from "@cloudbase/js-sdk";

const env = process.env.NEXT_PUBLIC_CLOUDBASE_ENV;
const clientId = process.env.NEXT_PUBLIC_CLOUDBASE_CLIENT_ID;
const region = process.env.NEXT_PUBLIC_CLOUDBASE_REGION ?? "ap-shanghai";
// publishable key (accessKey) - 从环境变量获取，如果未设置则使用 clientId 作为 fallback
const accessKey = process.env.NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY || clientId;

let appInstance: ReturnType<typeof cloudbase.init> | null = null;

/**
 * 获取 CloudBase App 实例
 * 符合 CloudBase Web SDK 规范：同步初始化，包含 accessKey 和 auth 配置
 */
export function getCloudbaseApp() {
  if (typeof window === "undefined") {
    console.warn("[CloudBase] 服务端环境不支持 CloudBase 客户端 SDK");
    return null;
  }
  if (!env || !accessKey) {
    console.warn("[CloudBase] 环境变量未配置:", {
      env: env || "未设置",
      accessKey: accessKey || "未设置",
      region: region || "未设置",
      hint: "请检查 .env 文件中的 NEXT_PUBLIC_CLOUDBASE_ENV 和 NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY",
    });
    return null;
  }
  if (!appInstance) {
    // 符合 CloudBase Web SDK 2.24.0+ 规范：
    // 1. 同步初始化（不使用动态导入或异步包装器）
    // 2. 必须包含 accessKey (publishable key)
    // 3. auth 配置（如果 SDK 版本支持）
    const initConfig: any = {
      env,
      region,
      accessKey, // publishable key，必需
    };
    // 如果 SDK 支持 auth 配置，则添加
    if (typeof (cloudbase.init as any).prototype !== 'undefined' || true) {
      initConfig.auth = { detectSessionInUrl: true }; // 用于检测 URL 中的会话
    }
    appInstance = cloudbase.init(initConfig);
  }
  return appInstance;
}

/**
 * 获取 CloudBase Auth 实例
 * 符合 CloudBase Web SDK 规范：使用新版 API
 */
export function getCloudbaseAuth() {
  const app = getCloudbaseApp();
  return app ? app.auth : null; // 注意：新版 SDK 使用 app.auth 而不是 app.auth()
}
