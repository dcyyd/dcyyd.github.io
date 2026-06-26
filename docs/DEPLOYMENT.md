# 部署指南

> **FilePress Blog** (`filepress-blog` v2.6.0) · 作者：窦长友 &lt;dcyyd_kcug@yeah.net&gt;
>
> 本文档覆盖 VitePress 构建产物的多种部署方案，包含 GitHub Actions、gh-pages 一键推送、Nginx / 静态托管、Netlify / Vercel 等场景。所有方案均与项目 `post-cli` 子系统保持完全一致。
>
> **最近更新**：2026-06-26 发布 v2.6.0：🌐 SEO 全方位增强（robots.txt / Schema.org / Meta 优化） · 📊 访问量统计重构（不蒜子 busuanzi 主统计 + localStorage 降级） · 🔤 字体加载优化（@fontsource self-host 消除 FOIT） · 🖼️ OptimizedImage 全站接入（WebP + aspect-ratio 防 CLS） · ✨ 动画与视觉层次增强（stagger / spring / 设计令牌） · 🍞 Breadcrumbs 面包屑导航。

---

## 目录

- [快速概览](#快速概览)
- [方案一 · GitHub Actions 自动部署（推荐）](#方案一--github-actions-自动部署推荐)
- [方案二 · 🆕 `pnpm post d` 一键部署到 gh-pages（v2.0 新增）](#方案二--pnpm-post-d-一键部署到-gh-pagesv20-新增)
- [方案三 · 手动推送 gh-pages 分支（兼容旧流程）](#方案三--手动推送-gh-pages-分支兼容旧流程)
- [方案四 · Nginx 部署](#方案四--nginx-部署)
- [方案五 · Netlify / Vercel](#方案五--netlify--vercel)
- [环境变量](#环境变量)
- [故障排查](#故障排查)
- [部署架构决策记录](#部署架构决策记录)

---

## 快速概览

| 方案 | 适用场景 | 自动化 | 手动干预 | 产物 |
| --- | --- | --- | --- | --- |
| **GitHub Actions（推荐）** | 推代码即自动部署 | 全自动 | 无 | `gh-pages` 分支 |
| **`pnpm post d` 一键脚本（v2.0）** | 本地控制部署节奏 | 半自动 | 一键命令 | `gh-pages` 分支 |
| 手动 gh-pages 分支 | 兼容旧流程 / 紧急修复 | 手动 | 全部步骤 | `gh-pages` 分支 |
| Nginx / 静态托管 | 自有服务器 / OSS / CDN | 手动 | scp / rsync | `.vitepress/dist/` |
| Netlify / Vercel | 第三方平台托管 | 自动 | 连接 Git | 平台自定义 |

> **推荐组合**：日常发布用 GitHub Actions；本地调试 / 紧急修复用 `pnpm post d`。

---

## 方案一 · GitHub Actions 自动部署（推荐）

### 原理

```
推送源码到 main 分支
  → GitHub Actions 触发 .github/workflows/deploy.yml
  → pnpm install → pnpm typecheck → pnpm rss → pnpm build
  → 上传 .vitepress/dist 为 Artifact
  → 部署到 GitHub Pages
```

### 首次设置

1. **确认工作流文件存在**

   工程根 `.github/workflows/deploy.yml` 已内置。关键字段：

   ```yaml
   env:
     BASE: /                # user 页面用 '/'; project 页面用 '/repo-name/'
     SITE_URL: https://dcyyd.github.io
   ```

2. **配置 GitHub Pages 源**

   进入仓库 **Settings → Pages**：
   - **Source**：选择 **"GitHub Actions"**
   - **不要**选择 "Deploy from a branch"

3. **配置 Actions 写权限**

   **Settings → Actions → General → Workflow permissions** → 选 **"Read and write permissions"**。

4. **（可选）自定义域名**

   在 **Settings → Pages → Custom domain** 填入域名，并在 `public/CNAME` 写入同域名。

### 每次发布

```bash
git add .
git commit -m "new post: xxx"
git push origin main
```

部署进度：<https://github.com/dcyyd/dcyyd.github.io/actions>

### 手动触发

Actions 面板 → **"Deploy to GitHub Pages"** → **Run workflow** → 选择 `main` → 运行。

### User Page vs Project Page

| 仓库类型 | `BASE` 值 | Pages URL |
| --- | --- | --- |
| `<user>.github.io` | `/` | `https://<user>.github.io` |
| `<user>/<repo>` | `/<repo>/` | `https://<user>.github.io/<repo>` |

---

## 方案二 · 🆕 `pnpm post d` 一键部署到 gh-pages（v2.0 新增）

> 源码：[`scripts/post-cli/deploy.mjs`](../scripts/post-cli/deploy.mjs) · 详细说明：[`scripts/readme.md` § 5.5](../scripts/readme.md)

### 2.1 用法

```bash
pnpm post d                  # 完整流程：预检 → 构建 → 推送
pnpm pd                      # 同样可用（package.json 脚本别名）
pnpm post d -y               # 跳过确认
pnpm post d --skip-build     # 复用现有 .vitepress/dist
pnpm post d --branch main    # 推送到指定分支
pnpm post d -m "fix: typo"   # 自定义 commit 信息
pnpm post d --skip-push      # 只构建不推送（用于本地预览产物）
pnpm post d --no-cleanup     # 保留 dist/.git（调试）
```

### 2.2 内部步骤

| 阶段 | 行为 | 失败处理 |
| --- | --- | --- |
| **① 预检** | 检查 git 可用、SSH 可达、源码工作区状态 | 软警告而非硬中断 |
| **② 构建** | 执行 `npx vitepress build .`，实时透传进度 | 提示重新单独运行查看详情 |
| **③ 推送** | 在 `.vitepress/dist` 内初始化临时仓库 → commit → `force-push` 到 `gh-pages` | 自动清理临时 `.git` |
| **④ 清理** | 移除 `.vitepress/dist/.git` 临时仓库 | 即使异常退出也会兜底执行 |

### 2.3 选项

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `--repo <url>`         | 目标仓库 | `git@github.com:dcyyd/dcyyd.github.io.git` |
| `--branch <name>`      | 目标分支 | `gh-pages` |
| `-m, --message <text>` | commit 信息 | `deploy: update site` |
| `--skip-build`         | 跳过构建，复用现有 dist | `false` |
| `--skip-push`          | 只构建不推送 | `false` |
| `--no-cleanup`         | 保留 dist/.git（调试） | `false` |
| `-y, --yes`            | 跳过确认步骤 | `false` |

### 2.4 环境变量

| 变量 | 作用 | 等价 flag |
| --- | --- | --- |
| `DEPLOY_REPO`   | 覆盖默认仓库 | `--repo` |
| `DEPLOY_BRANCH` | 覆盖默认分支 | `--branch` |

### 2.5 实现要点

- **跨平台执行**：完全基于 `node:child_process` + `node:fs/promises`，不再依赖 PowerShell。
- **参数安全**：`execFile(..., { shell: false })`，args 作为数组原样传递，避免含空格的 message 被 shell 错误拆分。
- **Windows SSH**：自动注入 `HOME=C:/Users/...` 与 `GIT_SSH_COMMAND`，确保 OpenSSH 找到 `~/.ssh/id_rsa`。
- **软预检**：SSH 认证失败时给出警告而非硬中断，可由 `DEPLOY_REPO` 切换为 HTTPS。
- **失败清理**：异常退出时同步清理 `.vitepress/dist/.git` 临时仓库。

### 2.6 典型工作流

```bash
# 1. 创建并写好文章
pnpm post n my-new-article -t "主题" -o

# 2. 本地预览
pnpm post s

# 3. 一键部署
pnpm post d -y

# 4. 1-2 分钟后访问 https://dcyyd.github.io
```

### 2.7 前置条件

- 仓库远端使用 SSH 协议（默认配置即可）。
- 本机 `~/.ssh/id_rsa` 已添加到 GitHub Settings → SSH keys。
- GitHub Pages Source 选 **"Deploy from a branch"**，分支 `gh-pages`，目录 `/`。

### 2.8 与 GitHub Actions 的关系

| 场景 | 推荐方案 |
| --- | --- |
| 日常多人协作 | 推 `main` → Actions 自动部署 |
| 本地调试 / 紧急修复 | `pnpm post d -y` |
| CI 容器 / 沙箱环境 | `pnpm post d --skip-build` + Actions |

两套方案**不冲突**：只要 GitHub Pages 的 Source 设置一致，Actions 与 `pnpm post d` 推送的产物都会被 Pages 渲染。

### 2.9 已知 BUG 与修复（v2.0）

| ID | 现象 | 根因 | 修复 |
| --- | --- | --- | --- |
| B001 | `error: pathspec 'update' did not match` | `shell: true` 拆分含空格 message | 改 `shell: false` |
| B002 | `消息: true` | `-m` 未注册为短选项 | `SHORT_FLAGS` 新增 `m: 'message'` |
| B003 | `Could not create directory '/home/root/.ssh'` | Windows 节点进程无 `HOME` | 注入 `HOME` + `GIT_SSH_COMMAND` |
| B005 | SSH 预检误报 | `BatchMode=yes` + 仅看退出码 | 解析 `successfully authenticated` 文本 |
| B006 | `DEP0190` 警告 | `execFile` + `shell: true` | 改 `shell: false` + Windows `.exe` 自动追加 |

---

## 方案三 · 手动推送 gh-pages 分支（兼容旧流程）

> 该方案为 `pnpm post d` 出现之前的"原始"流程。保留此节用于无 Node 工具链的极端环境。

### 首次推送

```powershell
# 1. 构建
$env:HOME = 'C:/Users/Administrator'
$env:GIT_SSH_COMMAND = 'ssh -i C:/Users/Administrator/.ssh/id_rsa -o UserKnownHostsFile=C:/Users/Administrator/.ssh/known_hosts -o StrictHostKeyChecking=accept-new'
npx vitepress build .

# 2. 将 dist 内容推送到 gh-pages 分支
Set-Location .vitepress/dist
git init
git checkout -b gh-pages
git add -A
git commit -m "deploy: initial"
git remote add origin git@github.com:dcyyd/dcyyd.github.io.git
git push -f origin gh-pages

# 3. 清理
Set-Location ../..
Remove-Item -Recurse -Force .vitepress/dist/.git
```

### 后续更新

```powershell
Set-Location .vitepress/dist
git init; git checkout -b tmp
git add -A; git commit -m "deploy: update"
git remote add origin git@github.com:dcyyd/dcyyd.github.io.git
git push -f origin tmp:gh-pages
Set-Location ../..
Remove-Item -Recurse -Force .vitepress/dist/.git
```

### GitHub Pages 设置

**Settings → Pages** → Source = **"Deploy from a branch"** · Branch = `gh-pages` · Directory = `/ (root)`。

> 强烈建议改用 `pnpm post d`，避免手敲 PowerShell 路径与 SSH 配置。

---

## 方案四 · Nginx 部署

### 配置示例

```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/filepress-blog/.vitepress/dist;
    index index.html;

    # VitePress cleanUrls 支持
    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    # 静态资源长期缓存（文件名含 hash）
    location ~* \.(css|js|woff2|webp|svg|png|jpg)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # RSS / favicon 短缓存
    location ~* \.(xml|ico)$ {
        add_header Cache-Control "public, max-age=3600";
    }
}
```

### 上传命令

```bash
# 本地构建
pnpm build

# 同步到服务器
rsync -avz --delete .vitepress/dist/ user@server:/var/www/filepress-blog/
```

### HTTPS

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # 强制 HTTP/2 + TLS 1.2+
    ssl_protocols TLSv1.2 TLSv1.3;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

---

## 方案五 · Netlify / Vercel

### Netlify

**Dashboard → Add new site → Import an existing project**，配置：

```
Build command:  pnpm build
Publish directory: .vitepress/dist
```

或 `netlify.toml`：

```toml
[build]
  command = "pnpm build"
  publish = ".vitepress/dist"

[build.environment]
  NODE_VERSION = "20"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Vercel

框架预设选择 **Vite**，覆盖构建配置：

```
Build Command:       pnpm build
Output Directory:    .vitepress/dist
Install Command:     pnpm install
```

或 `vercel.json`：

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".vitepress/dist",
  "framework": null
}
```

---

## 环境变量

| 变量 | 默认值 | 作用 |
| --- | --- | --- |
| `BASE` | `/` | VitePress base 路径，影响所有资源引用 |
| `SITE_URL` | 自动取 `BASE` | RSS feed 中的站点完整 URL |
| `DEPLOY_REPO` | `git@github.com:dcyyd/dcyyd.github.io.git` | `pnpm post d` 目标仓库 |
| `DEPLOY_BRANCH` | `gh-pages` | `pnpm post d` 目标分支 |

CI 中通过 GitHub Actions `env` 注入；本地可通过命令行设置：

```bash
# 本地模拟生产构建（project page 场景）
BASE=/repo-name/ SITE_URL=https://example.com/repo-name pnpm build
```

---

## 故障排查

### 部署后页面白屏 / 资源 404

最常见原因：`BASE` 路径不正确。

- **User Page** (`<user>.github.io`)：`BASE=/`
- **Project Page** (`<user>/<repo>`)：`BASE=/<repo>/`

检查 `.github/workflows/deploy.yml` 或 `pnpm post d` 的目标仓库配置。

### GitHub Actions 部署失败

1. **Settings → Pages → Source** 是否为 **"GitHub Actions"**。
2. **Settings → Actions → General → Workflow permissions** → 选 **"Read and write permissions"**。
3. 查看 Actions 日志中具体的构建或部署错误。

### SSH 认证失败（`pnpm post d`）

```bash
# 1. 验证 SSH 连接
ssh -T git@github.com

# 2. 确认公钥已添加
#    GitHub Settings → SSH and GPG keys → New SSH key

# 3. 确认 ~/.ssh/config 正确（可选）
# Host github.com
#   HostName github.com
#   User git
#   IdentityFile ~/.ssh/id_rsa

# 4. Windows 节点进程缺少 HOME
#    deploy.mjs 已自动注入；如仍报错，检查 deploy.mjs getDeployEnv()
```

### 推送后 1-2 分钟仍 404

- GitHub Pages CDN 通常 30 秒 ~ 2 分钟内生效。
- 在 **Settings → Pages** 查看最新一次部署状态。
- 强制刷新浏览器（`Ctrl + Shift + R`）绕过本地缓存。

### `error: pathspec 'update' did not match`（v2.0 已修复）

**根因**：`execFile` 使用 `shell: true`，含空格的 commit message 被拆分。
**修复**：v2.0 起强制 `shell: false` + args 数组透传。

### `消息: true` 误解析（v2.0 已修复）

**根因**：`-m` 短选项未注册，被 fallback 为 boolean flag。
**修复**：`SHORT_FLAGS` 注册 `m: 'message'` + 解析时检查类型。

### `Could not create directory '/home/root/.ssh'`（v2.0 已修复）

**根因**：Windows 节点进程未设置 `HOME`，Git for Windows ssh 找不到 `~/.ssh`。
**修复**：`getDeployEnv()` 注入 `HOME=C:/Users/...` + `GIT_SSH_COMMAND`。

---

## 部署架构决策记录

### 为什么同时保留 Actions 与 `pnpm post d`？

| 维度 | GitHub Actions | `pnpm post d` |
| --- | --- | --- |
| **使用门槛** | git push 即可 | 需本地有 Node + 工具链 |
| **可观测性** | Actions 日志完整 | 终端实时输出 |
| **回滚** | 重新 push 即可 | `--skip-build` 复用旧 dist |
| **跨平台** | 依赖 runner 镜像 | 跨平台统一 |
| **安全凭据** | Actions Secret | 本地 SSH 密钥 |
| **典型场景** | 日常发布 | 本地调试 / 紧急修复 |

### 为什么默认推 `gh-pages` 而非 `main`？

- `main` 保留源码（`content/posts/`、`.vitepress/`、组件源码等）。
- `gh-pages` 只放构建产物（`.vitepress/dist/` 静态文件）。
- 双重分支互不污染，源码可独立版本管理。

### 为什么不用 GitHub Pages 的"GitHub Actions" 源？

> 实际上 v2.0 也**支持** Actions 源。
> 之所以保留 `gh-pages` 分支方案，是为了让**没有 Actions 权限**的协作者 / 镜像仓库也能继续部署。

---

**FilePress Blog** · v2.6.0 · 作者 [窦长友](mailto:dcyyd_kcug@yeah.net)
