# GitHub 连接问题解决方案

## 问题描述

在执行 `npx skills add tencentcloudbase/skills` 时，出现以下错误：

```
Failed to clone https://github.com/tencentcloudbase/skills.git
fatal: unable to access 'https://github.com/tencentcloudbase/skills.git/': 
Failed to connect to github.com port 443 after 21065 ms: Could not connect to server
```

这通常是因为网络无法访问 GitHub（常见于中国大陆地区）。

## 解决方案

### ✅ 方案 1：跳过此步骤（推荐）

**这个步骤是可选的**，不会影响项目的正常运行。CloudBase 功能已经集成在项目中，无需额外安装技能。

**直接继续使用项目即可**，无需执行 `npx skills add` 命令。

### 🔧 方案 2：配置 Git 代理（如果有代理服务器）

如果你有可用的代理服务器（HTTP/HTTPS 或 SOCKS5），可以配置 Git 使用代理：

#### 2.1 HTTP/HTTPS 代理

```bash
# 设置 HTTP 代理
git config --global http.proxy http://proxy.example.com:8080
git config --global https.proxy https://proxy.example.com:8080

# 如果需要认证
git config --global http.proxy http://username:password@proxy.example.com:8080
```

#### 2.2 SOCKS5 代理

```bash
# 设置 SOCKS5 代理（例如本地 Shadowsocks）
git config --global http.proxy socks5://127.0.0.1:1080
git config --global https.proxy socks5://127.0.0.1:1080
```

#### 2.3 仅对 GitHub 使用代理

```bash
# 仅对 github.com 使用代理
git config --global http.https://github.com.proxy socks5://127.0.0.1:1080
```

#### 2.4 取消代理设置

```bash
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### 🌐 方案 3：使用 GitHub 镜像

可以使用 GitHub 镜像站点来访问：

#### 3.1 使用 ghproxy.com 镜像

```bash
# 临时使用镜像克隆
git clone https://ghproxy.com/https://github.com/tencentcloudbase/skills.git
```

#### 3.2 配置 Git 使用镜像

```bash
# 为 GitHub 配置镜像 URL
git config --global url."https://ghproxy.com/https://github.com/".insteadOf "https://github.com/"
```

### 🔐 方案 4：使用 VPN

如果你有 VPN 服务，可以：
1. 连接 VPN
2. 重新执行 `npx skills add tencentcloudbase/skills`

### 📥 方案 5：手动下载（不推荐）

如果以上方案都不适用，可以手动下载技能文件，但通常不需要这样做。

## 验证连接

配置代理后，可以测试 GitHub 连接：

```bash
# 测试 HTTPS 连接
curl -I https://github.com

# 测试 Git 克隆
git clone https://github.com/tencentcloudbase/skills.git /tmp/test-clone
```

## 注意事项

1. **技能安装是可选的**：CloudBase 功能已经集成在项目中，无需额外安装技能
2. **代理配置是全局的**：使用 `--global` 参数会影响所有 Git 操作
3. **镜像可能不稳定**：GitHub 镜像站点可能不稳定或速度较慢
4. **网络环境**：在某些网络环境下，可能需要联系网络管理员配置代理

## 推荐做法

**对于本项目，建议直接跳过技能安装步骤**，因为：
- ✅ 项目已经集成了 CloudBase SDK
- ✅ 所有必要的配置已经完成
- ✅ 环境变量验证脚本已就绪
- ✅ 部署文档已完善

继续使用项目即可，无需安装额外的技能。
