# FilePress Blog

> 零数据库 · 零 CMS · 纯 Markdown 文件驱动 · VitePress 1.4 + Vue 3 + TypeScript Strict + Tailwind CSS v3

[![VitePress](https://img.shields.io/badge/VitePress-1.4.5-2563eb?logo=vitepress&logoColor=white)](https://vitepress.dev/)
[![Vue](https://img.shields.io/badge/Vue-3.5.13-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3_strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-3.4.17-38bdf8&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/version-2.2.0-22c55e)](#changelog)
[![License](https://img.shields.io/badge/license-MIT-22c55e)](#license)

**FilePress Blog (`filepress-blog`)** 是一款以"**文件即数据**"为核心理念的现代化静态技术博客引擎。所有内容以 Markdown 文件存放于 `content/posts/`，VitePress 在**构建期**扫描并生成静态 HTML，运行时无任何 IO 与数据库依赖，最终产物是一组可托管在任意 CDN / Nginx / Pages 上的纯静态文件。

- **作者**：窦长友
- **邮箱**：dcyyd_kcug@yeah.net
- **当前版本**：2.2.0
- **部署站点**：[https://dcyyd.github.io](https://dcyyd.github.io)

---

## 目录

- [核心特性](#核心特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [npm 脚本一览](#npm-脚本一览)
- [项目结构](#项目结构)
- [内容约定](#内容约定)
- [post-cli · 文章管理工具](#post-cli--文章管理工具)
- [GUI 管理后台](#gui-管理后台)
- [评论系统](#评论系统)
- [sitemap](#sitemap)
- [构建与部署](#构建与部署)
- [v2.1 新增与变更](#v21-新增与变更)
- [安全模型](#安全模型)
- [文档与日志](#文档与日志)
- [License](#license)

---

## 核心特性

- 📝 **纯文件驱动** — Markdown 是唯一数据源，无需数据库、Headless CMS、GraphQL。
- ⚡ **极致构建性能** — Vite 5 + 手动 chunk 拆分（katex / lucide-vue-next），首屏 LCP 可控。
- 🛡️ **默认安全** — 关闭 `v-html`，统一走 `unified → remark → rehype → rehype-sanitize` 安全 AST 管线。
- 🎨 **现代视觉** — Tailwind v3 + `class` 暗色模式 + Inter / JetBrains Mono 字体族。
- 🧩 **完整站点能力** — 首页 / 博客列表 / 分类 / 标签 / 归档 / 友链 / 关于 / 更新日志 / RSS 全部内置。
- 💬 **Giscus 评论** — 基于 GitHub Discussions，零后端、零数据库，5 步接入。
- 🗺️ **sitemap 自动生成** — 扫描全部文章与页面，构建期输出 `sitemap.xml`。
- 🚫 **自定义 404** — 友好的未找到页面，含返回与推荐入口。
- 🛠️ **零依赖 CLI** — `pnpm post new|update|publish|deploy|list|read|serve|clean` 一条命令管全部内容。
- 🚀 **一键部署** — `pnpm post d` 自动完成预检 → 构建 → 推送 `gh-pages` → 清理，跨平台。
- 🖥️ **GUI 管理后台** — 纯 Web SPA（Vue 3 + Pinia + Tailwind），工作台 / Markdown 编辑器 / 文件管理 / 一键部署 / 本地预览，对小白友好。
- 🖼️ **图片优化管线** — `pnpm images` 一键生成 WebP + LQIP 模糊占位。
- 📦 **强类型** — `tsc strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes`。

---

## 技术栈

| 类别 | 选型 | 版本 | 用途 |
| --- | --- | --- | --- |
| 静态站点引擎 | VitePress | 1.4.5 | SSG + 客户端路由 |
| 构建工具 | Vite | 5.4.11 | 极速冷启动 / HMR |
| UI 框架 | Vue | 3.5.13 | 自定义主题组件 |
| 类型系统 | TypeScript | 5.6.3 | 全面 strict 模式 |
| 样式方案 | Tailwind CSS | 3.4.17 | 原子化 + 排版插件 |
| 图标库 | lucide-vue-next | 0.468.0 | 矢量图标 |
| 数学公式 | KaTeX | 0.16.11 | 行内 / 块级公式 |
| 图表渲染 | Mermaid | 11.15.0 | Markdown 代码块图表（SSG 预渲染） |
| 工具集 | @vueuse/core | 11.3.0 | 组合式 API 工具 |
| Markdown | unified / remark / rehype | 11.x | 安全 Markdown 解析 |
| Frontmatter | gray-matter | 4.0.3 | YAML 头解析与序列化 |
| 图片处理 | sharp | 0.33.5 | WebP / LQIP 生成 |
| 代码检查 | ESLint + Prettier | 8.57 / 3.4 | 统一风格 |

---

## 快速开始

```bash
# 1. 克隆 / 进入工程
git clone https://github.com/dcyyd/dcyyd.github.io.git
cd dcyyd.github.io

# 2. 安装依赖（推荐 pnpm ≥ 9）
pnpm install

# 3. 启动开发服务器（默认 http://localhost:5173）
pnpm dev

# 4. 写一篇文章后保存，Vite HMR 自动捕获
pnpm post n my-first-post -T "我的第一篇博客" -t "随笔,入门"

# 5. 一键部署到 GitHub Pages
pnpm post d -y
```

> **环境要求**：Node.js ≥ 20，npm ≥ 10，pnpm ≥ 9。
> **包管理器**：工程根包含 `pnpm-workspace.yaml`，允许 esbuild / sharp / vue-demi 的 build script。

---

## npm 脚本一览

| 脚本 | 命令 | 说明 |
| --- | --- | --- |
| `pnpm dev` | `pnpm rss && pnpm sitemap && vitepress dev . --host 0.0.0.0` | 启动开发服务器，先生成 RSS 与 sitemap（v2.1 新增 sitemap） |
| `pnpm build` | `pnpm typecheck && pnpm rss && pnpm sitemap && vitepress build .` | 类型检查 → RSS → sitemap → 生产构建（v2.1 新增 sitemap） |
| `pnpm preview` | `vitepress preview . --host 0.0.0.0` | 本地预览构建产物 |
| `pnpm typecheck` | `vue-tsc --noEmit` | 严格类型检查 |
| `pnpm lint` | `eslint . --ext .ts,.mts,.vue` | 代码规范检查 |
| `pnpm format` | `prettier --write .` | 全量格式化 |
| `pnpm rss` | `node scripts/generate-rss.mjs` | 重新生成 `public/feed.xml` |
| **`pnpm sitemap`** | `node scripts/generate-sitemap.mjs` | **🆕 v2.1 生成 `sitemap.xml`（扫描 content/posts）** |
| `pnpm images` | `node scripts/optimize-images.mjs` | 扫描 `assets/images/raw/` 输出 WebP + LQIP |
| `pnpm post` | `node scripts/post-cli.mjs` | 文章管理 CLI（交互或子命令） |
| `pnpm pn` | `node scripts/post-cli.mjs new` | `post new` 快捷别名 |
| `pnpm pu` | `node scripts/post-cli.mjs update` | `post update` 快捷别名 |
| `pnpm pp` | `node scripts/post-cli.mjs publish` | `post publish` 快捷别名 |
| `pnpm pd` | `node scripts/post-cli.mjs deploy` | `post deploy` 一键部署快捷别名 |
| `pnpm pl` | `node scripts/post-cli.mjs list` | `post list` 快捷别名 |
| `pnpm pr` | `node scripts/post-cli.mjs read` | `post read` 快捷别名 |
| `pnpm ps` | `node scripts/post-cli.mjs serve` | `post serve` 快捷别名 |
| `pnpm pc` | `node scripts/post-cli.mjs clean` | `post clean` 快捷别名 |
| **`pnpm gui:dev`** | `cd gui && pnpm dev` | **🖥️ 启动 GUI 开发服务器（端口 3000）** |
| **`pnpm gui:build`** | `cd gui && pnpm build` | **构建 GUI 到 gui/dist/** |
| **`pnpm gui:start`** | `cd gui && pnpm start` | **生产模式启动 GUI API（端口 5174）** |

---

## 项目结构

> 以下结构按"职责"组织。`node_modules/`、`.vitepress/cache/`、`.vitepress/dist/` 已省略。

```text
filepress-blog/
│
├── package.json                     # 依赖清单、npm 脚本、author/license 元信息
├── pnpm-lock.yaml                   # 锁定依赖版本（随 pnpm install 自动生成）
├── pnpm-workspace.yaml              # pnpm 工作区配置（允许 esbuild/sharp/vue-demi 编译）
├── tsconfig.json                    # TypeScript strict 模式 + 路径别名 (@theme/@components/@utils/@types)
├── tailwind.config.js               # Tailwind v3 主题、brand 调色板、Inter/JetBrains Mono 字体族
├── postcss.config.js                # PostCSS 插件链 (tailwindcss + autoprefixer)
├── .eslintrc.cjs                    # ESLint 规则：禁止 any、禁止 v-html、vue3-recommended
├── .prettierrc                      # Prettier：无分号、单引号、宽度 100、尾随逗号 none
├── .gitignore                       # 忽略 node_modules / .vitepress/{dist,cache} / .env 等
├── env.d.ts                         # Vue SFC 与 VitePress 全局类型声明
│
├── README.md                        # 本文件
│
│ ── 顶层页面路由（VitePress 入口，仅委托 Vue 组件渲染） ──
├── index.md                         # 首页 /        → <HomePage />
├── blog.md                          # 博客 /blog     → <BlogPage />
├── categories.md                    # 分类 /categories → <CategoriesPage />
├── archives.md                      # 归档 /archives → <ArchivePage />
├── changelog.md                     # 更新日志 /changelog → <ChangelogPage />
├── friends.md                       # 友链 /friends   → <FriendsPage />
├── about.md                         # 关于 /about     → <AboutPage />
│
│ ── 动态路由（构建期由 .paths.ts 预生成所有参数） ──
├── posts/
│   ├── [slug].md                    # 文章详情模板 /posts/<slug>
│   └── [slug].paths.ts              # 扫描 content/posts，生成静态路径
├── categories/
│   ├── [category].md                # 分类聚合模板 /categories/<category>
│   └── [category].paths.ts          # 扫描所有 category，生成静态路径
├── tags/
│   ├── [tag].md                     # 标签聚合模板 /tags/<tag>
│   └── [tag].paths.ts               # 扫描所有 tag，生成静态路径
│
│ ── 内容源（Markdown 文件，唯一数据源） ──
├── content/
│   └── posts/                       # 所有博客文章 *.md
│
│ ── VitePress 配置与自定义主题 ──
├── .vitepress/
│   ├── config.mts                   # 站点 / Vite / Markdown / head / nav / 手动 chunk 配置
│   └── theme/
│       ├── index.ts                 # 主题入口：布局继承 + 全局组件注册
│       ├── types/blog.ts            # PostFrontmatter / PostMeta / PostDetail / SafeNode 类型
│       ├── data/                    # 构建期数据 loader (VitePress Data Loader)
│       │   ├── posts.data.ts
│       │   ├── categories.data.ts
│       │   ├── tags.data.ts
│       │   └── archives.data.ts
│       ├── utils/                   # 纯函数工具集
│       │   ├── posts.ts             # 扫描 content/posts，缓存，获取 PostDetail[]
│       │   ├── postMeta.ts          # 客户端安全的 PostMeta 提取
│       │   ├── markdown.ts          # unified/remark/rehype 安全 Markdown 管线
│       │   ├── excerpt.ts           # 标题/摘要提取（含无 frontmatter 降级）
│       │   ├── date.ts              # 日期格式化与 ISO 转换
│       │   ├── readingTime.ts       # 阅读时长计算（200 字/分钟）
│       │   ├── slug.ts              # 文件名 → slug、tag → slug（v2.0 修复中文 URL 二次编码）
│       │   └── viewCount.ts         # 浏览量统计（localStorage + sessionStorage）
│       ├── styles/
│       │   ├── index.css            # Tailwind base/components/utilities + Markdown 排版
│       │   └── fonts.css            # @font-face 接入点
│       └── components/              # 全部 UI 组件（<script setup lang="ts">）
│           ├── AppLayout.vue        # 全局布局：顶栏 + 主区 + 页脚 + 滚动进度
│           ├── HeaderNav.vue        # 顶栏导航 + 移动端汉堡菜单
│           ├── SiteFooter.vue       # 全局页脚
│           ├── ThemeToggle.vue      # 明暗主题切换（写入 localStorage）
│           ├── HomePage.vue
│           ├── BlogPage.vue
│           ├── ArticleCard.vue
│           ├── PostPage.vue
│           ├── MarkdownRenderer.vue # Safe AST → Vue VNode 的安全渲染器
│           ├── CodeBlock.vue
│           ├── CopyButton.vue       # 基于 Clipboard API 的复制按钮
│           ├── MermaidChart.vue      # Mermaid 图表组件（SSG 预渲染为 SVG）
│           ├── OptimizedImage.vue   # WebP + 模糊占位图组件
│           ├── CommentSection.vue   # 🆕 v2.1 Giscus 评论组件
│           ├── NotFoundPage.vue     # 🆕 v2.1 自定义 404 错误页
│           ├── TagFilter.vue
│           ├── TagPage.vue
│           ├── CategoryPage.vue
│           ├── CategoriesPage.vue
│           ├── ArchivePage.vue
│           ├── ChangelogPage.vue
│           ├── FriendsPage.vue
│           └── AboutPage.vue
│
│ ── 静态资源（原样拷贝到 dist/） ──
├── public/
│   ├── favicon.svg
│   ├── feed.xml                     # RSS 2.0 订阅源（由 pnpm rss 生成）
│   ├── sitemap.xml                  # 🆕 v2.1 SEO 站点地图（由 pnpm sitemap 生成）
│   ├── fonts/README.md              # 字体放置说明
│   └── images/avatar.svg
│
├── assets/images/raw/.gitkeep       # 原始图片输入目录（pnpm images 扫描源）
│
│ ── 工具脚本 ──
├── scripts/
│   ├── generate-rss.mjs             # RSS 2.0 订阅源生成器
│   ├── generate-sitemap.mjs         # 🆕 v2.1 sitemap.xml 生成器
│   ├── migrate-summary-to-description.mjs  # frontmatter summary → description 迁移工具
│   ├── optimize-images.mjs          # sharp 图片优化：输出 WebP + LQIP base64
│   ├── post-cli.mjs                 # 文章管理 CLI 入口（参数解析，含 clean 内联命令）
│   ├── post-cli/
│   │   ├── new.mjs                  # 创建新文章
│   │   ├── update.mjs               # 更新 frontmatter
│   │   ├── publish.mjs              # 发布草稿
│   │   ├── deploy.mjs               # 一键部署（预检/构建/推送/清理）
│   │   ├── list.mjs                 # 列出全部文章
│   │   ├── read.mjs                 # 查看 frontmatter / 正文摘要
│   │   ├── serve.mjs                # 启动 dev server
│   │   ├── help.mjs                 # 渲染帮助
│   │   ├── ui.mjs                   # 颜色 / 提示符 / 错误码
│   │   ├── frontmatter.mjs          # frontmatter 顺序定义与读写
│   │   ├── template.mjs             # 正文模板（开篇骨架）
│   │   ├── slug.mjs                 # slug 生成与 tag 归一
│   │   └── validate.mjs             # slug / 日期校验
│   └── readme.md                    # post-cli 详细文档
│
│ ── GUI 管理后台（Web SPA 子包） ──
├── gui/
│   ├── package.json                 # 独立子包（Vue 3 + Vite 5 + Pinia + Tailwind）
│   ├── README.md                    # GUI 详细文档
│   ├── vite.config.ts               # dev 端口 3000（strictPort），/api 通过 Vite 中间件挂载
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   ├── server/
│   │   ├── index.mjs                # 纯 Node http server（路由表 + SSE + 进程管理）
│   │   └── port-check.mjs           # 端口冲突检测
│   └── src/
│       ├── main.ts                  # 入口：Pinia + Vue Router
│       ├── App.vue                  # 根布局
│       ├── router/index.ts          # 5 个路由（hash 模式）
│       ├── api/index.ts             # fetch + EventSource 封装
│       ├── stores/index.ts          # Pinia：posts / logs / toast / deploy
│       ├── utils/
│       │   ├── markdown.ts          # 自研零依赖 Markdown 渲染器（161 行）
│       │   ├── editorStats.ts       # 字数 / 阅读时长 / 标题大纲
│       │   └── wordAndView.ts       # 字数与浏览量聚合
│       ├── components/              # 3 个组件（侧边栏 / 顶栏 / Toast）
│       └── views/                   # 5 个视图（工作台 / 编辑器 / 文件管理 / 部署 / 帮助）
│
│ ── 文档与迭代日志 ──
├── docs/
│   ├── DIRECTORY_STRUCTURE.md       # 标准化目录结构
│   ├── DEPLOYMENT.md                # 部署指南（Nginx / 静态托管 / 一键脚本）
│   ├── COMMENTS.md                  # 🆕 v2.1 Giscus 评论系统配置指南
│   ├── FAQ.md                       # 常见问题排查
│   └── 发布全流程指南.md            # 端到端发布工作流
│
└── logs/
    └── PROJECT_ITERATION_SUMMARY.md # 全量变更与决策记录（v2.0 → v2.1）
```

---

## 内容约定

### frontmatter 字段顺序

`pnpm post new` 写入与 `.vitepress/theme/utils/posts.ts` 解析均遵循同一字段顺序：

```yaml
---
title: 文章标题              # 必填
description: 文章摘要         # 可空，降级时取正文前 200 字
date: 2026-06-22             # YYYY-MM-DD，默认 today
updated: 2026-06-22          # YYYY-MM-DD，可空
author: 窦长友                # 可空
category: 前端工程           # 可空，降级时取 "未分类"
tags:                       # 可空，自动去重
  - VitePress
  - 性能优化
cover: /images/xxx.webp      # 可空
draft: false                 # 可空，默认 false
---
```

### 无 frontmatter 降级

若 Markdown 缺少 YAML 头，系统自动按以下规则降级（见 `utils/excerpt.ts`）：

| 字段 | 降级策略 |
| --- | --- |
| `title` | 取正文中第一个 `#` 一级标题 |
| `date` | 取文件最后修改时间 (`mtimeMs`) |
| `description` | 取正文前 200 字符 |
| `category` | `"未分类"` |
| `tags` | `[]` |

### slug 规则

- 文件名即 slug，仅允许小写字母 / 数字 / 连字符（`scripts/post-cli/slug.mjs` 同步此规则）。
- **v2.0 修复**：标签页 slug 由 `tagToSlug(name)` 生成，**中文标签直接作为 slug 片段使用**，不再二次 `encodeURIComponent`，避免 URL 出现 `ai-%E4%B8%8E...` 导致 404。

### 阅读时长

- 200 字/分钟（CJK 按字符数，英文按词数加权）。
- 计算逻辑在 `utils/readingTime.ts`。

---

## post-cli · 文章管理工具

> 详细文档见 [scripts/readme.md](scripts/readme.md)。

```bash
# 创建
pnpm post n vue3-reactivity-guide \
  -T "Vue 3 响应式原理" \
  -d "从 Proxy 拦截到 effect 调度" \
  -t "Vue3,响应式,源码分析" \
  -c "前端框架"

# 更新（追加标签）
pnpm post u vue3-reactivity-guide --append-tags "性能优化" -y

# 发布草稿
pnpm post p draft-post -y

# 列表 / 查看
pnpm post l
pnpm post r vue3-reactivity-guide

# 启动 dev server
pnpm post s --open

# 一键部署到 GitHub Pages
pnpm post d -y

# 清理构建缓存
pnpm post c

# 帮助
pnpm post help
pnpm post help deploy
```

特性：

- **零外部依赖**，仅复用项目已装的 `gray-matter`。
- 写入即被 Vite HMR 捕获，**无需重启 dev server**。
- **跨平台**：参数解析、git 操作、SSH 配置全部走 `node:child_process` + `node:fs/promises`，不再依赖 PowerShell。
- 校验失败、文件已存在、权限错误给出明确错误码（参见 [scripts/readme.md § 10](scripts/readme.md)）。

---

## GUI 管理后台

> 详细文档见 [gui/README.md](gui/README.md)。

**FilePress Blog GUI** 是一个纯 Web SPA 管理后台（Vue 3 + Pinia + Tailwind CSS），将日常写作、文件管理、一键部署、本地预览操作搬到浏览器里。

### 启动

```bash
# 开发模式（一条命令：Vite 3000 + 内嵌 API，无需另开端口）
pnpm gui:dev
# → http://localhost:3000

# 生产构建
pnpm gui:build
```

### 五大核心模块

| 模块 | 能力 |
|------|------|
| 📊 **工作台** | 站点统计卡片（文章数 / 总字数 / 本月新增 / 累计访问量）、分类分布进度条、最近活动时间线、快捷入口 |
| ✏️ **Markdown 编辑器** | 左右分栏编辑/预览、实时统计（字数/行数/阅读时长）、目录大纲、Mermaid 图表渲染、代码/标题/列表/引用/链接/图片快捷插入、自动保存草稿（30s）、Ctrl+S 快捷保存 |
| 📁 **文件管理** | 列表 + 字数/浏览量列、搜索（slug/标题/标签）、多维筛选（分类/标签/状态一行布局）、多列排序、批量多选（发布/标草稿/删除） |
| 🚀 **一键部署** | 调用 `post d` 推送 `gh-pages`、SSE 实时日志、心跳动画、停止按钮（区分 stopped 与 error 状态）、日志搜索+级别过滤+自动滚屏 |
| 👀 **本地预览** | 启动/停止 VitePress dev、实时日志、端口冲突提示、状态查询、与部署互不干扰 |

### 架构

- **前端**：Vue 3 + Vite 5 + Pinia + Tailwind CSS + Vue Router（hash 模式，5 个路由）
- **后端**：纯 Node.js http server（`server/index.mjs`，~504 行），零外部依赖
- **API**：开发模式下通过 Vite 中间件 `filePressApiPlugin` 挂载在同端口（3000），无需再开 5174
- **通信**：`fetch` 处理 CRUD，`EventSource`（SSE）处理部署/预览实时日志流
- **状态机**：部署/预览 四态（`running` / `success` / `error` / `stopped`），主动停止不会污染失败语义

GUI 不替代 CLI — 它是 CLI 的可视化封装。所有写入落到 `content/posts/`，与 `pnpm post n/u` 完全等价，可随时 `git diff` 校验。

---

## 评论系统

v2.1 集成 [Giscus](https://giscus.app/zh-CN) 作为评论系统，基于 **GitHub Discussions**，零后端、零数据库、零成本，与项目"纯文件驱动"理念完全契合。

### 5 步接入

1. **开启 Discussions**：仓库 Settings → General → 勾选 Discussions
2. **安装 Giscus App**：[github.com/apps/giscus](https://github.com/apps/giscus)
3. **创建分类**：在仓库 Discussions 页新建一个分类（推荐 `General`）
4. **获取 ID**：访问 [giscus.app/zh-CN](https://giscus.app/zh-CN)，得到 `data-repo-id`（`R_xxx`）与 `data-category-id`（`DIC_xxx`）
5. **写入环境变量**：复制 `.env.example` 为 `.env` 并填入：

```bash
VITE_GISCUS_REPO=dcyyd/dcyyd.github.io
VITE_GISCUS_REPO_ID=R_xxxxxxxx
VITE_GISCUS_CATEGORY=General
VITE_GISCUS_CATEGORY_ID=DIC_xxxxxxxx
VITE_GISCUS_LANG=zh-CN
```

> **必须以 `VITE_` 前缀**，否则 VitePress 不会注入到客户端 bundle。

### CI 部署

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 已内置 Giscus 环境变量注入。敏感 ID 通过 GitHub Secrets 读取，**配置到仓库 Settings → Secrets and variables → Actions**：

- `GISCUS_REPO_ID`
- `GISCUS_CATEGORY_ID`

### 组件特性

[`theme/components/CommentSection.vue`](.vitepress/theme/components/CommentSection.vue)：

- **懒加载**：`data-loading="lazy"`，仅在视口可见时加载 Giscus
- **主题跟随**：通过 `data-theme="preferred_color_scheme"` 自动跟随系统（VitePress 切换 dark 类时 iframe 内部也跟随）
- **SPA 路由感知**：`watch(route.path)` 让每篇文章对应一个独立 Discussion
- **极简实现**：v2.1 重写后从 272 行精简到 112 行（-59%），移除响应式状态机与轮询逻辑，信任 Giscus 原生能力

详细配置与常见问题排查见 [docs/COMMENTS.md](docs/COMMENTS.md)。

---

## sitemap

v2.1 新增 [`scripts/generate-sitemap.mjs`](scripts/generate-sitemap.mjs)，构建期扫描 `content/posts/` 与全部静态路由，输出 [public/sitemap.xml](public/sitemap.xml)。

```bash
# 单独运行
pnpm sitemap

# 已自动串联进 dev / build 流水线
pnpm dev
pnpm build
```

特性：

- 站点 URL 通过 `SITE_URL` 环境变量覆盖，默认 `https://dcyyd.github.io`
- 自动包含首页 / 博客 / 分类 / 归档 / 关于 / 更新日志 / 友链 + 全部 `/posts/<slug>`
- 输出符合 [sitemaps.org](https://www.sitemaps.org/) 协议

---

## 构建与部署

### 本地构建

```bash
pnpm typecheck    # 类型检查
pnpm build        # 等价于：typecheck → rss → sitemap → vitepress build
pnpm preview      # 本地预览 dist/
```

构建产物输出到 [`.vitepress/dist/`](.vitepress/dist)，可直接托管在 **Nginx / Netlify / Vercel / Cloudflare Pages / GitHub Pages / OSS / CDN**。

### 一键部署（推荐）

```bash
pnpm post d -y
```

内部自动完成：

1. **预检** — git 可用性、SSH 认证、源码工作区状态
2. **构建** — `npx vitepress build .` 实时透传进度
3. **推送** — 在 `.vitepress/dist` 内初始化临时仓库 → commit → `force-push` 到 `gh-pages`
4. **清理** — 移除 `.vitepress/dist/.git` 临时仓库

可选参数：`--skip-build` / `--skip-push` / `--no-cleanup` / `--branch` / `--repo` / `-m` / `-y` / `DEPLOY_REPO` / `DEPLOY_BRANCH` 环境变量。

### GitHub Actions 自动部署

项目已内置 GitHub Actions 工作流，推送代码后自动构建并部署：

1. 将项目推送到 GitHub 仓库
2. 进入仓库 **Settings → Pages**，将 Source 改为 **GitHub Actions**
3. 修改 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 中的 `BASE` 与 `SITE_URL`
4. （可选）配置 Giscus Secrets：`GISCUS_REPO_ID` / `GISCUS_CATEGORY_ID`

### Nginx 示例

```nginx
server {
  listen 80;
  server_name example.com;
  root /var/www/filepress-blog/.vitepress/dist;
  index index.html;

  location / {
    try_files $uri $uri/ $uri.html =404;
  }

  location ~* \.(css|js|woff2|webp|svg)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }
}
```

更多平台部署细节见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)；端到端工作流见 [docs/发布全流程指南.md](docs/发布全流程指南.md)。

### RSS 订阅

构建前自动执行 `pnpm rss`，生成 [public/feed.xml](public/feed.xml)。可通过 `SITE_URL` 环境变量覆盖站点地址：

```bash
SITE_URL=https://blog.example.com pnpm build
```

---

## v2.1 新增与变更

> 完整变更记录见 [logs/PROJECT_ITERATION_SUMMARY.md](logs/PROJECT_ITERATION_SUMMARY.md)。

### 新增功能

| 模块 | 变更 |
| --- | --- |
| **Giscus 评论系统** | 新增 `CommentSection.vue` 组件，集成 GitHub Discussions 评论；5 步接入，零后端 |
| **自定义 404** | 新增 `NotFoundPage.vue` + `404.md`，友好错误页（返回 / 推荐入口） |
| **sitemap 自动生成** | 新增 `scripts/generate-sitemap.mjs` + `pnpm sitemap` 脚本，扫描 `content/posts` 与全部静态路由 |
| **Giscus 文档** | 新增 [docs/COMMENTS.md](docs/COMMENTS.md) 完整配置指南 |
| **.env.example** | 新增环境变量模板，标准化 Giscus 配置入口 |
| **构建流水线** | `pnpm dev` / `pnpm build` 串联 `sitemap` 步骤 |

### BUG 修复

| ID | 现象 | 根因 | 修复 |
| --- | --- | --- | --- |
| **B007** | 部署后 Giscus 显示 `An error occurred: giscus is not installed on this repository` | CI 环境未注入 `VITE_GISCUS_*` 环境变量 | `.github/workflows/deploy.yml` 的 Build env 注入全部 Giscus 变量，敏感 ID 走 GitHub Secrets |
| **B008** | 本地 `pnpm dev` 时 Giscus 配置丢失 | VitePress 不会自动加载 `.env` | `config.mts` 增加轻量级 .env 解析器，注入 `process.env` 后再走 `vite.define` |
| **B009** | 404 页面未生效，仍显示 VitePress 默认页 | `404.md` 设置了 `layout: page` 覆盖了内置 `not-found` 布局 | 移除 `layout: page` / `sidebar` / `aside` / `outline` 等冲突配置 |
| **B010** | sitemap URL 默认值 `https://example.com` 与生产不符 | `generate-sitemap.mjs` 硬编码了示例域名 | 默认 URL 改为 `https://dcyyd.github.io`，并支持 `SITE_URL` 环境变量覆盖 |

### 重构 / 优化

- 🎨 **CommentSection.vue 极简化** — 移除响应式状态机（idle/loading/ready/error）、轮询逻辑、手动主题切换；改用 `setAttribute` 直接构建 script 元素，信任 Giscus 原生能力；代码从 272 行精简到 112 行（-59%）
- 📝 移除 `enabled` / `loadingText` props 与未启用降级 UI，改用 `v-if="ready"` 直接控制是否渲染
- 📦 移除 `useData().isDark` 依赖，Giscus 通过 `data-theme="preferred_color_scheme"` 自动跟随系统主题

### 文档体系

- ✅ 新增 [docs/COMMENTS.md](docs/COMMENTS.md)：Giscus 5 步接入 + 常见问题
- ✅ [README.md](README.md) 重写为 v2.1 视角，补充评论系统、sitemap 章节
- ✅ [logs/PROJECT_ITERATION_SUMMARY.md](logs/PROJECT_ITERATION_SUMMARY.md) 新增 v2.1 变更记录

---

## v2.0 历史变更（摘要）

> 完整记录见 [logs/PROJECT_ITERATION_SUMMARY.md](logs/PROJECT_ITERATION_SUMMARY.md) 的 v2.0 章节。

### 新增功能

| 模块 | 变更 |
| --- | --- |
| **post-cli 部署子系统** | 新增 `scripts/post-cli/deploy.mjs`（预检/构建/推送/清理）与 `pnpm post d` / `pnpm pd` 入口 |
| **`clean` 独立命令** | 从隐式行为升级为显式子命令 `pnpm post c` |
| **更多短选项** | `SHORT_FLAGS` 新增 `m`（message）、`p`（port）、`h`（host） |
| **跨平台执行** | 所有 git/ssh 调用统一走 `node:child_process`，不再依赖 PowerShell `$env:HOME` 等命令 |
| **HOME + GIT_SSH_COMMAND 自动注入** | Windows 上自动设置 `HOME=C:/Users/...` 与 `GIT_SSH_COMMAND`，确保 ssh 找到 `~/.ssh/id_rsa` |

### BUG 修复（B001–B006）

| ID | 现象 | 根因 | 修复 |
| --- | --- | --- | --- |
| **B001** | `pnpm post d` 推送时 `error: pathspec 'update' did not match` | `execFile` 使用 `shell: true` + 含空格 message 被 shell 拆分 | 改为 `shell: false`，args 作为数组原样传递 |
| **B002** | `-m "fix: ..."` 解析后 `消息: true` | `m` 未注册为短选项，fallback 成 boolean flag | `SHORT_FLAGS` 注册 `m: 'message'`；并加 `typeof === 'string'` 防御 |
| **B003** | `pnpm post d` 推送时 `Could not create directory '/home/root/.ssh'` | Windows 节点进程未设置 `HOME`，Git for Windows ssh 找不到 `~/.ssh` | `getDeployEnv()` 注入 `HOME`（C:/ 格式）+ `GIT_SSH_COMMAND` |
| **B004** | 中文分类 / 标签页 404：`https://.../categories/ai-%E4%B8%8E%E5%A4%A7%E6%A8%A1%E5%9E%8B` | `tagToSlug()` 二次 `encodeURIComponent` 导致 URL 出现双重编码 | 改用中文原字符作为 slug，移除 `encodeURIComponent` |
| **B005** | SSH 预检误报失败 | 启用 `BatchMode=yes` + 仅看退出码，但 `ssh -T` 认证成功时也以非零退出 | 改为解析 `successfully authenticated` 文本；改为软警告而非硬失败 |
| **B006** | `pnpm post d` 预检阶段大量 `DEP0190` 警告 | `execFile(..., { shell: true })` 行为被 Node 标记为不安全 | 改为 `shell: false` + `.exe` 后缀自动追加 |

### UI / 输出优化

- ✅ **步骤化输出** — 部署拆为 ① 预检 / ② 构建 / ③ 推送 / ④ 清理，阶段标题加粗带颜色
- ✅ **diff 预览** — 部署前打印 `仓库/分支/消息/跳过项` 配置摘要
- ✅ **错误降级** — 失败时给出 `hint` 提示下一步操作（如 SSH 失败 → "检查 ~/.ssh/id_rsa 是否已添加"）
- ✅ **构建进度透传** — `npx vitepress build` 的 stdout 实时透传，不缓冲
- ✅ **推送成功回显** — 输出 `网站将在 1-2 分钟内更新：https://dcyyd.github.io`

---

## 安全模型

| 风险面 | 缓解措施 |
| --- | --- |
| Markdown 注入 | `rehype-sanitize` 在 Markdown 解析链路中过滤危险节点 |
| 原生 HTML | VitePress 默认不解析 Markdown 内的原始 HTML |
| XSS 渲染 | 所有 Vue 组件**禁止 `v-html`**（ESLint 规则 `vue/no-v-html: error`） |
| 类型安全 | `tsc strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` |
| 代码风格 | `any` 类型 ESLint 报错 |
| 复制按钮 | 仅使用 `navigator.clipboard.writeText`，废弃 `execCommand` |
| 部署凭据 | SSH 私钥走 `~/.ssh/id_rsa` + `GIT_SSH_COMMAND` 注入，**不落盘不打印** |

> ⚠️ 受交付环境限制，工程不内置字体二进制文件；生产部署时将合法授权的字体放入 `public/fonts/` 并在 `.vitepress/theme/styles/fonts.css` 启用 `@font-face`。

---

## 文档与日志

| 入口 | 内容 |
| --- | --- |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | 部署指南：GitHub Actions / gh-pages / Nginx / Netlify / 一键脚本 |
| [docs/COMMENTS.md](docs/COMMENTS.md) | 🆕 v2.1 Giscus 评论系统 5 步接入 + 常见问题 |
| [docs/DIRECTORY_STRUCTURE.md](docs/DIRECTORY_STRUCTURE.md) | 标准化目录结构与组件依赖关系 |
| [docs/FAQ.md](docs/FAQ.md) | 开发、构建、部署常见问题排查 |
| [docs/发布全流程指南.md](docs/发布全流程指南.md) | 端到端发布工作流教程 |
| [gui/README.md](gui/README.md) | 🖥️ GUI 管理后台完整文档（功能 / 架构 / API / CLI 映射） |
| [logs/PROJECT_ITERATION_SUMMARY.md](logs/PROJECT_ITERATION_SUMMARY.md) | 项目迭代总结（v1.0 → v2.1 全量变更） |
| [scripts/readme.md](scripts/readme.md) | post-cli 文章管理工具详细文档 |

---

## License

MIT — 详见 [LICENSE](LICENSE)。

```
FilePress Blog  ©  窦长友  <dcyyd_kcug@yeah.net>
```
