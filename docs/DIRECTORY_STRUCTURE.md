# 目录结构

> **FilePress Blog** (`filepress-blog` v2.0.0) · 作者：窦长友 &lt;dcyyd_kcug@yeah.net&gt;
>
> 按"职责分层"组织。`node_modules/`、`.vitepress/cache/`、`.vitepress/dist/` 已省略。所有路径相对工程根。

---

## 目录

- [顶层布局](#顶层布局)
- [完整结构](#完整结构)
- [核心设计原则](#核心设计原则)
- [组件依赖关系](#组件依赖关系)
- [数据流向](#数据流向)
- [v2.0 新增 / 变更节点](#v20-新增--变更节点)

---

## 顶层布局

```
filepress-blog/
├── 工程元信息            # package.json / tsconfig / tailwind / eslint / prettier
├── 自动化                # .github/workflows/deploy.yml
├── 文档与日志            # docs/  +  logs/
├── 顶层路由              # index.md / blog.md / ...（VitePress 入口）
├── 动态路由              # posts/  +  categories/  +  tags/
├── 内容源                # content/posts/
├── VitePress 配置与主题  # .vitepress/
├── 静态资源              # public/  +  assets/
└── 工具脚本              # scripts/
```

---

## 完整结构

```text
filepress-blog/
│
│ ── 工程元信息 ──
├── package.json                 # name=filepress-blog, version=2.0.0, author, license
├── pnpm-lock.yaml               # 锁定依赖版本
├── pnpm-workspace.yaml          # 允许 esbuild/sharp/vue-demi 的 build scripts
├── tsconfig.json                # TypeScript strict + 路径别名 (@theme / @components / @utils / @types)
├── tailwind.config.js           # Tailwind v3 主题、brand 调色板、Inter/JetBrains Mono
├── postcss.config.js            # tailwindcss + autoprefixer
├── .eslintrc.cjs                # 禁止 any、禁止 v-html、vue3-recommended
├── .prettierrc                  # 无分号、单引号、宽度 100、尾随逗号 none
├── .gitignore                   # 忽略 node_modules / .vitepress/{dist,cache} / .env
├── env.d.ts                     # Vue SFC + VitePress 全局类型
│
│ ── 自动化 ──
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions 自动部署工作流
│
│ ── 文档与日志 ──
├── docs/                        # 项目技术文档
│   ├── DEPLOYMENT.md            # 部署指南（含 v2.0 一键部署脚本）
│   ├── DIRECTORY_STRUCTURE.md   # 本文件
│   ├── FAQ.md                   # 常见问题排查
│   └── 发布全流程指南.md         # 端到端发布工作流
├── logs/                        # 迭代日志
│   └── PROJECT_ITERATION_SUMMARY.md
│
│ ── 顶层路由（VitePress 入口，委托 Vue 组件渲染） ──
├── index.md                     # 首页 /              → <HomePage />
├── blog.md                      # 博客列表 /blog      → <BlogPage />
├── categories.md                # 分类总览 /categories → <CategoriesPage />
├── archives.md                  # 归档总览 /archives   → <ArchivePage />
├── changelog.md                 # 更新日志 /changelog  → <ChangelogPage />
├── friends.md                   # 友链 /friends        → <FriendsPage />
├── about.md                     # 关于 /about          → <AboutPage />
│
│ ── 动态路由（构建期由 .paths.ts 预生成） ──
├── posts/
│   ├── [slug].md                # 文章详情模板 /posts/<slug>
│   └── [slug].paths.ts          # 扫描 content/posts/ 生成静态路径
├── categories/
│   ├── [category].md            # 分类聚合模板 /categories/<category>
│   └── [category].paths.ts      # 扫描所有 category 生成静态路径（v2.0 中文 slug 修复）
├── tags/
│   ├── [tag].md                 # 标签聚合模板 /tags/<tag>
│   └── [tag].paths.ts           # 扫描所有 tag 生成静态路径（v2.0 中文 slug 修复）
│
│ ── 内容源（Markdown 文件，唯一数据源） ──
├── content/
│   └── posts/                   # 所有博客文章 *.md
│
│ ── VitePress 配置与自定义主题 ──
├── .vitepress/
│   ├── config.mts               # 站点 / Vite / Markdown / head / nav / 手动 chunk
│   └── theme/
│       ├── index.ts             # 主题入口：布局注册 + 全局组件
│       ├── types/
│       │   └── blog.ts          # PostFrontmatter / PostMeta / PostDetail / SafeNode
│       ├── data/                # 构建期 Data Loader
│       │   ├── posts.data.ts    # 全量文章元数据
│       │   ├── categories.data.ts
│       │   ├── tags.data.ts
│       │   └── archives.data.ts
│       ├── utils/               # 纯函数工具集
│       │   ├── posts.ts         # 扫描 content/posts/ 获取 PostDetail[]
│       │   ├── postMeta.ts      # 客户端安全的 PostMeta 提取
│       │   ├── markdown.ts      # unified/remark/rehype 安全管线
│       │   ├── excerpt.ts       # 标题/摘要提取（含无 frontmatter 降级）
│       │   ├── date.ts          # 日期格式化与 ISO 转换
│       │   ├── readingTime.ts   # 阅读时长（200 字/分钟）
│       │   └── slug.ts          # 文件名 → slug、tag → slug（v2.0 修复中文 URL 二次编码）
│       ├── styles/
│       │   ├── index.css        # Tailwind + Markdown 排版
│       │   └── fonts.css        # @font-face 接入点
│       └── components/          # Vue 3 组件
│           ├── AppLayout.vue    # 全局布局（顶栏 + 主区 + 页脚 + 滚动进度）
│           ├── HeaderNav.vue    # 顶栏导航 + 移动端汉堡菜单
│           ├── SiteFooter.vue   # 全局页脚
│           ├── ThemeToggle.vue  # 明暗主题切换（写入 localStorage）
│           ├── HomePage.vue
│           ├── BlogPage.vue
│           ├── ArticleCard.vue  # 列表卡片
│           ├── PostPage.vue     # 文章详情
│           ├── MarkdownRenderer.vue  # Safe AST → Vue VNode
│           ├── CodeBlock.vue
│           ├── CopyButton.vue   # 基于 Clipboard API
│           ├── OptimizedImage.vue    # WebP + LQIP 占位
│           ├── TagFilter.vue    # 标签多选筛选
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
│   ├── feed.xml                 # RSS 2.0（由 pnpm rss 生成）
│   ├── fonts/
│   │   └── README.md            # 字体放置说明
│   └── images/
│       └── avatar.svg
│
├── assets/
│   └── images/
│       └── raw/
│           └── .gitkeep         # 原始图片输入（pnpm images 扫描源）
│
│ ── 工具脚本 ──
├── scripts/
│   ├── generate-rss.mjs         # RSS 2.0 订阅源生成器
│   ├── optimize-images.mjs      # sharp 图片优化（WebP + LQIP base64）
│   ├── post-cli.mjs             # post-cli 入口（参数解析、子命令分派）
│   ├── post-cli/
│   │   ├── new.mjs              # 创建新文章
│   │   ├── update.mjs           # 更新 frontmatter
│   │   ├── publish.mjs          # 发布草稿
│   │   ├── deploy.mjs           # 🆕 v2.0 一键部署（预检 / 构建 / 推送 / 清理）
│   │   ├── list.mjs             # 列出全部文章（含字数、阅读时长）
│   │   ├── read.mjs             # 查看 frontmatter / 正文前 10 行
│   │   ├── serve.mjs            # 启动 VitePress dev server
│   │   ├── clean.mjs            # 🆕 v2.0 独立清理命令（之前为隐式行为）
│   │   ├── help.mjs             # 渲染帮助信息
│   │   ├── ui.mjs               # 颜色 / 提示符 / 错误码 / 进度条
│   │   ├── frontmatter.mjs      # frontmatter 顺序定义与读写
│   │   ├── template.mjs         # 正文模板（开篇骨架）
│   │   ├── slug.mjs             # slug 生成与 tag 归一
│   │   └── validate.mjs         # slug / 日期校验
│   └── readme.md                # post-cli 详细文档
│
│ ── 根文档 ──
└── README.md                    # 项目入口文档
```

---

## 核心设计原则

| 层级 | 原则 | 关键文件 |
| --- | --- | --- |
| **路由层** | `.md` 文件仅作路由入口，具体渲染委托给 Vue 组件 | `index.md`、`posts/[slug].md` |
| **数据层** | `.vitepress/theme/data/` 在**构建期**扫描 `content/posts/`，生成静态 JSON | `data/posts.data.ts` |
| **渲染层** | AST 管线：`Markdown → remark → rehype → rehype-sanitize → Vue VNode` | `utils/markdown.ts` |
| **安全层** | 关闭 `v-html`，统一走 sanitize 管线，ESLint 规则兜底 | `.eslintrc.cjs` |
| **构建层** | 手动 chunk 拆分（`katex` / `lucide-vue-next`），控制 bundle 粒度 | `config.mts` |
| **部署层** | 源码 `main` 与产物 `gh-pages` 双分支隔离 | `scripts/post-cli/deploy.mjs` |
| **CLI 层** | 零外部依赖，统一走 `node:child_process` + `node:fs/promises` | `scripts/post-cli/*.mjs` |

---

## 组件依赖关系

```
AppLayout
├── HeaderNav          # 顶栏 + 移动端汉堡菜单
├── <RouterView />     # 各页面组件由路由决定
│   ├── HomePage → ArticleCard
│   ├── BlogPage → TagFilter + ArticleCard
│   ├── PostPage → MarkdownRenderer → CodeBlock + CopyButton + OptimizedImage
│   ├── TagPage → ArticleCard
│   ├── CategoryPage → ArticleCard
│   ├── CategoriesPage
│   ├── ArchivePage
│   ├── ChangelogPage
│   ├── FriendsPage
│   └── AboutPage
├── SiteFooter         # 页脚
└── ThemeToggle        # 明暗切换（全局浮动）
```

---

## 数据流向

### 构建期

```
content/posts/*.md
   ↓ gray-matter 解析
   ↓
utils/posts.ts → PostDetail[]     (扫描 + 缓存)
   ↓
utils/postMeta.ts → PostMeta[]    (客户端安全子集)
   ↓
theme/data/*.data.ts               (VitePress Data Loader 注入页面)
   ↓
各 Vue 组件按需加载
   ↓
Markdown → remark → rehype → rehype-sanitize → VNode
   ↓
.vuepress/dist/ 纯静态文件
```

### 运行期（浏览器）

- 客户端仅消费构建期生成的 JSON 数据。
- `localStorage` 仅用于主题偏好（`light` / `dark` / `auto`）。
- **无任何 fetch / XHR / WebSocket** —— 纯静态 + 客户端水合。

---

## v2.0 新增 / 变更节点

| 路径 | 变更类型 | 说明 |
| --- | --- | --- |
| `scripts/post-cli/deploy.mjs` | 🆕 新增 | 一键部署：预检 / 构建 / 推送 / 清理 |
| `scripts/post-cli/clean.mjs` | 🆕 新增 | 独立清理命令（原为 `hexo clean` 式隐式行为） |
| `package.json` | ✏️ 修改 | name = `filepress-blog` · version = `2.0.0` · author 字段结构化 |
| `scripts/post-cli.mjs` | ✏️ 修改 | 新增 `-m` / `-p` / `-h` 短选项注册与 `m: 'message'` 类型防御 |
| `.vitepress/theme/utils/slug.ts` | ✏️ 修改 | 移除 `tagToSlug()` 二次 `encodeURIComponent`，中文标签直接作为 slug |
| `categories/[category].paths.ts` | ✏️ 修改 | 中文 category 作为路径片段，生成 `/categories/<中文>` |
| `tags/[tag].paths.ts` | ✏️ 修改 | 同上，生成 `/tags/<中文>` |
| `docs/DEPLOYMENT.md` | ✏️ 重写 | 新增 `pnpm post d` 完整章节 |
| `docs/DIRECTORY_STRUCTURE.md` | ✏️ 重写 | 同步 deploy.mjs / clean.mjs 节点 |
| `docs/FAQ.md` | ✏️ 重写 | 新增 BUG 修复与 SSH 排错章节 |
| `docs/发布全流程指南.md` | ✏️ 重写 | 端到端整合 `pnpm post d` 流程 |
| `logs/PROJECT_ITERATION_SUMMARY.md` | ✏️ 重写 | v2.0 全量变更与决策记录 |
| `scripts/readme.md` | ✏️ 重写 | § 5.5 新增 deploy 命令完整文档 |
| `README.md` | ✏️ 重写 | 新增 v2.0 变更、BUG 修复、UI 优化章节 |

---

**FilePress Blog** · v2.0.0 · 作者 [窦长友](mailto:dcyyd_kcug@yeah.net)
