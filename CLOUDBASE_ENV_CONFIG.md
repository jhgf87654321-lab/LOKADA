# CloudBase 环境变量配置指南

本文档说明如何在 CloudBase 云托管（CloudRun）中配置环境变量。

## 📋 必需的环境变量列表

### 1. CloudBase 客户端配置（必需）

这些变量用于前端 CloudBase SDK 初始化：

| 变量名 | 说明 | 示例值 | 作用域 |
|--------|------|--------|--------|
| `NEXT_PUBLIC_CLOUDBASE_ENV` | CloudBase 环境 ID | `denglu-8gher1d52a21e6fe` | 客户端 |
| `NEXT_PUBLIC_CLOUDBASE_CLIENT_ID` | CloudBase Client ID | `denglu-8gher1d52a21e6fe` | 客户端 |
| `NEXT_PUBLIC_CLOUDBASE_REGION` | 地域 | `ap-shanghai` | 客户端 |

### 2. 数据库配置（必需）

| 变量名 | 说明 | 示例值 | 作用域 |
|--------|------|--------|--------|
| `DATABASE_URL` | 数据库连接字符串 | `mysql://user:pass@host:3306/db` | 服务端 |
| `DIRECT_URL` | 直连数据库连接字符串（可选） | `mysql://user:pass@host:3306/db` | 服务端 |

### 3. 其他服务配置

| 变量名 | 说明 | 示例值 | 作用域 |
|--------|------|--------|--------|
| `XF_APPID` | 讯飞语音 APPID | `your-xf-appid` | 服务端 |
| `XF_API_KEY` | 讯飞语音 API Key | `your-xf-api-key` | 服务端 |
| `XF_API_SECRET` | 讯飞语音 API Secret | `your-xf-api-secret` | 服务端 |
| `COS_SECRET_ID` | 腾讯云 COS Secret ID | `your-cos-secret-id` | 服务端 |
| `COS_SECRET_KEY` | 腾讯云 COS Secret Key | `your-cos-secret-key` | 服务端 |
| `COS_BUCKET` | COS 存储桶名称 | `your-bucket-name` | 服务端 |
| `COS_REGION` | COS 地域 | `ap-shanghai` | 服务端 |
| `KIE_AI_API_KEY` | KIE AI API Key | `your-kie-api-key` | 服务端 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob Token（如使用） | `vercel_blob_rw_...` | 服务端 |
| `BETTER_AUTH_SECRET` | Better Auth Secret（如使用） | `your-better-auth-secret` | 服务端 |
| `NEXT_PUBLIC_BASE_URL` | 应用基础 URL | `https://your-domain.com` | 客户端 |

## 🔧 在 CloudBase 控制台配置环境变量

### 步骤 1：登录控制台

1. 访问 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择对应的环境（如 `denglu-8gher1d52a21e6fe`）

### 步骤 2：进入云托管服务配置

1. 点击左侧菜单「云托管」
2. 选择你的服务（如 `lokada-next`）
3. 点击「配置」或「版本管理」标签页
4. 找到「环境变量」部分

### 步骤 3：添加环境变量

对于每个环境变量：

1. 点击「添加环境变量」或「编辑」
2. 输入变量名（**必须与代码中完全一致**）
3. 输入变量值
4. 选择作用域：
   - **客户端变量**（`NEXT_PUBLIC_*`）：会被注入到前端代码中
   - **服务端变量**：仅在服务端可用，不会暴露给客户端

### 步骤 4：保存并重启

1. 点击「保存」
2. **重要**：修改环境变量后，需要：
   - 重新部署服务，或
   - 重启服务实例

## ⚠️ 重要注意事项

### 1. 变量名必须完全一致

环境变量名**区分大小写**，必须与代码中引用的名称完全一致：

```typescript
// ✅ 正确
const env = process.env.NEXT_PUBLIC_CLOUDBASE_ENV;

// ❌ 错误（大小写不一致）
const env = process.env.NEXT_PUBLIC_CLOUDBASE_ENV; // 如果控制台设置的是 NEXT_PUBLIC_CLOUDBASE_env
```

### 2. NEXT_PUBLIC_ 前缀

- 以 `NEXT_PUBLIC_` 开头的变量会被注入到客户端代码中
- 这些变量在浏览器中可见，**不要存储敏感信息**
- 客户端变量在构建时会被替换，修改后需要重新构建

### 3. 服务端变量

- 不以 `NEXT_PUBLIC_` 开头的变量仅在服务端可用
- 这些变量可以存储敏感信息（如 API Secret、数据库密码）

### 4. 环境变量作用域

- **构建时**：`NEXT_PUBLIC_*` 变量在构建时被替换到代码中
- **运行时**：服务端变量在运行时从环境读取

## 🔍 验证环境变量配置

### 方法 1：使用诊断页面

访问 `/cloudbase/dashboard`，如果环境变量未配置，页面会显示详细的诊断信息。

### 方法 2：查看浏览器控制台

1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签
3. 查找 `[CloudBase Dashboard] 环境变量检查:` 日志
4. 确认环境变量的实际值

### 方法 3：使用验证脚本

运行项目根目录的验证脚本：

```bash
npm run check:env
```

## 🐛 常见问题排查

### 问题 1：环境变量未生效

**症状**：配置了环境变量，但应用仍显示"未配置"

**解决方案**：
1. 确认变量名完全一致（包括大小写）
2. 确认已保存配置
3. **重新部署服务**（环境变量修改后必须重新部署）
4. 清除浏览器缓存并刷新页面

### 问题 2：客户端变量未加载

**症状**：`NEXT_PUBLIC_*` 变量在浏览器中为 `undefined`

**可能原因**：
- 变量名拼写错误
- 未以 `NEXT_PUBLIC_` 开头
- 构建时变量未设置（需要在构建前设置）

**解决方案**：
- 检查变量名是否正确
- 确认在 CloudBase 控制台正确设置
- 重新构建并部署

### 问题 3：服务端变量未加载

**症状**：服务端 API 路由中 `process.env.XXX` 为 `undefined`

**可能原因**：
- 变量名拼写错误
- 未在 CloudBase 控制台配置
- 服务未重启

**解决方案**：
- 检查变量名是否正确
- 在控制台添加变量
- 重启服务或重新部署

## 📝 快速配置清单

部署前检查清单：

- [ ] `NEXT_PUBLIC_CLOUDBASE_ENV` 已设置
- [ ] `NEXT_PUBLIC_CLOUDBASE_CLIENT_ID` 已设置
- [ ] `NEXT_PUBLIC_CLOUDBASE_REGION` 已设置
- [ ] `DATABASE_URL` 已设置（如使用数据库）
- [ ] `XF_APPID`、`XF_API_KEY`、`XF_API_SECRET` 已设置（如使用语音识别）
- [ ] `COS_SECRET_ID`、`COS_SECRET_KEY`、`COS_BUCKET` 已设置（如使用 COS）
- [ ] 所有变量名与 `.env` 文件中的一致
- [ ] 已保存配置
- [ ] 已重新部署服务

## 🔗 相关文档

- [CloudBase 云托管文档](https://docs.cloudbase.net/cloudrun/intro)
- [Next.js 环境变量文档](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [项目部署文档](./DEPLOY.md)
