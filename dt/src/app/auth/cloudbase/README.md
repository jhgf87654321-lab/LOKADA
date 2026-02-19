# CloudBase 独立认证模块

## 路由地址

- 登录页面：`/auth/cloudbase/login`
- 注册页面：`/auth/cloudbase/register`
- 用户中心：`/auth/cloudbase/dashboard`
- 测试页面：`/auth/cloudbase/test`

## 如果页面无法打开

### 1. 重启开发服务器

```powershell
# 停止当前服务器（Ctrl+C）
npm run dev
```

### 2. 清除 Next.js 缓存

```powershell
# 删除 .next 文件夹
Remove-Item -Recurse -Force .next

# 重新启动
npm run dev
```

### 3. 检查浏览器控制台

- 按 F12 打开开发者工具
- 查看 Console 标签是否有错误
- 查看 Network 标签是否有请求失败

### 4. 验证路由

访问测试页面：`http://localhost:3000/auth/cloudbase/test`

如果测试页面能打开，说明路由正常，问题可能在具体页面组件。

### 5. 检查环境变量

确保 `.env` 文件中有：

```env
NEXT_PUBLIC_CLOUDBASE_ENV=你的环境ID
NEXT_PUBLIC_CLOUDBASE_CLIENT_ID=你的Client ID
NEXT_PUBLIC_CLOUDBASE_REGION=ap-shanghai
```

修改 `.env` 后必须重启开发服务器。

## 常见错误

### 404 Not Found

- 检查路由路径是否正确
- 确认文件是否存在于 `src/app/auth/cloudbase/` 目录
- 重启开发服务器

### 组件错误

- 检查浏览器控制台的错误信息
- 确认所有导入路径正确（使用 `@/` 别名）

### CloudBase 连接错误

- 检查环境变量是否配置
- 检查云开发控制台「安全来源」是否添加了当前域名
