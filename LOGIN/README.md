# CloudBase 登录模块

基于腾讯云 CloudBase 的独立登录/注册/用户中心模块，适用于 Next.js App Router 项目。

## 功能

- **登录**：用户名/邮箱/手机号 + 密码
- **注册**：手机号验证码 + 用户名 + 密码（需上海地域并开启手机号验证码登录）
- **用户中心**：查看用户信息、退出登录

## 集成步骤

### 1. 安装依赖

```bash
npm install @cloudbase/js-sdk
```

### 2. 复制文件

将以下内容复制到你的 Next.js 项目中：

| LOGIN 中路径 | 复制到项目路径 |
|-------------|----------------|
| `lib/cloudbase.ts` | `src/lib/cloudbase.ts` |
| `app/cloudbase/` 整个目录 | `src/app/cloudbase/` |

确保项目 `tsconfig.json` 中配置了路径别名：

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### 3. 配置环境变量

在项目根目录 `.env.local` 或 `.env` 中添加：

```env
NEXT_PUBLIC_CLOUDBASE_ENV=你的环境ID
NEXT_PUBLIC_CLOUDBASE_CLIENT_ID=你的Client ID
NEXT_PUBLIC_CLOUDBASE_REGION=ap-shanghai
```

从 [云开发控制台](https://tcb.cloud.tencent.com/) → 身份认证 / 登录方式 获取环境 ID 和 Client ID。

### 4. 配置安全来源

在云开发控制台「安全域名」中添加你的访问域名（如 `http://localhost:3000`），否则 CloudBase 会拒绝连接。

## 路由地址

集成后默认路由为：

- 登录：`/cloudbase/login`
- 注册：`/cloudbase/register`
- 用户中心：`/cloudbase/dashboard`

## 云开发控制台配置

需在控制台启用以下登录方式：

- **用户名密码登录**：用于 `signIn({ username, password })`
- **邮箱密码登录** 或 **邮箱验证码登录**：支持邮箱登录
- **手机号验证码登录**：支持手机号注册（仅上海地域）

手机号相关能力仅在上海地域可用。

## 目录结构

```
LOGIN/
├── README.md
├── env.example
├── lib/
│   └── cloudbase.ts          # CloudBase 初始化，复制到 src/lib/
└── app/
    └── cloudbase/
        ├── layout.tsx
        ├── globals.css
        ├── login/
        │   ├── page.tsx
        │   └── form.tsx
        ├── register/
        │   ├── page.tsx
        │   └── form.tsx
        └── dashboard/
            └── page.tsx
```

## 参考文档

- [CloudBase Web 身份认证 API](https://docs.cloudbase.net/api-reference/webv2/authentication)
