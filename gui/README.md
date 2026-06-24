# FilePress Blog GUI

> 纯 Web SPA 版博客管理工作台 · 对小白友好

FilePress Blog GUI 是 **VitePress 博客**（位于 `content/posts/`）的图形化封装。它把日常写作、文件管理、一键部署、本地预览这些常用操作搬到浏览器里：点点鼠标就能完成，不再需要反复打开终端敲命令。

本工具依赖项目根的 `scripts/post-cli.mjs`，**所有写入与 CLI 完全等价**，可以随时 `git diff` 校验、随时回滚到纯终端模式。

---

## ✨ 核心特性

| 模块 | 能力 |
|------|------|
| 📊 **工作台** | 站点统计卡片（文章数 / 总字数 / 本月新增 / 累计访问量）、分类分布进度条、最近活动时间线、快捷入口（新建 / 部署 / 预览） |
| ✏️ **Markdown 编辑器** | 左右分栏（编辑 / 实时预览）、实时统计（字数 / 字符 / 行数 / 阅读时长）、目录大纲、Mermaid 图表渲染、代码片段 / 标题 / 列表 / 引用 / 链接 / 图片快捷插入、自动保存草稿（30s）、`Ctrl+S` 快捷保存 |
| 📁 **文件管理** | 列表 + 字数 / 浏览量列、搜索（slug / 标题 / 标签）、多维筛选（分类 / 标签 / 状态）、多列排序（修改时间 / 标题 / 大小 / 字数 / 浏览量）、批量多选（发布 / 标草稿 / 删除） |
| 🚀 **一键部署** | 调用 `post d` 推送 `gh-pages`、SSE 实时日志输出、运行中心跳（脉冲动画 + 持续时间）、一键停止（区分 `stopped` 与 `error` 状态）、日志搜索 + 级别过滤 + 自动滚屏 |
| 👀 **本地预览** | 启动 / 停止 VitePress dev（端口 5173）、实时日志、端口冲突自动提示、状态查询、与一键部署互不干扰 |
| ❓ **使用指引** | 4 步上手教程、FAQ、快捷操作入口 |

---

## 🏗️ 架构

```
┌──────────────────────────────────────────────┐
│ 浏览器 SPA (Vite 5, Vue 3, Pinia, Tailwind) │
│   - Vue Router (5 个路由, hash 模式)         │
│   - fetch + EventSource                      │
└──────────┬───────────────────────────────────┘
           │  /api/*
┌──────────▼───────────────────────────────────┐
│ server/index.mjs (Node 原生 http, 504 行)    │
│   - 路由表: /api/posts /api/logs /api/cli    │
│            /api/deploy /api/preview/*        │
│   - 共享: gray-matter 解析 frontmatter       │
│   - 进程管理: deploy / preview 句柄 + 杀进程树│
└──────────┬───────────────────────────────────┘
           │  child_process.spawn
   ┌───────┴────────┬──────────────┐
   ▼                ▼              ▼
content/posts/  scripts/       logs/
 (CRUD)        post-cli.mjs   (历史日志)
```

**两套启动模式：**

- **开发模式（推荐）**：`pnpm gui:dev` 启动 Vite，**dev 端口 3000**（[vite.config.ts](./vite.config.ts) 中 `server.port` 配置，已 `strictPort: true`，冲突即报错），API 通过 `filePressApiPlugin` 挂在 3000 同一端口，**不需要再开 5174**
- **生产模式**：`pnpm gui:start` 独立启动 `server/index.mjs` 在 **5174** 端口，前端走 `pnpm preview`（**4173** 端口，由 `package.json` 的 `preview` 脚本指定）

---

## 🚀 快速开始

```bash
# 在项目根目录

# 1. 安装 GUI 子包依赖
cd gui && pnpm install && cd ..

# 2. 开发模式（一条命令搞定：Vite 3000 + 内嵌 API）
pnpm gui:dev
# 浏览器打开 http://localhost:3000
```

### 启动模式对比

| 命令 | 端口 | 说明 |
|------|------|------|
| `pnpm gui:dev` | 3000 | Vite + API 中间件（推荐，单进程） |
| `pnpm gui:dev:web` | 3000 | 只跑 Vite（前端） |
| `pnpm gui:dev:api` | 5174 | 只跑 Node API |
| `pnpm gui:build` | — | 类型检查 + 生产构建到 `gui/dist/` |
| `pnpm gui:start` | 5174 | 生产模式启动 Node API |
| `pnpm gui:start` + `pnpm preview` | 5174 + 4173 | 完整生产链路（API + 静态前端预览） |

> **端口冲突**：dev 端口 3000 已 `strictPort: true`，被占用即启动失败并报错。修改 [`vite.config.ts`](./vite.config.ts) 中的 `server.port` 可改端口。

---

## 📁 目录结构

