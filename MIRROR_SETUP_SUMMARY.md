# GitHub 镜像配置总结

## 尝试的镜像方案

已尝试以下 GitHub 镜像，但均无法连接：

1. ❌ `ghproxy.com` - 连接超时
2. ❌ `mirror.ghproxy.com` - 连接超时

## 当前状态

Git 配置已恢复为默认状态（不使用镜像）。

## 解决方案

### ✅ 方案 1：跳过技能安装（推荐）

**这是最简单且推荐的方案**，因为：

- ✅ CloudBase 功能已经完全集成在项目中
- ✅ 所有必要的 SDK 和配置都已就绪
- ✅ 项目可以正常运行，无需额外技能

**直接使用项目即可，无需执行 `npx skills add` 命令。**

### 🔐 方案 2：使用 VPN 或代理

如果确实需要安装技能，可以：

1. **连接 VPN**：
   - 连接可用的 VPN 服务
   - 重新执行 `npx skills add tencentcloudbase/skills --yes`

2. **配置 Git 代理**（如果有代理服务器）：
   ```bash
   # HTTP/HTTPS 代理
   git config --global http.proxy http://proxy.example.com:8080
   git config --global https.proxy https://proxy.example.com:8080
   
   # SOCKS5 代理（例如本地 Shadowsocks）
   git config --global http.proxy socks5://127.0.0.1:1080
   git config --global https.proxy socks5://127.0.0.1:1080
   ```

3. **取消代理设置**（使用完后）：
   ```bash
   git config --global --unset http.proxy
   git config --global --unset https.proxy
   ```

### 📝 其他可用的镜像（如果网络允许）

如果未来网络环境改善，可以尝试以下镜像：

```bash
# 方案 A: ghproxy.com
git config --global url."https://ghproxy.com/https://github.com/".insteadOf "https://github.com/"

# 方案 B: mirror.ghproxy.com
git config --global url."https://mirror.ghproxy.com/https://github.com/".insteadOf "https://github.com/"

# 方案 C: hub.fastgit.xyz (FastGit)
git config --global url."https://hub.fastgit.xyz/".insteadOf "https://github.com/"

# 取消镜像配置
git config --global --unset url."https://ghproxy.com/https://github.com/".insteadOf
```

## 验证 Git 配置

查看当前 Git 配置：

```bash
# 查看所有 URL 重写规则
git config --global --get-regexp url

# 查看代理设置
git config --global --get http.proxy
git config --global --get https.proxy
```

## 结论

**建议直接跳过技能安装步骤**，因为：
- 项目功能完整，无需额外技能
- 网络环境限制导致无法访问 GitHub
- 使用 VPN/代理会增加复杂性

项目已经可以正常使用 CloudBase 的所有功能！
