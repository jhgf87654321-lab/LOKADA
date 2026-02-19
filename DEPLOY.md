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

### 4. 环境变量

云托管需在控制台配置环境变量（数据库、CloudBase、COS、讯飞等）。部署后：

1. 打开 [CloudBase 控制台](https://console.cloud.tencent.com/tcb) → 云托管 → 选择服务
2. 在「版本管理」或「配置」中设置环境变量
3. 变量名与 `.env` 中一致，如：`DATABASE_URL`、`NEXT_PUBLIC_CLOUDBASE_ENV` 等

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