```
gui/
├── package.json            # 独立子包，依赖 Vue 3 + Vite 5 + Pinia + Tailwind + Mermaid
├── tsconfig.json
├── vite.config.ts          # dev 端口 3000（strictPort），/api 通过 filePressApiPlugin 挂到 Vite 中间件
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── env.d.ts
├── server/
│   └── index.mjs           # 纯 Node http server，504 行（路由表 + 进程管理 + SSE）
└── src/
    ├── main.ts             # 入口：Pinia + 路由挂载
    ├── App.vue             # 根布局：侧边栏 + 顶栏 + 路由出口 + Toast
    ├── router/index.ts     # 5 个路由（hash 模式）
    ├── api/index.ts        # fetch + EventSource 封装（~130 行）
    ├── stores/index.ts     # Pinia: posts / logs / toast / deploy
    ├── utils/
    │   ├── markdown.ts     # 自研零依赖 Markdown 渲染器（161 行）
    │   ├── editorStats.ts  # 字数 / 阅读时长 / 标题大纲
    │   └── wordAndView.ts  # 字数与浏览量聚合
    ├── components/         # 3 个组件
    │   ├── AppSidebar.vue  # 左侧导航（5 个路由入口）
    │   ├── AppHeader.vue   # 顶栏（标题 + 主题切换 + 路由 crumb）
    │   └── ToastContainer.vue
    └── views/              # 5 个视图
        ├── DashboardView.vue
        ├── EditorView.vue
        ├── FilesView.vue
        ├── DeployView.vue
        └── HelpView.vue
```

---

## 🔌 API 端点

> 全部以 `/api/*` 暴露，由 [`server/index.mjs`](./server/index.mjs) 路由表实现。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查（含版本与运行中进程数） |
| GET | `/api/posts` | 列出全部文章 |
| GET | `/api/posts/:slug` | 读取单篇 |
| POST | `/api/posts` | 新建文章 |
| PUT | `/api/posts/:slug` | 更新文章 |
| DELETE | `/api/posts/:slug` | 删除文章 |
| GET | `/api/logs` | 列出 `logs/` 下的文件 |
| GET | `/api/logs/:name` | 读取日志内容（≤1MB） |
| GET | `/api/cli/:cmd` | SSE 流式执行 `list` / `help`（白名单） |
| GET | `/api/deploy` | SSE 流式一键部署（`pnpm post d -y`） |
| GET | `/api/preview/start` | SSE 启动本地预览（`pnpm post s --open`） |
| GET | `/api/preview/stop` | 停止本地预览 |
| GET | `/api/preview/status` | 查询预览运行状态 |

> CLI 子命令严格白名单，仅 `list` / `help` 可用，**避免任意命令执行**风险。

---

## 🎯 设计原则

- **零后端依赖** — 仅用 Node 内置 `http` / `fs` / `child_process`，可读性 > 框架
- **零依赖 Markdown** — 自研 161 行渲染器，**额外**通过 `mermaid` 渲染图表（不打包至核心 bundle）
- **小白优先** — 每一步都有默认值与提示；删除前 `confirm()` 二次确认；标题自动生成 slug
- **可逆** — 所有写入落到 `content/posts/`，与 `post n/u` 完全等价，可随时 `git diff`
- **状态清晰** — 部署 / 预览区分 `running` / `success` / `error` / `stopped`，主动停止不会污染"失败"语义

---

## 🛡️ 安全

- **路径校验**：所有 slug / 文件名通过 `safeSlug` 过滤路径穿越字符
- **大小限制**：日志读取限制 1MB
- **白名单命令**：`/api/cli/:cmd` 仅放行 `list` / `help`，其它返回 400
- **双重确认**：删除文章、启动部署、停止预览前均 `confirm()`
- **进程隔离**：deploy / preview 独立句柄，停止按钮只关对应进程，不互相影响

---

## 🧱 状态机：部署 / 预览

| 触发 | 状态 | UI 表现 |
|------|------|---------|
| 启动任务 | `running` | 黄色徽章 + 脉冲点 + 持续秒数 |
| 后端 `done` 且 `ok=true` | `success` | 绿色徽章 |
| 后端 `done` 且 `ok=false` | `error` | 红色徽章 + 错误摘要 |
| **用户点停止** | `stopped` | 灰色徽章（与 error 区分） |

> 停止时若后端 `done` 事件晚到（竞态），前端会丢弃覆盖、不把 `stopped` 改回 `error`。

---

## 🔄 与 CLI 的对应关系

| GUI 按钮 | 等价 CLI |
|----------|----------|
| 创建 / 更新文章 | `pnpm post n` / `pnpm post u` |
| 标记草稿 | `pnpm post p <slug>`（取消草稿） |
| 删除文章 | `pnpm post d`（如 CLI 提供；GUI 走 DELETE /api/posts/:slug） |
| 一键部署 | `pnpm post d -y` |
| 启动本地预览 | `pnpm post s --open` |
| 停止本地预览 | 终止后端 spawn 的 vite 进程树 |

GUI 不替代 CLI —— 它是 CLI 的可视化封装，CLI 适合批量与自动化，GUI 适合日常写作与小修改。

---

## 📝 依赖

- `vue` `vue-router` `pinia` — 前端核心
- `mermaid` — Markdown 中的图表渲染（动态 import）
- `gray-matter` — frontmatter 解析（与服务端共用）
- `vite` `vue-tsc` `tailwindcss` `postcss` `autoprefixer` — 构建链

---

**FilePress Blog GUI** · v0.1.0 · 作者 [窦长友](mailto:dcyyd_kcug@yeah.net)
