# CloudBase 部署指南

## 一、整站部署（云托管 CloudRun）— 推荐

将完整的 Next.js 应用部署到 CloudRun，获取线上访问链接。

### 1. 前置条件

- 已安装 CloudBase CLI：`npm install -g @cloudbase/cli`
- 已登录：`tcb login`（或 `tcb login --key`）

### 2. 部署命令

在项目根目录执行：

```bash
tcb cloudrun deploy --port 3000
```

或使用 npm 脚本：`npm run tcb:cloudrun`

按提示输入：

- **环境 ID**：`denglu-8gher1d52a21e6fe`（或你的环境 ID）
- **服务名称**：如 `lokada-next`

### 3. 获取访问链接

部署成功后，CLI 会输出访问地址，格式类似：

```
https://lokada-next-xxxx-xxxx.ap-shanghai.run.tcloudbase.com
```

该地址即为线上访问链接。

### 4. 环境变量配置

**⚠️ 重要**：云托管需在控制台配置环境变量，否则应用无法正常运行。

#### 4.1 必需的环境变量

部署前，必须在 CloudBase 控制台配置以下环境变量：

**CloudBase 客户端配置（必需）：**
- `NEXT_PUBLIC_CLOUDBASE_ENV` - CloudBase 环境 ID（如：`denglu-8gher1d52a21e6fe`）
- `NEXT_PUBLIC_CLOUDBASE_CLIENT_ID` - CloudBase Client ID（通常与环境 ID 相同）
- `NEXT_PUBLIC_CLOUDBASE_REGION` - 地域（如：`ap-shanghai`）

**数据库配置（必需）：**
- `DATABASE_URL` - 数据库连接字符串

**其他服务配置（根据实际使用情况）：**
- `XF_APPID`、`XF_API_KEY`、`XF_API_SECRET` - 讯飞语音识别
- `COS_SECRET_ID`、`COS_SECRET_KEY`、`COS_BUCKET`、`COS_REGION` - 腾讯云 COS
- `KIE_AI_API_KEY` - KIE AI 服务
- 其他服务端环境变量

#### 4.2 在控制台配置步骤

1. 打开 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择对应的环境（如 `denglu-8gher1d52a21e6fe`）
3. 点击左侧菜单「云托管」
4. 选择你的服务（如 `lokada-next`）
5. 点击「配置」或「版本管理」标签页
6. 找到「环境变量」部分
7. 点击「添加环境变量」或「编辑」
8. 逐个添加环境变量：
   - **变量名**：必须与代码中完全一致（区分大小写）
   - **变量值**：从 `.env` 文件中复制对应的值
   - **作用域**：
     - `NEXT_PUBLIC_*` 变量会被注入到客户端代码中
     - 其他变量仅在服务端可用
9. 保存配置
10. **重要**：修改环境变量后，必须重新部署服务才能生效

#### 4.3 验证环境变量配置

部署前，可以使用以下命令检查环境变量配置：

```bash
npm run check:env
```

该脚本会检查：
- 必需的环境变量是否已配置
- 环境变量值是否为占位符（需要替换）
- 环境变量名称是否正确

#### 4.4 详细配置文档

更多环境变量配置说明，请查看 [CLOUDBASE_ENV_CONFIG.md](./CLOUDBASE_ENV_CONFIG.md)，包括：
- 完整的环境变量列表
- 每个变量的说明和示例
- 常见问题排查
- 配置检查清单

### 5. 本地验证

```bash
# 构建镜像
docker build -t lokada-next .

# 本地运行（可选）
docker run -p 3000:3000 --env-file .env lokada-next
```

---

## 二、云函数部署

### 1. 安装 CLI

```bash
npm install -g @cloudbase/cli
```

### 2. 登录

```bash
tcb login
```

或使用 npm 脚本：

```bash
npm run tcb:login
```

### 3. 关联环境

项目已配置 `cloudbaserc.json`，默认环境 ID 为 `denglu-8gher1d52a21e6fe`。

如需切换环境：

```bash
tcb env:use your-env-id
```

或：

```bash
npm run tcb:env your-env-id
```

### 4. 部署云函数

**部署单个函数：**

```bash
tcb functions:deploy hello
```

或：

```bash
npm run tcb:deploy:hello
```

**部署所有函数：**

```bash
tcb functions:deploy
```

或：

```bash
npm run tcb:deploy
```

**强制覆盖已存在的函数：**

```bash
tcb functions:deploy hello --force
```

## 项目结构

```
cloudfunctions/          # 云函数根目录（由 cloudbaserc.json 的 functionRoot 指定）
├── hello/               # 云函数：hello
│   ├── index.js         # 入口文件，需导出 exports.main
│   └── package.json     # 依赖声明（如有）
└── [其他函数]/          # 每个子目录 = 一个云函数
```

## 添加新云函数

1. 在 `cloudfunctions/` 下新建目录，如 `cloudfunctions/myFunc/`
2. 创建 `index.js`，导出 `exports.main = async (event, context) => { ... }`
3. 如需依赖，在目录内添加 `package.json`
4. 执行 `tcb functions:deploy myFunc`

## 配置说明

- `cloudbaserc.json`：CLI 配置文件
- `envId`：云开发环境 ID，与 `.env` 中 `NEXT_PUBLIC_CLOUDBASE_ENV` 一致
- `region`：地域，`ap-shanghai` 上海

## 参考链接

- [CloudBase CLI 文档](https://docs.cloudbase.net/cli-v1/intro)
- [云托管代码部署](https://docs.cloudbase.net/cli-v1/cloudrun/deploy)
- [云函数部署](https://docs.cloudbase.net/cli-v1/functions/deploy)
