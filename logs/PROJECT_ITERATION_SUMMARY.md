# 项目迭代总结 · v1.0 → v2.2

> **FilePress Blog** (`filepress-blog` v2.2.0) · 作者：窦长友 &lt;dcyyd_kcug@yeah.net&gt;
>
> 本文是 v1.0 → v2.2 的完整变更记录与技术决策文档，覆盖新功能、BUG 修复、UI / 输出优化、文档体系与未来规划。
>
> **最近更新**：2026-06-24 发布 v2.2.0，集成 GUI 管理后台（Web SPA 管理工作台）。

---

## 目录

- [项目概览](#项目概览)
- [v2.2 变更总览](#v22-变更总览)
- [v2.1 变更总览](#v21-变更总览)
- [v2.0 重大变更总览](#v20-重大变更总览)
- [v2.1 技术决策](#v21-技术决策)
- [v2.0 技术决策](#v20-技术决策)
- [v2.1 新增功能详解](#v21-新增功能详解)
- [v2.0 新增功能详解](#v20-新增功能详解)
- [BUG 修复记录（B001–B010）](#bug-修复记录b001b010)
- [UI / 输出优化](#ui--输出优化)
- [文档体系更新](#文档体系更新)
- [构建产物分析](#构建产物分析)
- [部署方案选型](#部署方案选型)
- [更新日志（v1.0 → v2.1）](#更新日志v10--v21)
- [后续路线图](#后续路线图)

---

## 项目概览

| 项目 | 值 |
| --- | --- |
| **项目名称** | **FilePress Blog** (`filepress-blog`) |
| **当前版本** | **v2.2.0** |
| **类型** | 纯静态技术博客 |
| **核心理念** | 文件即数据，零数据库，零 CMS |
| **技术栈** | VitePress 1.4.5 + Vue 3.5.13 + TypeScript 5.6.3 Strict + Tailwind CSS 3.4.17 |
| **部署目标** | GitHub Pages (`dcyyd.github.io`) |
| **包管理** | pnpm ≥ 9 |
| **运行时要求** | Node.js ≥ 20 · npm ≥ 10 |
| **作者** | 窦长友 &lt;dcyyd_kcug@yeah.net&gt; |

---

## v2.2 变更总览

| 类别 | 数量 | 主要内容 |
| --- | --- | --- |
| 🆕 新增子项目 | 1 | `gui/` — 纯 Web SPA 管理后台（Vue 3 + Pinia + Tailwind CSS） |
| 🆕 新增 npm 脚本 | 3 | `pnpm gui:dev` / `pnpm gui:build` / `pnpm gui:start` |
| 🆕 新增文档 | 1 | `gui/README.md`（GUI 完整文档：功能 / 架构 / API / CLI 映射） |
| 🆕 新增依赖 | 1 | `mermaid` ^11.15.0（Markdown 图表 SSG 预渲染） |
| 🆕 新增组件 | 1 | `MermaidChart.vue`（Mermaid 代码块 → SVG 渲染器） |
| 🆕 新增工具 | 1 | `viewCount.ts`（浏览量统计：localStorage + sessionStorage） |
| 🆕 新增脚本 | 1 | `migrate-summary-to-description.mjs`（frontmatter summary → description 迁移） |
| 🎨 GUI 优化 | — | 仪表盘精简、编辑器简化、文件管理一行布局、停止状态修正 |
| 📝 文档更新 | — | README 全面更新至项目实际状态（GUI 章节 + 目录结构修正 + 版本 2.2.0） |

### GUI 管理后台详情

| 模块 | 能力 |
|------|------|
| 📊 工作台 | 统计卡片 / 分类进度条 / 活动时间线 / 快捷入口 |
| ✏️ 编辑器 | 分栏编辑预览 / 实时统计 / 目录大纲 / Mermaid 渲染 / 快捷插入 / 自动草稿 |
| 📁 文件管理 | 多维筛选（分类/标签/状态一行布局）/ 多列排序 / 批量多选 |
| 🚀 部署面板 | SSE 实时日志 / 心跳动画 / 四态机（running/success/error/stopped） |
| 👀 本地预览 | 启动/停止/状态查询 / 端口冲突提示 |

- **技术栈**：Vite 5 + Vue 3 + Pinia + Tailwind CSS + Vue Router（hash 模式，5 路由）
- **后端**：纯 Node.js http server（`server/index.mjs`，~504 行），零外部依赖
- **API 模式**：开发时通过 Vite 中间件挂载同端口（3000），生产时独立 5174

---

## v2.1 变更总览

| 类别 | 数量 | 主要内容 |
| --- | --- | --- |
| 🆕 新增组件 | 2 | `CommentSection.vue`（Giscus 评论）、`NotFoundPage.vue`（自定义 404） |
| 🆕 新增脚本 | 1 | `generate-sitemap.mjs` + `pnpm sitemap` 脚本 |
| 🆕 新增文档 | 1 | `docs/COMMENTS.md`（Giscus 5 步接入） |
| 🆕 新增配置 | 1 | `.env.example`（环境变量模板） |
| 🐛 BUG 修复 | 4 | B007（CI repo=undefined）/ B008（本地 .env 加载）/ B009（404 失效）/ B010（sitemap 域名） |
| 🎨 重构 | 1 | `CommentSection.vue` 极简化：272 行 → 112 行（-59%） |
| 🔧 构建流水线 | 1 | `pnpm dev` / `pnpm build` 串联 sitemap 步骤 |

---

## v2.0 重大变更总览

| 类别 | 数量 | 主要内容 |
| --- | --- | --- |
| 🆕 新增命令 | 2 | `deploy`（一键部署）、`clean`（独立清理） |
| 🆕 新增短选项 | 3 | `-m`（message）、`-p`（port）、`-h`（host） |
| 🐛 BUG 修复 | 6 | 推送 / 解析 / 编码 / 预检 / 兼容性 |
| 🎨 UI / 输出优化 | 5+ | 步骤化输出、diff 预览、错误降级、构建透传、SSH 提示 |
| 📝 文档重写 | 5 | README / DEPLOYMENT / FAQ / 全流程 / CLI readme |
| 🔧 工程化改进 | — | 跨平台执行、HOME 注入、git.exe 适配 |

---

## v2.1 技术决策

### 为什么选 Giscus？

| 备选方案 | 评估 | 选择 |
| --- | --- | --- |
| **Giscus** | 基于 GitHub Discussions，零后端、零成本、嵌套回复、Markdown 高亮、社区成熟 | ✅ |
| **Twikoo** | 功能丰富但需自部署后端（Vercel/Netlify） | ❌ 引入运维负担 |
| **Waline** | 同样需自部署后端 | ❌ 同上 |
| **Utterances** | 基于 GitHub Issues，**不支持嵌套回复** | ❌ 体验欠佳 |
| **Disqus** | 商业服务，有广告与隐私问题 | ❌ 违背"零依赖"理念 |

### 为什么静态构建 + 运行时挂载 script，而不是 SSR Giscus？

| 方案 | 评估 | 选择 |
| --- | --- | --- |
| **静态 script 标签** | Giscus 官方推荐方式，加载时机由 Giscus 自己控制 | ✅ |
| **Vite SSR 内嵌** | 增加构建复杂度，且 Giscus 需要浏览器环境 | ❌ |
| **iframe 直接嵌入** | 无法利用 Giscus 的自动主题切换 | ❌ |

### 为什么用 `setAttribute` 而不是 `URLSearchParams` 拼接 URL？

| 方案 | 评估 | 选择 |
| --- | --- | --- |
| **`setAttribute`** | Giscus 内部通过 DOM 属性读取，参数清晰、不会因 URL 编码丢失 | ✅ |
| **URL 拼接** | 早期实现，会因特殊字符（如 `+`、`/`）被编码导致 `repo=undefined` | ❌ |

### 为什么 `CommentSection.vue` 移除状态机与轮询？

| 设计原则 | 解读 |
| --- | --- |
| **信任三方库** | Giscus 自己处理加载、错误、主题切换、iframe 通信 |
| **不要 over-engineer** | 4 态状态机 + 60 次轮询是早期调试残留，无业务价值 |
| **`replaceChildren()`** | 路由切换时一行 DOM API 解决清理问题 |
| **`v-if` 优于降级 UI** | 配置缺失时静默不渲染，比显示"评论未启用"更优雅 |

---

## v2.0 技术决策

### 为什么选 VitePress 而非其他 SSG？

| 维度 | 优势 |
| --- | --- |
| **构建速度** | Vite 驱动，HMR 与冷启动领先同类 |
| **Markdown 路由** | 原生支持 Data Loader，文件驱动模式天然适配 |
| **Vue 3 生态** | 组件复用成本低，与 `@vueuse/core` 配合紧密 |
| **TypeScript 支持** | 完善的类型导出，便于 strict 模式开发 |

### 为什么纯文件驱动？

- **零运行时依赖**：构建产物为纯静态 HTML / CSS / JS。
- **零运维成本**：无需数据库、无需后端服务、无需 Headless CMS。
- **内容即代码**：Markdown 文件直接进 Git，版本管理与协作即开即用。
- **可移植性强**：构建产物可托管在任意 CDN / Pages / OSS / Nginx。

### 安全管线设计

```
Markdown → remark → rehype → rehype-sanitize → Vue VNode
   (源码)    (AST)    (HTML树)     (过滤危险节点)       (安全渲染)
```

- ESLint 强制禁止 `v-html`（规则 `vue/no-v-html: error`）。
- TypeScript `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` 防类型漏洞。
- `gray-matter` 解析 frontmatter，注入顺序由 `scripts/post-cli/frontmatter.mjs` 统一约束。

### 部署方案：双轨制

| 方案 | 触发 | 产物 | 优势 |
| --- | --- | --- | --- |
| **GitHub Actions** | 推 `main` 分支自动触发 | 推 Pages artifact | 零手动、自动可审计 |
| **`pnpm post d`** | 本地一键命令 | force-push `gh-pages` | 可控、可调试、紧急修复 |

> v2.0 起两套方案并存。用户按场景选择：**日常发布用 Actions，本地调试用 `pnpm post d`**。

---

## v2.1 新增功能详解

### 1. Giscus 评论系统

#### 架构

```
[PostPage.vue]
    └── <CommentSection /> ← 检查 VITE_GISCUS_* 注入
            └── mount(): 动态创建 <script> 元素
                    └── Giscus client.js 自动渲染 iframe
                            └── 通过 Discussions API 拉取评论
```

#### 关键设计

- **环境变量注入链路**：`config.mts` 手动解析 `.env` → `process.env` → `vite.define` 替换为客户端字符串
- **CI 注入链路**：`deploy.yml` Build env → `process.env` → 同样 `vite.define` 替换
- **DOM 属性而非 URL**：`setAttribute('data-*', value)` 直接挂到 script 元素，避免 URL 编码
- **SPA 路由感知**：`watch(route.path)` 触发 `replaceChildren()` 重建 script
- **主题跟随**：`data-theme="preferred_color_scheme"` 委托 Giscus 处理，VitePress 切换 `html.dark` 时 iframe 内部跟随

#### 简化前后对比

| 维度 | v2.0 实现 | v2.1 实现 | 变化 |
| --- | --- | --- | --- |
| 代码行数 | 272 | 112 | **-59%** |
| 响应式变量 | 4 | 2 | -50% |
| 状态机 | 4 态 | 0 态 | -100% |
| 轮询 | 60×250ms | 0 | -100% |
| props | 2 | 0 | -100% |
| 模板分支 | 3 | 1 | -66% |

### 2. 自定义 404 错误页

- `404.md`：仅保留 `title`、`aside: false`、`sidebar: false`、`outline: false`、不设置 `layout`，让 VitePress 走内置 `not-found` 布局
- `NotFoundPage.vue`：渲染品牌化的未找到页面，含"返回首页"与"查看博客"双入口
- 修复 B009：早期 `404.md` 设置 `layout: page` 覆盖了 `not-found`，导致默认页未替换

### 3. sitemap.xml 自动生成器

- `scripts/generate-sitemap.mjs`：扫描 `content/posts/*.md` + 静态路由，输出 `public/sitemap.xml`
- 站点 URL 通过 `SITE_URL` 环境变量覆盖，默认 `https://dcyyd.github.io`
- 已串联进 `pnpm dev` 与 `pnpm build`，构建前自动生成
- 修复 B010：硬编码 `https://example.com` 改为可配置

### 4. Giscus 文档体系

- `docs/COMMENTS.md`：5 步接入指南 + 6 类常见问题排查 + 关键实现代码片段
- `.env.example`：标准化环境变量模板，避免开发者忘记字段

---

## v2.0 新增功能详解

### F001 · `pnpm post d` 一键部署 🆕

**源码**：`scripts/post-cli/deploy.mjs`

**内部步骤**：

| 阶段 | 行为 |
| --- | --- |
| ① 预检 | 检查 git 可用性、SSH 认证、源码工作区状态 |
| ② 构建 | `npx vitepress build .`，实时透传进度 |
| ③ 推送 | 在 `.vitepress/dist` 内初始化临时仓库 → commit → `force-push` 到 `gh-pages` |
| ④ 清理 | 移除 `.vitepress/dist/.git` 临时仓库 |

**选项矩阵**：

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `--repo <url>` | `git@github.com:dcyyd/dcyyd.github.io.git` | 目标仓库 |
| `--branch <name>` | `gh-pages` | 目标分支 |
| `-m, --message <text>` | `deploy: update site` | commit 信息 |
| `--skip-build` | `false` | 复用现有 dist |
| `--skip-push` | `false` | 只构建不推送 |
| `--no-cleanup` | `false` | 保留 dist/.git（调试） |
| `-y, --yes` | `false` | 跳过确认 |

**环境变量**：`DEPLOY_REPO` / `DEPLOY_BRANCH` 覆盖默认值。

### F002 · `pnpm post c` 独立清理 🆕

**源码**：`scripts/post-cli/clean.mjs`

```bash
pnpm post c
# 已清理: .vitepress/cache
# 已清理: .vitepress/dist
# 清理完成。
```

> 之前为 `hexo clean` 风格的隐式行为；v2.0 起升级为显式子命令，行为可预测。

### F003 · 更多短选项 🆕

| 短 | 长 | 适用命令 | 备注 |
| --- | --- | --- | --- |
| `-m` | `--message` | `deploy` | 🆕 v2.0 |
| `-p` | `--port` | `serve` | 🆕 v2.0 |
| `-h` | `--host` | `serve` | 🆕 v2.0 |

### F004 · 跨平台执行 🆕

- **移除 PowerShell 依赖**：所有 git / ssh 调用统一走 `node:child_process` + `node:fs/promises`。
- **Windows `.exe` 自动追加**：在 `run()` 包装器内对 `git` / `ssh` 等命令自动加 `.exe` 后缀。
- **环境变量注入**：`getDeployEnv()` 注入 `HOME` 与 `GIT_SSH_COMMAND`，确保 Windows 节点进程能找到 SSH 密钥。

---

## BUG 修复记录

| ID | 现象 | 根因 | 修复 | 文件 |
| --- | --- | --- | --- | --- |
| **B001** | `pnpm post d` 推送时 `error: pathspec 'update' did not match` | `execFile` 使用 `shell: true` + 含空格的 message 被 shell 拆分 | 改为 `shell: false`，args 作为数组原样传递 | `scripts/post-cli/deploy.mjs` |
| **B002** | `-m "fix: ..."` 解析后 `消息: true` | `-m` 未注册为短选项，fallback 成 boolean flag | `SHORT_FLAGS` 注册 `m: 'message'`；并加 `typeof === 'string'` 防御 | `scripts/post-cli.mjs` |
| **B003** | `pnpm post d` 推送时 `Could not create directory '/home/root/.ssh'` | Windows 节点进程未设置 `HOME`，Git for Windows ssh 找不到 `~/.ssh` | `getDeployEnv()` 注入 `HOME`（C:/ 格式）+ `GIT_SSH_COMMAND` | `scripts/post-cli/deploy.mjs` |
| **B004** | 中文分类 / 标签页 404：`https://.../categories/ai-%E4%B8%8E%E5%A4%A7%E6%A8%A1%E5%9E%8B` | `tagToSlug()` 二次 `encodeURIComponent` 导致 URL 出现双重编码 | 改用中文原字符作为 slug，移除 `encodeURIComponent` | `.vitepress/theme/utils/slug.ts` |
| **B005** | SSH 预检误报失败 | 启用 `BatchMode=yes` + 仅看退出码，但 `ssh -T` 认证成功时也以非零退出 | 改为解析 `successfully authenticated` 文本；改为软警告而非硬失败 | `scripts/post-cli/deploy.mjs` |
| **B006** | `pnpm post d` 预检阶段大量 `DEP0190` 警告 | `execFile(..., { shell: true })` 行为被 Node 标记为不安全 | 改为 `shell: false` + `.exe` 后缀自动追加 | `scripts/post-cli/deploy.mjs` |
| **B007** | 部署后 Giscus 报 `repo=undefined` | `.env` 在 `.gitignore` 中，CI 环境拿不到 `VITE_GISCUS_*` | `.github/workflows/deploy.yml` 的 Build env 注入全部 Giscus 变量，敏感 ID 走 GitHub Secrets | `.github/workflows/deploy.yml` |
| **B008** | 本地 `pnpm dev` 时 Giscus 配置丢失 | VitePress 不会自动加载 `.env` | `config.mts` 增加轻量级 .env 解析器，注入 `process.env` 后再走 `vite.define` | `.vitepress/config.mts` |
| **B009** | 404 页面未生效，仍显示 VitePress 默认页 | `404.md` 设置了 `layout: page` 覆盖了内置 `not-found` 布局 | 移除 `layout: page` / `sidebar` / `aside` / `outline` 等冲突配置 | `404.md` |
| **B010** | sitemap URL 默认值 `https://example.com` 与生产不符 | `generate-sitemap.mjs` 硬编码了示例域名 | 默认 URL 改为 `https://dcyyd.github.io`，并支持 `SITE_URL` 环境变量覆盖 | `scripts/generate-sitemap.mjs` |

---

## UI / 输出优化

### ✅ 步骤化输出

部署拆为 **① 预检 / ② 构建 / ③ 推送 / ④ 清理** 四个阶段，每段加粗带颜色、缩进对齐：

```
🚀 一键部署到 GitHub Pages

① 预检
✔ git 可用
✔ GitHub SSH 已认证
✔ 源码工作区干净

② 构建静态站点
执行: npx vitepress build .
[ vitepress build 进度实时透传 ]
✔ 构建完成

③ 推送到 gh-pages 分支
✔ 推送成功

部署完成 ✨
网站将在 1-2 分钟内更新：https://dcyyd.github.io
```

### ✅ diff 预览

`pnpm post u` 在写入前打印 frontmatter diff：

```
ℹ 当前元数据:
ℹ   title: CLI 工具演示
ℹ   tags: CLI, 演示, 工程化

ℹ 将要应用:
ℹ   title: CLI 工具演示（已更新）
ℹ   tags: CLI, 工程化, 自动化
```

### ✅ 错误降级

失败时给出 `hint` 提示下一步操作：

```
✖ 部署失败
  提示: 检查 ~/.ssh/id_rsa 是否已添加到 GitHub Settings → SSH keys
  退出码: 1
```

### ✅ 构建进度透传

`npx vitepress build` 的 stdout **实时**透传，不缓冲；用户能看到完整构建进度。

### ✅ 推送成功回显

部署成功末尾输出：

```
网站将在 1-2 分钟内更新：https://dcyyd.github.io
```

### ✅ SSH 软预检

SSH 认证失败时**给出警告**而非硬中断，可由 `DEPLOY_REPO` 切换为 HTTPS 协议。

---

## 文档体系更新

| 文件 | 状态 | 主要内容 |
| --- | --- | --- |
| `README.md` | 🆕 重写 | v2.0 变更、BUG 修复、UI 优化、安全模型、文档索引 |
| `docs/DEPLOYMENT.md` | 🆕 重写 | 5 套部署方案 + `pnpm post d` 完整章节 + 故障排查 |
| `docs/DIRECTORY_STRUCTURE.md` | 🆕 重写 | 完整结构 + 设计原则 + 数据流向 + v2.0 变更节点 |
| `docs/FAQ.md` | 🆕 重写 | 开发 / 构建 / 部署 / 文章 / CLI / BUG 修复 / 自定义 / 安全 |
| `docs/发布全流程指南.md` | 🆕 重写 | 端到端工作流 + 4 类场景 + 命令速查 |
| `logs/PROJECT_ITERATION_SUMMARY.md` | 🆕 重写 | v2.0 全量变更与决策记录（即本文） |
| `scripts/readme.md` | 🆕 重写 | § 5.5 新增 `deploy` 命令完整文档 |

---

## 构建产物分析

| 模块 | 大小 | 说明 |
| --- | --- | --- |
| `katex`（math chunk） | ~900KB | 数学公式渲染，独立 chunk |
| `lucide`（icons chunk） | ~200KB | 图标库，独立 chunk |
| 核心包 | ~150KB | Vue + VitePress 运行时 |
| 首屏 HTML | ~2KB | 预渲染 + CSR hydration |
| 全部 `assets/*.css` | ~30KB | Tailwind 已 purge |

### 优化措施

- 手动 chunk 拆分（`katex` / `lucide-vue-next`）控制首屏加载。
- `vite` 内置 ESBuild 压缩、Tree Shaking。
- `sharp` 生成 WebP + LQIP 模糊占位。
- `gray-matter` 仅在构建期生效，**不进入客户端 bundle**。

---

## 部署方案选型

### 现状

| 方案 | 触发 | 产物分支 |
| --- | --- | --- |
| GitHub Actions | push `main` | 直接由 Pages artifact 渲染 |
| `pnpm post d` | 手动执行 | force-push `gh-pages` |

### Git 配置修复

**问题**：系统级 `url.https://github.com/.insteadof=git@github.com:` 强制将 SSH 转为 HTTPS，导致推送认证失败。

**修复**：
1. 移除该系统级配置项。
2. 设置 `GIT_SSH_COMMAND` 环境变量指向正确的 SSH 密钥和 known_hosts 路径。
3. `deploy.mjs` 自动注入 `HOME` + `GIT_SSH_COMMAND`，避免全局污染。

---

## 更新日志（v1.0 → v2.2）

| 版本 | 主要变更 |
| --- | --- |
| **v2.2.0** | 🆕 GUI 管理后台（Web SPA，5 大核心模块）· 🆕 MermaidChart.vue · 🆕 viewCount.ts · 🆕 migrate-summary · 🎨 GUI 优化（仪表盘精简/编辑器简化/一行布局/停止态修正）· 📝 README 全面更新 |
| **v2.1.0** | 🆕 Giscus 评论系统 · 🆕 自定义 404 错误页 · 🆕 sitemap.xml 自动生成器 · 🐛 B007-B010 修复 · 🎨 CommentSection 极简化（-59%）· 📝 README + COMMENTS 文档 |
| v2.0.0 | 🆕 `pnpm post d` 一键部署 · 🆕 `pnpm post c` 独立清理 · 🆕 `-m` / `-p` / `-h` 短选项 · 🐛 B001-B006 修复 · 📝 文档体系重写 · 🎨 UI / 输出优化 · 跨平台执行 |
| v1.5.0 | 完善部署文档，修复 Git SSH 认证问题，建立 gh-pages 分支 |
| v1.4.0 | 完成 GitHub Actions 自动部署工作流 |
| v1.3.0 | 添加 ChangelogPage、FriendsPage |
| v1.2.0 | 添加 post-cli 文章管理工具 |
| v1.1.0 | 添加 RSS、图片优化管线 |
| v1.0.0 | 初始版本：首页 + 博客 + 分类 + 标签 + 归档 |

---

## 后续路线图

### v2.2 候选

- [ ] `pnpm post s` 支持浏览器热重载开关
- [ ] `pnpm post d` 集成 git tag 自动打版本号
- [ ] `OptimizedImage` 支持 AVIF 格式
- [ ] `PostPage` 支持目录大纲折叠 / 展开
- [ ] 国际化（i18n）支持

### v2.3+ 候选

- [ ] 站点搜索（`pagefind` 或 FlexSearch）
- [ ] `pnpm post stats` 文章统计仪表板
- [ ] `pnpm post backup` 一键备份 `content/posts/`
- [ ] VS Code 扩展：snippet + frontmatter 模板
- [ ] 评论通知集成（GitHub Discussions Webhook → 邮件 / 钉钉）

---

**FilePress Blog** · v2.2.0 · 作者 [窦长友](mailto:dcyyd_kcug@yeah.net)
