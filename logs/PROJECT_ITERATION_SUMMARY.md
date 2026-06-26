# 项目迭代总结 · v1.0 → v2.6

> **FilePress Blog** (`filepress-blog` v2.6.0) · 作者：窦长友 &lt;dcyyd_kcug@yeah.net&gt;
>
> 本文是 v1.0 → v2.6 的完整变更记录与技术决策文档，覆盖新功能、BUG 修复、UI / 输出优化、文档体系与未来规划。
>
> **最近更新**：2026-06-26 发布 v2.6.0：🌐 SEO 全方位增强（robots.txt / Schema.org / Meta 优化） · 📊 访问量统计重构（不蒜子 busuanzi 主统计 + localStorage 降级） · 🔤 字体加载优化（@fontsource self-host 消除 FOIT） · 🖼️ OptimizedImage 全站接入（WebP + aspect-ratio 防 CLS） · ✨ 动画与视觉层次增强（stagger / spring / 设计令牌） · 🍞 Breadcrumbs 面包屑导航。

---

## 目录

- [项目概览](#项目概览)
- [v2.6 变更总览](#v26-变更总览)
- [v2.6 SEO 优化详解](#v26-seo-优化详解)
- [v2.6 访问量重构详解](#v26-访问量重构详解)
- [v2.6 UI/UX 优化详解](#v26-uiux-优化详解)
- [v2.5 变更总览](#v25-变更总览)
- [v2.0 重大变更总览](#v20-重大变更总览)
- [v2.1 技术决策](#v21-技术决策)
- [v2.0 技术决策](#v20-技术决策)
- [v2.1 新增功能详解](#v21-新增功能详解)
- [v2.0 新增功能详解](#v20-新增功能详解)
- [BUG 修复记录（B001–B018）](#bug-修复记录b001b018)
- [UI / 输出优化](#ui--输出优化)
- [文档体系更新](#文档体系更新)
- [构建产物分析](#构建产物分析)
- [部署方案选型](#部署方案选型)
- [更新日志（v1.0 → v2.6）](#更新日志v10--v26)
- [后续路线图](#后续路线图)

---

## 项目概览

| 项目                 | 值                                                                           |
| -------------------- | ---------------------------------------------------------------------------- |
| **项目名称**   | **FilePress Blog** (`filepress-blog`)                                |
| **当前版本** | **v2.6.0**                                                             |
| **类型**       | 纯静态技术博客                                                               |
| **核心理念**   | 文件即数据，零数据库，零 CMS                                                 |
| **技术栈**     | VitePress 1.4.5 + Vue 3.5.13 + TypeScript 5.6.3 Strict + Tailwind CSS 3.4.17 |
| **部署目标**   | GitHub Pages (`dcyyd.github.io`)                                           |
| **包管理**     | pnpm ≥ 9                                                                    |
| **运行时要求** | Node.js ≥ 20 · npm ≥ 10                                                   |
| **作者**       | 窦长友&lt;dcyyd_kcug@yeah.net&gt;                                            |

---

## v2.6 变更总览

v2.6 是继 v2.5（搜索 + SEO 基础）之后的**全栈打磨**版本。核心围绕"性能 + 体验 + SEO"三大主题展开，共完成 22+ 项变更。

| 类别 | 数量 | 主要内容 |
| --- | --- | --- |
| **🆕 新增组件** | 1 | `Breadcrumbs.vue` 面包屑导航（内容页自动显示） |
| **🆕 新增文件** | 1 | `public/robots.txt` SEO 详细爬虫指令 |
| **📊 统计重构** | 3 | `SiteFooter.vue` / `PostPage.vue` / `viewCount.ts` 全面切至不蒜子 + localStorage 降级 |
| **🎨 UI 优化** | 4 | `ArticleCard` / `HeaderNav` / `AppLayout` / `index.css` 设计令牌 + 动画 + 面包屑 |
| **🔤 字体** | 1 | `fonts.css` 改用 `@fontsource/inter` + `@fontsource/jetbrains-mono` self-host |
| **🖼️ 图片** | 2 | `types/blog.ts` + `utils/posts.ts` 新增 `coverWidth/Height`；`ArticleCard` 全量切到 `OptimizedImage` |
| **🌐 SEO** | 2 | `config.mts` Schema.org JSON-LD + head 标签补全 |
| **🐛 BUG 修复** | 5 | B014（Hydration Mismatch） / B015（countapi.xyz DNS） / B016（JSON-LD 格式） / B017（pnpm add -w） / B018（@fontsource 5.x 路径） |
| **📝 文档同步** | 7 | README / DEPLOYMENT / DIRECTORY_STRUCTURE / FAQ / COMMENTS / 发布全流程指南 / PROJECT_ITERATION_SUMMARY |

---

## v2.6 SEO 优化详解

### robots.txt 详细爬虫指令

```text
# 允许所有爬虫访问核心目录
User-agent: *
Allow: /posts/
Allow: /categories/
Allow: /tags/
Allow: /archives/

# 禁止抓取构建/依赖/日志目录
Disallow: /node_modules/
Disallow: /.git/
Disallow: /dist/
Disallow: /gui/
Disallow: /scripts/
Disallow: /logs/

# 主站点 + 站点地图
Host: https://dcyyd.github.io
Sitemap: https://dcyyd.github.io/sitemap.xml
```

### Schema.org Blog 结构化数据

`config.mts` 的 `head[]` 注入 JSON-LD（采用 VitePress 标准三元组格式 `['script', { type: 'application/ld+json' }, JSON.stringify(...)]`）：

- `@type`: `Blog`
- `name`: FilePress Blog
- `description`: 包含 VitePress / VuePress / 静态博客 / GitHub Pages / Markdown / 文件驱动等高搜索量关键词
- `author` / `publisher` / `inLanguage`: zh-CN

### Meta 标签补全

- `robots`: `index, follow`
- `canonical`: 规范化 URL 防重复
- `author`: 窦长友
- `keywords`: 10 个核心长尾关键词

---

## v2.6 访问量重构详解

### 主统计：busuanzi（云持久化）

| 指标 | 标签 ID | 说明 |
| --- | --- | --- |
| 站点总 PV | `busuanzi_site_pv` | 所有页面刷新次数累计（云端） |
| 站点总 UV | `busuanzi_site_uv` | 独立访客数（每日去重，云端） |
| 文章页 PV | `busuanzi_page_pv` | 单篇文章访问次数累计（云端） |

### 降级：localStorage

`viewCount.ts` 中保留 localStorage 降级路径：

- `fpb:article-view-counts:v1`：每篇文章的本地浏览量
- `fpb:article-session:v1`：sessionStorage 内同会话去重
- `fpb:site-visits:v1`：站点访问计数器（仅兼容老逻辑，不再用于主展示）

### Hydration Mismatch 修复

`SiteFooter.vue` / `PostPage.vue` 使用 `v-if="mounted"` 控制标签仅在客户端渲染：

```vue
<span v-if="mounted" id="busuanzi_site_pv">0</span>
```

`mounted` 在 `onMounted` 钩子中置为 `true`，确保 SSR 阶段输出为空、客户端注入数字后显示。

### countapi.xyz 彻底下线

v2.4 引入的 `api.countapi.xyz` 全局计数在 v2.6 **彻底移除**（B015：DNS 解析失败）。所有 PV/UV 改用不蒜子云端持久化，不受单点服务可用性影响。

---

## v2.6 UI/UX 优化详解

### 字体加载

| 维度 | v2.5 | v2.6 |
| --- | --- | --- |
| 加载方式 | Google Fonts 外链 | `@fontsource` self-host |
| 关键 CSS | 默认 | `font-display: swap` |
| FOIT | 严重 | **消除** |
| 国内访问 | 慢 / 偶尔超时 | **毫秒级** |

### 统一设计令牌

`styles/index.css` 新增：

- **间距系统**：`--space-xs` (4) → `--space-3xl` (96)
- **阴影层级**：`--shadow-sm` → `--shadow-xl`
- **缓动函数**：`--ease-spring`（cubic-bezier(0.34, 1.56, 0.64, 1)）
- **动画**：`fade-up-stagger`（80ms 错峰渐入）

### 面包屑导航

- **组件**：`Breadcrumbs.vue`
- **挂载**：`AppLayout.vue` 内 `<Breadcrumbs />` 条件渲染
- **可见页面**：文章 / 分类 / 标签 / 归档
- **不可见页面**：首页 / 博客列表 / 友链 / 关于（避免视觉冗余）

### ArticleCard 视觉升级

- 圆角 4px → 8px
- hover 上移 4px → 6px
- hover 缩放 1.0 → 1.04
- 阴影 `--shadow-sm` → `--shadow-md`
- 缓动 `ease` → `--ease-spring`
- 封面图：`OptimizedImage` 组件，16:9 aspect-ratio，WebP + LQIP + 懒加载

---

## v2.5 变更总览

| 类别 | 数量 | 主要内容 |
| --- | --- | --- |
| **新功能** | 2 | 全局全文搜索（Cmd+K 弹窗）/ SEO Open Graph + Twitter Card 全站 meta |
| **组件** | 2 | `SearchModal.vue` 新增 / `HeaderNav.vue` 搜索入口 / `AppLayout.vue` 集成 |
| **配置** | 1 | `config.mts` 静态 + `transformHead` 动态 SEO 标签 |
| **文档** | 3 | README（根）/ ChangelogPage / 迭代总结 同步至 v2.5 |

### 全局全文搜索

- **入口**：桌面导航栏 Search 图标按钮（主题切换左侧）、移动端抽屉搜索行、全局快捷键 `Cmd+K`（macOS）/ `Ctrl+K`（Windows/Linux）
- **组件**：`SearchModal.vue`，搜索标题/描述/正文/标签，加权评分排序（标题 150→描述 40→标签 60→正文 20），最多 15 条，高亮匹配词 + snippet，↑↓/Enter/Esc 键盘导航，150ms 防抖，`<Teleport to="body">` 弹窗 + 毛玻璃背景
- **数据**：直接从 `posts.data` 构建索引（零外部依赖），无须 pagefind 等第三方工具
- **集成**：`HeaderNav.vue` 桌面/移动端双 Search 按钮 → `emit('search')` → `AppLayout.vue` `v-model="showSearch"`

### SEO 增强

- **静态 meta**（`config.mts` `head[]`）：`og:type=website`、`og:site_name=FilePress Blog`、`og:locale=zh_CN`、`twitter:card=summary_large_image`、`twitter:site=@dcyyd`
- **动态 meta**（`config.mts` `transformHead`）：每页独立 `og:title`/`og:description`/`og:url`/`og:image` + Twitter 镜像标签，数据源 `context.title`/`context.description`/`context.page`，无 title 时回退 "FilePress Blog"

---

## v2.0 重大变更总览

| 类别             | 数量 | 主要内容                                            |
| ---------------- | ---- | --------------------------------------------------- |
| 🆕 新增命令      | 2    | `deploy`（一键部署）、`clean`（独立清理）       |
| 🆕 新增短选项    | 3    | `-m`（message）、`-p`（port）、`-h`（host）   |
| 🐛 BUG 修复      | 6    | 推送 / 解析 / 编码 / 预检 / 兼容性                  |
| 🎨 UI / 输出优化 | 5+   | 步骤化输出、diff 预览、错误降级、构建透传、SSH 提示 |
| 📝 文档重写      | 5    | README / DEPLOYMENT / FAQ / 全流程 / CLI readme     |
| 🔧 工程化改进    | —   | 跨平台执行、HOME 注入、git.exe 适配                 |

---

## v2.1 技术决策

### 为什么选 Giscus？

| 备选方案             | 评估                                                                       | 选择                |
| -------------------- | -------------------------------------------------------------------------- | ------------------- |
| **Giscus**     | 基于 GitHub Discussions，零后端、零成本、嵌套回复、Markdown 高亮、社区成熟 | ✅                  |
| **Twikoo**     | 功能丰富但需自部署后端（Vercel/Netlify）                                   | ❌ 引入运维负担     |
| **Waline**     | 同样需自部署后端                                                           | ❌ 同上             |
| **Utterances** | 基于 GitHub Issues，**不支持嵌套回复**                               | ❌ 体验欠佳         |
| **Disqus**     | 商业服务，有广告与隐私问题                                                 | ❌ 违背"零依赖"理念 |

### 为什么静态构建 + 运行时挂载 script，而不是 SSR Giscus？

| 方案                       | 评估                                            | 选择 |
| -------------------------- | ----------------------------------------------- | ---- |
| **静态 script 标签** | Giscus 官方推荐方式，加载时机由 Giscus 自己控制 | ✅   |
| **Vite SSR 内嵌**    | 增加构建复杂度，且 Giscus 需要浏览器环境        | ❌   |
| **iframe 直接嵌入**  | 无法利用 Giscus 的自动主题切换                  | ❌   |

### 为什么用 `setAttribute` 而不是 `URLSearchParams` 拼接 URL？

| 方案                       | 评估                                                                  | 选择 |
| -------------------------- | --------------------------------------------------------------------- | ---- |
| **`setAttribute`** | Giscus 内部通过 DOM 属性读取，参数清晰、不会因 URL 编码丢失           | ✅   |
| **URL 拼接**         | 早期实现，会因特殊字符（如`+`、`/`）被编码导致 `repo=undefined` | ❌   |

### 为什么 `CommentSection.vue` 移除状态机与轮询？

| 设计原则                        | 解读                                             |
| ------------------------------- | ------------------------------------------------ |
| **信任三方库**            | Giscus 自己处理加载、错误、主题切换、iframe 通信 |
| **不要 over-engineer**    | 4 态状态机 + 60 次轮询是早期调试残留，无业务价值 |
| **`replaceChildren()`** | 路由切换时一行 DOM API 解决清理问题              |
| **`v-if` 优于降级 UI**  | 配置缺失时静默不渲染，比显示"评论未启用"更优雅   |

---

## v2.0 技术决策

### 为什么选 VitePress 而非其他 SSG？

| 维度                      | 优势                                        |
| ------------------------- | ------------------------------------------- |
| **构建速度**        | Vite 驱动，HMR 与冷启动领先同类             |
| **Markdown 路由**   | 原生支持 Data Loader，文件驱动模式天然适配  |
| **Vue 3 生态**      | 组件复用成本低，与`@vueuse/core` 配合紧密 |
| **TypeScript 支持** | 完善的类型导出，便于 strict 模式开发        |

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

| 方案                      | 触发                    | 产物                   | 优势                   |
| ------------------------- | ----------------------- | ---------------------- | ---------------------- |
| **GitHub Actions**  | 推`main` 分支自动触发 | 推 Pages artifact      | 零手动、自动可审计     |
| **`pnpm post d`** | 本地一键命令            | force-push`gh-pages` | 可控、可调试、紧急修复 |

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

| 维度       | v2.0 实现 | v2.1 实现 | 变化           |
| ---------- | --------- | --------- | -------------- |
| 代码行数   | 272       | 112       | **-59%** |
| 响应式变量 | 4         | 2         | -50%           |
| 状态机     | 4 态      | 0 态      | -100%          |
| 轮询       | 60×250ms | 0         | -100%          |
| props      | 2         | 0         | -100%          |
| 模板分支   | 3         | 1         | -66%           |

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

| 阶段    | 行为                                                                               |
| ------- | ---------------------------------------------------------------------------------- |
| ① 预检 | 检查 git 可用性、SSH 认证、源码工作区状态                                          |
| ② 构建 | `npx vitepress build .`，实时透传进度                                            |
| ③ 推送 | 在`.vitepress/dist` 内初始化临时仓库 → commit → `force-push` 到 `gh-pages` |
| ④ 清理 | 移除`.vitepress/dist/.git` 临时仓库                                              |

**选项矩阵**：

| 参数                     | 默认                                         | 说明                   |
| ------------------------ | -------------------------------------------- | ---------------------- |
| `--repo <url>`         | `git@github.com:dcyyd/dcyyd.github.io.git` | 目标仓库               |
| `--branch <name>`      | `gh-pages`                                 | 目标分支               |
| `-m, --message <text>` | `deploy: update site`                      | commit 信息            |
| `--skip-build`         | `false`                                    | 复用现有 dist          |
| `--skip-push`          | `false`                                    | 只构建不推送           |
| `--no-cleanup`         | `false`                                    | 保留 dist/.git（调试） |
| `-y, --yes`            | `false`                                    | 跳过确认               |

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

| 短     | 长            | 适用命令   | 备注    |
| ------ | ------------- | ---------- | ------- |
| `-m` | `--message` | `deploy` | 🆕 v2.0 |
| `-p` | `--port`    | `serve`  | 🆕 v2.0 |
| `-h` | `--host`    | `serve`  | 🆕 v2.0 |

### F004 · 跨平台执行 🆕

- **移除 PowerShell 依赖**：所有 git / ssh 调用统一走 `node:child_process` + `node:fs/promises`。
- **Windows `.exe` 自动追加**：在 `run()` 包装器内对 `git` / `ssh` 等命令自动加 `.exe` 后缀。
- **环境变量注入**：`getDeployEnv()` 注入 `HOME` 与 `GIT_SSH_COMMAND`，确保 Windows 节点进程能找到 SSH 密钥。

---

## BUG 修复记录

| ID             | 现象                                                                                      | 根因                                                                     | 修复                                                                                          | 文件                               |
| -------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| **B001** | `pnpm post d` 推送时 `error: pathspec 'update' did not match`                         | `execFile` 使用 `shell: true` + 含空格的 message 被 shell 拆分       | 改为`shell: false`，args 作为数组原样传递                                                   | `scripts/post-cli/deploy.mjs`    |
| **B002** | `-m "fix: ..."` 解析后 `消息: true`                                                   | `-m` 未注册为短选项，fallback 成 boolean flag                          | `SHORT_FLAGS` 注册 `m: 'message'`；并加 `typeof === 'string'` 防御                      | `scripts/post-cli.mjs`           |
| **B003** | `pnpm post d` 推送时 `Could not create directory '/home/root/.ssh'`                   | Windows 节点进程未设置`HOME`，Git for Windows ssh 找不到 `~/.ssh`    | `getDeployEnv()` 注入 `HOME`（C:/ 格式）+ `GIT_SSH_COMMAND`                             | `scripts/post-cli/deploy.mjs`    |
| **B004** | 中文分类 / 标签页 404：`https://.../categories/ai-%E4%B8%8E%E5%A4%A7%E6%A8%A1%E5%9E%8B` | `tagToSlug()` 二次 `encodeURIComponent` 导致 URL 出现双重编码        | 改用中文原字符作为 slug，移除`encodeURIComponent`                                           | `.vitepress/theme/utils/slug.ts` |
| **B005** | SSH 预检误报失败                                                                          | 启用`BatchMode=yes` + 仅看退出码，但 `ssh -T` 认证成功时也以非零退出 | 改为解析`successfully authenticated` 文本；改为软警告而非硬失败                             | `scripts/post-cli/deploy.mjs`    |
| **B006** | `pnpm post d` 预检阶段大量 `DEP0190` 警告                                             | `execFile(..., { shell: true })` 行为被 Node 标记为不安全              | 改为`shell: false` + `.exe` 后缀自动追加                                                  | `scripts/post-cli/deploy.mjs`    |
| **B007** | 部署后 Giscus 报`repo=undefined`                                                        | `.env` 在 `.gitignore` 中，CI 环境拿不到 `VITE_GISCUS_*`           | `.github/workflows/deploy.yml` 的 Build env 注入全部 Giscus 变量，敏感 ID 走 GitHub Secrets | `.github/workflows/deploy.yml`   |
| **B008** | 本地`pnpm dev` 时 Giscus 配置丢失                                                       | VitePress 不会自动加载`.env`                                           | `config.mts` 增加轻量级 .env 解析器，注入 `process.env` 后再走 `vite.define`            | `.vitepress/config.mts`          |
| **B009** | 404 页面未生效，仍显示 VitePress 默认页                                                   | `404.md` 设置了 `layout: page` 覆盖了内置 `not-found` 布局         | 移除`layout: page` / `sidebar` / `aside` / `outline` 等冲突配置                       | `404.md`                         |
| **B010** | sitemap URL 默认值`https://example.com` 与生产不符                                      | `generate-sitemap.mjs` 硬编码了示例域名                                | 默认 URL 改为`https://dcyyd.github.io`，并支持 `SITE_URL` 环境变量覆盖                    | `scripts/generate-sitemap.mjs`   |
| **B011** | 文章页底部 PV 与站点 PV 数值混乱                                                         | 站点 PV 简单累加文章 PV，无法反映"独立访客"语义                       | v2.3 引入 `fpb:site-visits:v1` 独立计数器，session 内只计 1 次                            | `.vitepress/theme/utils/viewCount.ts` |
| **B012** | `SiteFooter` 站点总访问量刷新导致页面抖动                                                 | `setInterval` 触发整个组件 re-render                                   | v2.3 改为局部 `<span>` 数字单独更新                                                        | `.vitepress/theme/components/SiteFooter.vue` |
| **B013** | GUI 仪表盘显示访问量与服务端不一致                                                         | GUI 端 `getTotalViewCount()` 与主站存储键命名空间不一致              | v2.3 统一为 `fpb:*` 命名空间，GUI 复用同一 `wordAndView.ts`                              | `gui/src/utils/wordAndView.ts` |
| **B014** | 控制台 `Hydration completed but contains mismatches`                                  | 不蒜子 `<span>` 在 SSR 阶段无值，客户端注入后 SSR/CSR 不一致        | v2.6 引入 `v-if="mounted"` 仅在客户端渲染标签                                              | `.vitepress/theme/components/SiteFooter.vue` / `PostPage.vue` |
| **B015** | `net::ERR_NAME_NOT_RESOLVED · api.countapi.xyz`                                       | countapi.xyz 域名 DNS 解析失败（已停服 / 被墙）                      | v2.6 移除 countapi.xyz 依赖，迁移至不蒜子（云持久化）+ localStorage 降级                    | `.vitepress/theme/utils/viewCount.ts` |
| **B016** | Schema.org JSON-LD 未出现在 `<head>` 中                                                | `transformHead` 中将 `innerHTML` 作为属性传入导致 JSON 未嵌入        | v2.6 改为 VitePress 标准三元组 `['script', { type: 'application/ld+json' }, JSON.stringify(...)]` | `.vitepress/config.mts` |
| **B017** | `pnpm add @fontsource/*` 提示 `ERR_PNPM_ADDING_TO_ROOT`                                | pnpm 9+ 在工作区根添加依赖需显式 `-w`                                  | v2.6 改用 `pnpm add -w @fontsource/inter @fontsource/jetbrains-mono`                       | `package.json` |
| **B018** | `@import "@fontsource/inter/variable-full.css"` 报"文件不存在"                          | @fontsource 5.x 版本不提供 `variable-full.css` 路径                   | v2.6 改用标准导入 `@import "@fontsource/inter"` + 字重子 CSS（300/500/600/700/800）         | `.vitepress/theme/styles/fonts.css` |

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

### v2.6 同步（2026-06-26）

| 文件                                  | 状态    | 主要内容                                                                                             |
| ------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `README.md`                         | ✏️ 更新 | 全面 v2.6 视角：核心特性 7 大模块、@fontsource 技术栈、SEO / 不蒜子 / 字体 / 图片 / 动画 / 面包屑    |
| `docs/DEPLOYMENT.md`                | ✏️ 更新 | 顶部版本号与"最近更新"同步至 v2.6；页脚 v2.6.0                                                       |
| `docs/DIRECTORY_STRUCTURE.md`       | ✏️ 更新 | 组件依赖图新增 `Breadcrumbs`；变更节点表新增 16 行 v2.6 记录；页脚 v2.6.0                            |
| `docs/FAQ.md`                       | ✏️ 更新 | 新增 4 大 v2.6 章节：访问量统计 / 字体加载 / 图片优化 / UI/UX 视觉层次（共 12 个新 Q&A）；页脚 v2.6.0 |
| `docs/COMMENTS.md`                  | ✏️ 更新 | 顶部版本号 v2.5.0 → v2.6.0                                                                            |
| `docs/发布全流程指南.md`            | ✏️ 更新 | 顶部版本号与"最近更新"同步至 v2.6；页脚 v2.6.0                                                       |
| `logs/PROJECT_ITERATION_SUMMARY.md` | ✏️ 更新 | 标题 v2.5 → v2.6；新增 v2.6 变更总览 / SEO 详解 / 访问量重构详解 / UI/UX 详解 4 章；BUG 表追加 B011-B018；更新日志新增 v2.4 / v2.5 / v2.6 三行；后续路线图重排；页脚 v2.6.0 |
| `.vitepress/theme/components/ChangelogPage.vue` | ✏️ 更新 | 新增 v2.6.0 完整 changelog 条目（7 条 highlights + 27 条 changes）                              |

### 历史重写

| 文件                                  | 状态    | 主要内容                                                   |
| ------------------------------------- | ------- | ---------------------------------------------------------- |
| `README.md`                         | 🆕 重写 | v2.0 变更、BUG 修复、UI 优化、安全模型、文档索引           |
| `docs/DEPLOYMENT.md`                | 🆕 重写 | 5 套部署方案 +`pnpm post d` 完整章节 + 故障排查          |
| `docs/DIRECTORY_STRUCTURE.md`       | 🆕 重写 | 完整结构 + 设计原则 + 数据流向 + v2.0 变更节点             |
| `docs/FAQ.md`                       | 🆕 重写 | 开发 / 构建 / 部署 / 文章 / CLI / BUG 修复 / 自定义 / 安全 |
| `docs/发布全流程指南.md`            | 🆕 重写 | 端到端工作流 + 4 类场景 + 命令速查                         |
| `logs/PROJECT_ITERATION_SUMMARY.md` | 🆕 重写 | v2.0 全量变更与决策记录（即本文）                          |
| `scripts/readme.md`                 | 🆕 重写 | § 5.5 新增`deploy` 命令完整文档                         |

---

## 构建产物分析

| 模块                      | 大小   | 说明                     |
| ------------------------- | ------ | ------------------------ |
| `katex`（math chunk）   | ~900KB | 数学公式渲染，独立 chunk |
| `lucide`（icons chunk） | ~200KB | 图标库，独立 chunk       |
| 核心包                    | ~150KB | Vue + VitePress 运行时   |
| 首屏 HTML                 | ~2KB   | 预渲染 + CSR hydration   |
| 全部`assets/*.css`      | ~30KB  | Tailwind 已 purge        |

### 优化措施

- 手动 chunk 拆分（`katex` / `lucide-vue-next`）控制首屏加载。
- `vite` 内置 ESBuild 压缩、Tree Shaking。
- `sharp` 生成 WebP + LQIP 模糊占位。
- `gray-matter` 仅在构建期生效，**不进入客户端 bundle**。

---

## 部署方案选型

### 现状

| 方案            | 触发         | 产物分支                   |
| --------------- | ------------ | -------------------------- |
| GitHub Actions  | push`main` | 直接由 Pages artifact 渲染 |
| `pnpm post d` | 手动执行     | force-push`gh-pages`     |

### Git 配置修复

**问题**：系统级 `url.https://github.com/.insteadof=git@github.com:` 强制将 SSH 转为 HTTPS，导致推送认证失败。

**修复**：

1. 移除该系统级配置项。
2. 设置 `GIT_SSH_COMMAND` 环境变量指向正确的 SSH 密钥和 known_hosts 路径。
3. `deploy.mjs` 自动注入 `HOME` + `GIT_SSH_COMMAND`，避免全局污染。

---

## 更新日志（v1.0 → v2.6）

| 版本             | 主要变更                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v2.6.0** | 🆕 Breadcrumbs 面包屑导航 · 🆕 `public/robots.txt` · 🌐 SEO 增强（Schema.org / Meta / 关键词）· 📊 访问量重构（不蒜子 + localStorage 降级）· 🔤 字体 self-host（@fontsource）· 🖼️ OptimizedImage 全站接入（WebP / aspect-ratio）· ✨ 设计令牌 + stagger 动画 · 🍞 HeaderNav 底部高亮条 · 🐛 B014-B018 修复 |
| **v2.5.0** | 🆕 全局全文搜索（Cmd+K）· 🌐 SEO Open Graph + Twitter Card 全站 meta 标签                                                                                                  |
| **v2.4.0** | 🆕 访问量统计（countapi.xyz）· 🆕 CC BY-NC-ND 4.0 版权声明 · 🆕 Blog 12 篇/页分页 · 🆕 标签筛选折叠（>12）                                                                  |
| **v2.3.0** | 📊 站点总访问量统一管理 · 🎨 SiteFooter Eye 图标 + 10s 刷新 · 🔧 GUI 存储键与主站对齐                                                                                       |
| **v2.2.0** | 🆕 GUI 子包（Vue 3 SPA）· 🆕 Mermaid 图表 SSG 预渲染 · 🆕 frontmatter 迁移工具 · 🆕 交互式 HTML 课程 · 🆕 浏览量统计（localStorage + sessionStorage）                        |
| **v2.1.0** | 🆕 Giscus 评论系统 · 🆕 自定义 404 错误页 · 🆕 sitemap.xml 自动生成器 · 🐛 B007-B010 修复 · 🎨 CommentSection 极简化（-59%）· 📝 README + COMMENTS 文档              |
| v2.0.0           | 🆕`pnpm post d` 一键部署 · 🆕 `pnpm post c` 独立清理 · 🆕 `-m` / `-p` / `-h` 短选项 · 🐛 B001-B006 修复 · 📝 文档体系重写 · 🎨 UI / 输出优化 · 跨平台执行 |
| v1.5.0           | 完善部署文档，修复 Git SSH 认证问题，建立 gh-pages 分支                                                                                                                   |
| v1.4.0           | 完成 GitHub Actions 自动部署工作流                                                                                                                                        |
| v1.3.0           | 添加 ChangelogPage、FriendsPage                                                                                                                                           |
| v1.2.0           | 添加 post-cli 文章管理工具                                                                                                                                                |
| v1.1.0           | 添加 RSS、图片优化管线                                                                                                                                                    |
| v1.0.0           | 初始版本：首页 + 博客 + 分类 + 标签 + 归档                                                                                                                                |

---

## 后续路线图

> 以下为**已完成**（✅）与**待开发**（☐）的清单。v2.6 版本集中完成了 ✅ 标记的优化项。

### v2.6 已落地（✅）

- [x] 站点搜索（基于 `posts.data` 客户端索引，零外部依赖）
- [x] SEO 增强（Open Graph / Twitter Card / Schema.org / robots.txt / canonical / keywords）
- [x] 字体 self-host（`@fontsource` + `font-display: swap`）
- [x] 访问量统计云持久化（不蒜子 busuanzi + localStorage 降级）
- [x] 图片优化（WebP + LQIP + 懒加载 + aspect-ratio）
- [x] 设计令牌 + 动画 + 面包屑

### v2.7 候选（☐）

- [ ] `OptimizedImage` 支持 AVIF 格式
- [ ] `PostPage` 支持目录大纲折叠 / 展开
- [ ] 国际化（i18n）支持（中 / 英 双语切换）
- [ ] `pnpm post d` 集成 git tag 自动打版本号
- [ ] `pnpm post s` 支持浏览器热重载开关

### v3.0 候选（☐）

- [ ] `pnpm post stats` 文章统计仪表板
- [ ] `pnpm post backup` 一键备份 `content/posts/`
- [ ] VS Code 扩展：snippet + frontmatter 模板
- [ ] 评论通知集成（GitHub Discussions Webhook → 邮件 / 钉钉）
- [ ] RSS / Atom 全文输出（当前仅摘要）
- [ ] 暗色模式跟随系统（`prefers-color-scheme` 自动切换）

---

**FilePress Blog** · v2.6.0 · 作者 [窦长友](mailto:dcyyd_kcug@yeah.net)
