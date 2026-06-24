<script setup lang="ts">
import { computed } from 'vue'
import {
  Sparkles, Wrench, Rocket, Bug, Tag as TagIcon,
  GitCommit, Layers, History
} from 'lucide-vue-next'

interface ChangelogEntry {
  version: string
  date: string
  type: 'major' | 'minor' | 'patch'
  highlights: string[]
  changes: {
    type: 'feat' | 'fix' | 'refactor' | 'docs' | 'perf' | 'chore'
    text: string
  }[]
}

const changelog: ChangelogEntry[] = [
  {
    version: 'v2.2.0',
    date: '2026-06-24',
    type: 'minor',
    highlights: [
      '🖥️ 新增 GUI 管理后台（`gui/`）：纯 Web SPA 版博客管理工作台',
      '🆕 新增 `MermaidChart.vue`：Markdown 代码块图表 SSG 预渲染为 SVG',
      '🆕 新增 `viewCount.ts`：浏览量统计（localStorage + sessionStorage）',
      '🆕 新增 `migrate-summary-to-description.mjs`：frontmatter 字段迁移工具',
      '🆕 新增 `mermaid` 依赖（^11.15.0）：图表渲染引擎',
      '🎨 GUI 优化：仪表盘精简 / 编辑器简化 / 文件管理一行布局 / 停止态修正',
      '📝 README 全面更新至项目实际状态（GUI 章节 + 目录结构修正）'
    ],
    changes: [
      { type: 'feat',     text: '新增 `gui/` 子包：Web SPA 管理后台（Vue 3 + Vite 5 + Pinia + Tailwind CSS）' },
      { type: 'feat',     text: 'GUI 五大核心模块：📊 工作台 / ✏️ Markdown 编辑器 / 📁 文件管理 / 🚀 一键部署 / 👀 本地预览' },
      { type: 'feat',     text: 'GUI 部署面板新增四态机：`running` / `success` / `error` / `stopped`，主动停止不会污染失败语义' },
      { type: 'feat',     text: 'GUI 编辑器：分栏编辑/预览、实时统计（字数/阅读时长）、目录大纲、Mermaid 渲染、快捷插入、自动保存草稿' },
      { type: 'feat',     text: '新增 `gui/server/index.mjs`：纯 Node.js http server（~504 行），路由表 + SSE + 进程管理' },
      { type: 'feat',     text: '新增 `gui/src/api/index.ts`：fetch + EventSource 封装' },
      { type: 'feat',     text: '新增 `gui/src/stores/index.ts`：Pinia 状态管理（posts / logs / toast / deploy）' },
      { type: 'feat',     text: '新增 `gui/src/utils/markdown.ts`：自研零依赖 Markdown 渲染器（161 行）' },
      { type: 'feat',     text: '新增 `gui/src/utils/editorStats.ts`：字数 / 阅读时长 / 标题大纲' },
      { type: 'feat',     text: '新增 `gui/src/utils/wordAndView.ts`：字数与浏览量聚合' },
      { type: 'feat',     text: '新增 `.vitepress/theme/components/MermaidChart.vue`：检测 mermaid 代码块并渲染为 SVG' },
      { type: 'feat',     text: '新增 `.vitepress/theme/utils/viewCount.ts`：浏览量统计（localStorage 持久化 + sessionStorage 防重复）' },
      { type: 'feat',     text: '新增 `scripts/migrate-summary-to-description.mjs`：批量迁移 frontmatter summary → description' },
      { type: 'feat',     text: '新增 `pnpm gui:dev` / `pnpm gui:build` / `pnpm gui:start` 脚本别名' },
      { type: 'feat',     text: '新增 `mermaid` 依赖（^11.15.0），支持 Markdown 图表 SSG 预渲染' },
      { type: 'fix',      text: 'GUI 部署/预览停止按钮：修复停止后状态显示为 error → 新增 `stopped` 态并在 SSE done 事件中丢弃覆盖' },
      { type: 'fix',      text: 'GUI 编辑器加载卡住：API 成功但数据异常时 loading 未重置 → 增加 10 秒超时 + `ok:false` 检测' },
      { type: 'fix',      text: 'GUI Mermaid 图表未渲染：MarkdownRenderer 未识别 mermaid 代码块 → 检测 `language === "mermaid"` 渲染 MermaidChart' },
      { type: 'refactor', text: 'GUI 仪表盘移除 7 天活动柱图和 Top 10 浏览榜，精简页面布局' },
      { type: 'refactor', text: 'GUI 编辑器移除 Frontmatter 智能补全（分类/标签），简化界面' },
      { type: 'refactor', text: 'GUI 文件管理筛选区改为一行布局（分类/标签/状态/排序 flex-wrap）' },
      { type: 'refactor', text: 'GUI 部署面板移除最近 20 条部署历史列表，精简界面' },
      { type: 'chore',    text: '项目版本号升级 2.1.0 → 2.2.0（package.json + README + ChangelogPage）' },
      { type: 'docs',     text: '新增 `gui/README.md`：GUI 完整文档（功能 / 架构 / API / CLI 映射 / 安全 / 状态机）' },
      { type: 'docs',     text: '更新 `README.md`：新增 GUI 章节 + 技术栈（Mermaid）+ 目录结构修正（移除 clean.mjs、加 MermaidChart.vue / viewCount.ts / migrate-summary）' },
      { type: 'docs',     text: '更新 `logs/PROJECT_ITERATION_SUMMARY.md`：新增 v2.2 变更总览章节' }
    ]
  },
  {
    version: 'v2.1.0',
    date: '2026-06-23',
    type: 'minor',
    highlights: [
      '🆕 集成 Giscus 评论系统（GitHub Discussions 驱动）',
      '🆕 新增自定义 404 错误页（NotFoundPage.vue）',
      '🆕 新增 sitemap.xml 自动生成器（`pnpm sitemap`）',
      '🐛 修复 Giscus CI 部署后 `repo=undefined` 报错',
      '🐛 修复本地 .env 文件未被自动加载',
      '🎨 简化 CommentSection：从 272 行精简到 112 行（-59%）',
      '📝 新增 docs/COMMENTS.md Giscus 配置文档'
    ],
    changes: [
      { type: 'feat',     text: '新增 `.vitepress/theme/components/CommentSection.vue`：Giscus 评论组件，懒加载、自动跟随主题、SPA 路由感知' },
      { type: 'feat',     text: '新增 `.vitepress/theme/components/NotFoundPage.vue` + `404.md`：友好 404 错误页，含返回/推荐入口' },
      { type: 'feat',     text: '新增 `scripts/generate-sitemap.mjs`：扫描 content/posts 生成 sitemap.xml，已串联进 `pnpm dev` 与 `pnpm build`' },
      { type: 'feat',     text: '新增 `pnpm sitemap` 脚本别名，纳入构建流水线' },
      { type: 'feat',     text: '新增 `docs/COMMENTS.md`：Giscus 5 步配置指南 + 常见问题排查' },
      { type: 'feat',     text: '新增 `.env.example`：Giscus 环境变量模板' },
      { type: 'fix',      text: 'B007：CI 部署后 Giscus 显示 `repo=undefined` → 在 `.github/workflows/deploy.yml` 的 Build env 中注入 `VITE_GISCUS_*` 变量，敏感 ID 走 GitHub Secrets' },
      { type: 'fix',      text: 'B008：本地开发时 `.env` 文件未被 VitePress 自动加载 → `config.mts` 增加轻量级 .env 解析器，注入到 `process.env` 后再走 `vite.define`' },
      { type: 'fix',      text: 'B009：404 页面未生效仍显示默认页 → 移除 `404.md` 中 `layout: page` 等冲突配置' },
      { type: 'fix',      text: 'B010：sitemap URL 默认值 `https://example.com` 与生产不符 → 改为 `https://dcyyd.github.io`' },
      { type: 'refactor', text: '`CommentSection.vue` 移除响应式状态机（idle/loading/ready/error）、轮询逻辑、手动主题切换；信任 Giscus 原生能力' },
      { type: 'refactor', text: '`CommentSection.vue` 改用 `setAttribute` 直接构建 script 元素，避免 URLSearchParams 拼接导致参数丢失' },
      { type: 'refactor', text: '`CommentSection.vue` 移除 `enabled` / `loadingText` props 与未启用降级 UI；改用 `v-if="ready"` 直接控制是否渲染' },
      { type: 'perf',     text: '`pnpm build` 流水线调整为 `typecheck → rss → sitemap → vitepress build`，sitemap 在构建前生成' },
      { type: 'chore',    text: '项目版本号升级 2.0.0 → 2.1.0（package.json）' },
      { type: 'docs',     text: '重写 `README.md`：v2.1 视角，补充评论系统与 sitemap 章节' },
      { type: 'docs',     text: '更新 `logs/PROJECT_ITERATION_SUMMARY.md`：新增 v2.1 变更记录' }
    ]
  },
  {
    version: 'v2.0.0',
    date: '2026-06-22',
    type: 'major',
    highlights: [
      '🆕 新增 `deploy` 一键部署命令 `pnpm post d`（预检 → 构建 → 推送 → 清理）',
      '🆕 新增 `clean` 独立清理命令 `pnpm post c`',
      '🆕 新增短选项 `-m`（message）/ `-p`（port）/ `-h`（host）',
      '🆕 新增 `sitemap.xml` 自动生成器（`scripts/generate-sitemap.mjs`）',
      '🆕 新增自定义 404 错误页（`NotFoundPage.vue` + `404.md`）',
      '🐛 修复 6 个 BUG（B001-B006），详见下方修复记录',
      '🎨 CLI 输出重构：步骤化进度、diff 预览、错误降级、构建透传、SSH 软预检',
      '📝 文档体系重写：README / DEPLOYMENT / FAQ / 发布全流程指南 / CLI readme / 迭代总结'
    ],
    changes: [
      { type: 'feat',     text: '新增 `scripts/post-cli/deploy.mjs`：构建 + 推送 dist 到 gh-pages 分支' },
      { type: 'feat',     text: '新增 `scripts/post-cli/clean.mjs` 独立清理命令（原 deploy 内部清理逻辑外提）' },
      { type: 'feat',     text: '新增 `scripts/generate-sitemap.mjs`：扫描 content/posts 生成 sitemap.xml，已串联进 `pnpm build`' },
      { type: 'feat',     text: '新增 `.vitepress/theme/components/NotFoundPage.vue` + `404.md`：友好 404 错误页，含返回/推荐入口' },
      { type: 'feat',     text: '在 `scripts/post-cli.mjs` 注册 `-m` / `-p` / `-h` 短选项，覆盖到 deploy / serve / clean' },
      { type: 'feat',     text: '在 `package.json` 新增脚本别名：`pd` / `pl` / `pr` / `ps` / `pc` / `sitemap`' },
      { type: 'fix',      text: 'B001：`execFile` 使用 `shell:true` 导致含空格的 commit message 被拆分 → 改为 `shell:false`，args 原样传数组' },
      { type: 'fix',      text: 'B002：Windows 下 `pnpm post d` 报 `Could not create directory /home/root/.ssh` → 注入 `HOME=C:/Users/Administrator` + `GIT_SSH_COMMAND` 指定密钥' },
      { type: 'fix',      text: 'B003：中文分类 / 标签 URL 二次编码 404 → 改用中文原字符作为 slug，移除 `encodeURIComponent`' },
      { type: 'fix',      text: 'B004：Node 20 警告 `DEP0190 DeprecationWarning: shell:true` → 统一改为 `shell:false`，Windows 可执行文件自动加 `.exe`' },
      { type: 'fix',      text: 'B005：`-m` 短选项被误判为 boolean flag → 在 `SHORT_FLAGS` 注册 `m: message`，并校验类型为 string' },
      { type: 'fix',      text: 'B006：系统级 `url.https://FilePress · Blog/.insteadof` 强制 SSH 转 HTTPS → 改为按调用上下文注入 `GIT_SSH_COMMAND`，不污染全局 git config' },
      { type: 'refactor', text: '`scripts/post-cli/deploy.mjs` 重构为四阶段步骤：① 预检 ② 构建 ③ 推送 ④ 清理，每阶段独立可跳过（`--skip-*`）' },
      { type: 'refactor', text: '`scripts/post-cli/ui.mjs` 新增 `info/success/warn/error/heading/step/diff/hint` 等高亮辅助函数' },
      { type: 'perf',    text: '`pnpm build` 流水线调整为 `typecheck → rss → sitemap → vitepress build`，确保构建前静态资源已生成' },
      { type: 'docs',    text: '重写 `README.md`：v2.0 视角，新增「快速开始」「架构图」「CLI 一览」「部署方案」「BUG 修复表」' },
      { type: 'docs',    text: '重写 `docs/DEPLOYMENT.md`：5 套部署方案，重点介绍 `pnpm post d` 一键部署、选项、环境变量、故障排查' },
      { type: 'docs',    text: '重写 `docs/FAQ.md`：覆盖开发、构建、部署、文章管理、CLI 错误、BUG 修复、自定义与安全' },
      { type: 'docs',    text: '重写 `docs/DIRECTORY_STRUCTURE.md`：同步新文件节点、新增核心设计原则与数据流向图' },
      { type: 'docs',    text: '重写 `docs/发布全流程指南.md`：端到端整合 `pnpm post d` 流程、4 类工作流场景' },
      { type: 'docs',    text: '重写 `scripts/readme.md`：新增 § 5.5 `deploy` 章节、§ 5.5.7 已知 BUG 与修复、§ 12 v2.0 摘要' },
      { type: 'docs',    text: '重写 `logs/PROJECT_ITERATION_SUMMARY.md`：v2.0 全量变更、技术决策、新功能详解、BUG 记录、构建分析、部署选型' },
      { type: 'chore',    text: '统一项目名称为 `FilePress Blog (filepress-blog)`、版本 `2.0.0`、作者 `窦长友 <dcyyd_kcug@yeah.net>`' },
      { type: 'chore',    text: '`scripts/generate-rss.mjs` 生成器标识更新为 `filepress-blog rss generator`' }
    ]
  },
  {
    version: 'v1.5.0',
    date: '2026-06-19',
    type: 'minor',
    highlights: [
      '新增按年归档页面 /archives',
      '新增分类系统：一篇文章归属唯一分类，分类页 /categories 与单分类页 /categories/[slug]',
      '首页去除「继续探索」「探索标签」按钮，原位置替换为「订阅 RSS」',
      '页脚简化为单行版权信息，版本号位置改为「回到顶部」按钮'
    ],
    changes: [
      { type: 'feat', text: '新增 ArchivePage.vue 按年份分组的时间轴视图与 archives.md 入口' },
      { type: 'feat', text: '新增 CategoriesPage.vue 分类总览 + CategoryPage.vue 单分类页 + categories/[category] 动态路由' },
      { type: 'feat', text: 'utils/posts.ts 新增 getAllCategories / getPostsByCategorySlug / getYearArchives' },
      { type: 'feat', text: 'data/ 新增 categories.data.ts 与 archives.data.ts 构建期数据源' },
      { type: 'feat', text: 'ArticleCard / PostPage 显示分类胶囊，关联到分类详情页' },
      { type: 'refactor', text: 'HomePage 去除「继续探索」「探索标签」两个 CTA，替换为 RSS 订阅按钮' },
      { type: 'refactor', text: 'BlogPage 左栏精简：仅保留搜索 + 标签筛选，去除「热门标签」侧栏' },
      { type: 'refactor', text: 'SiteFooter 重构：仅保留版权行 + 回到顶部按钮（原 v1.0.0 版本号已迁移至 Changelog）' },
      { type: 'docs', text: '全项目版本号同步至 1.5.0：package.json / scripts/post-cli/ui.mjs / scripts/readme.md / HomePage' }
    ]
  },
  {
    version: 'v1.4.0',
    date: '2026-06-17',
    type: 'minor',
    highlights: [
      '新增 Blog 导航与全文章时间轴页面',
      '首页 UI/UX 大幅重构，支持更宽画布与特性展示',
      '新增项目更新日志与友链页面'
    ],
    changes: [
      { type: 'feat', text: '新增 BlogPage 组件：搜索 + 标签筛选 + 按年份时间轴分组' },
      { type: 'feat', text: '新增 ChangelogPage 与 FriendsPage 页面与对应 Markdown 入口' },
      { type: 'feat', text: 'HeaderNav 加入「博客 / 更新日志 / 友链」三个新导航项' },
      { type: 'feat', text: '首页 Hero 升级为左右分栏布局，加入特性卡片 + 最新文章 + 热门标签' },
      { type: 'refactor', text: 'AppLayout 重构为路由感知：宽页 88rem，文章页 max-w-5xl 紧凑阅读' },
      { type: 'refactor', text: 'SiteFooter 链接区更新，加入 Blog / Changelog / Friends 入口' },
      { type: 'docs', text: 'scripts/readme.md CLI 完整文档' }
    ]
  },
  {
    version: 'v1.3.0',
    date: '2026-06-15',
    type: 'minor',
    highlights: [
      '构建期 MD → SafeAST 安全渲染管线',
      '上线 CLI 命令 `post new / update / list / read / help`'
    ],
    changes: [
      { type: 'feat', text: '新增 .vitepress/theme/utils/markdown.ts，将 MD 编译为受控 SafeAST' },
      { type: 'feat', text: 'scripts/post-cli/* 完整实现：new / update / list / read / help 五条命令' },
      { type: 'feat', text: 'frontmatter 顺序固定：title → description → date → author → category → tags → cover → draft' },
      { type: 'fix', text: 'POST 落盘后 HMR 自动捕获，无需重启 dev server' },
      { type: 'docs', text: '在 docs/ACCEPTANCE_REPORT.md 记录验收清单' }
    ]
  },
  {
    version: 'v1.2.0',
    date: '2026-06-10',
    type: 'minor',
    highlights: [
      '上线 Tag 标签页与上下篇导航',
      '引入现代设计令牌系统（设计语言：Indigo → Violet → Cyan）'
    ],
    changes: [
      { type: 'feat', text: 'TagFilter 组件：选中态用品牌渐变，悬浮 scale 1.05' },
      { type: 'feat', text: 'PostPage 上下篇导航：左上一篇 / 右下一篇，不存在则占位' },
      { type: 'feat', text: '设计系统：CSS 变量统一管理色彩 / 圆角 / 阴影 / 动效' },
      { type: 'perf', text: 'rollup 手动拆分：katex → math chunk，lucide → icons chunk' }
    ]
  },
  {
    version: 'v1.1.0',
    date: '2026-05-28',
    type: 'minor',
    highlights: [
      '站点初始上线：ArticleCard、HomePage、AppLayout、HeaderNav、SiteFooter 全部到位',
      'Tech Stack：VitePress 1.4 + Vue 3 + TypeScript strict + Tailwind'
    ],
    changes: [
      { type: 'feat', text: 'content/posts/ 第一批 8 篇文章落地' },
      { type: 'feat', text: 'ArticleCard 卡片：渐变边框 + 悬浮上浮 + 装饰光斑' },
      { type: 'feat', text: 'SiteFooter 三列布局：品牌 / 导航 / 技术栈' },
      { type: 'chore', text: '开启 lastUpdated、cleanUrls、appearance 主题切换' }
    ]
  },
  {
    version: 'v1.0.0',
    date: '2026-05-15',
    type: 'major',
    highlights: [
      '项目初始化：从零搭建 vitepress-file-blog 仓库'
    ],
    changes: [
      { type: 'feat', text: 'VitePress 1.4 + Vue 3 + TypeScript strict 脚手架' },
      { type: 'feat', text: 'tailwind.config.js 接入 @tailwindcss/typography' },
      { type: 'docs', text: 'docs/DEPLOYMENT.md / DIRECTORY_STRUCTURE.md / FAQ.md 初始版本' }
    ]
  }
]

// 统计数据
const stats = computed(() => {
  const totalChanges = changelog.reduce((sum, e) => sum + e.changes.length, 0)
  const majorCount = changelog.filter(e => e.type === 'major').length
  const minorCount = changelog.filter(e => e.type === 'minor').length
  const patchCount = changelog.filter(e => e.type === 'patch').length
  const dates = changelog.map(e => e.date).sort()
  return {
    versions: changelog.length,
    latest: changelog[0]?.version ?? '—',
    totalChanges,
    majorCount,
    minorCount,
    patchCount,
    from: dates[dates.length - 1] ?? '—',
    to: dates[0] ?? '—'
  }
})

const typeMeta: Record<string, { icon: typeof Sparkles; label: string; color: string }> = {
  feat:     { icon: Sparkles, label: 'Feature',  color: 'var(--accent)' },
  fix:      { icon: Bug,      label: 'Fix',      color: '#f59e0b' },
  refactor: { icon: Wrench,   label: 'Refactor', color: '#8b5cf6' },
  docs:     { icon: TagIcon,  label: 'Docs',     color: '#06b6d4' },
  perf:     { icon: Rocket,   label: 'Perf',     color: '#10b981' },
  chore:    { icon: Wrench,   label: 'Chore',    color: 'var(--text-tertiary)' }
}

const versionType: Record<string, { label: string; style: Record<string, string> }> = {
  major: { label: 'Major',  style: { background: 'var(--accent)/12', color: 'var(--accent)', borderColor: 'var(--accent)/30' } },
  minor: { label: 'Minor',  style: { background: 'var(--muted)', color: 'var(--text-secondary)', borderColor: 'var(--ink-200)' } },
  patch: { label: 'Patch',  style: { background: 'var(--muted)', color: 'var(--text-tertiary)', borderColor: 'var(--ink-200)' } }
}
</script>

<template>
  <article class="mx-auto max-w-[1240px] px-8">
    <!-- ============== HERO · 期刊式头部 ============== -->
    <section class="animate-fade-up pt-12 pb-12 sm:pt-14 sm:pb-20">
      <div class="eyebrow flex items-center gap-3">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>Changelog · 项目更新日志</span>
      </div>

      <div class="mt-10 grid gap-16 lg:grid-cols-[1.7fr_1fr] lg:items-end">
        <div>
          <h1 class="serif-title text-balance text-[2.75rem] leading-[1.04] sm:text-[3.75rem] lg:text-[5.25rem]"
            style="color: var(--text-primary);">
            <span class="italic-serif">Changelog</span>
          </h1>
          <p class="mt-8 max-w-[560px] text-[17px] leading-[1.7]" style="color: var(--text-secondary);">
            记录每次发布的新特性、问题修复与重构。遵循
            <a href="https://semver.org/lang/zh-CN/" class="link-underline" style="color: var(--accent);" target="_blank" rel="noopener noreferrer">语义化版本</a>
            规范。
          </p>
        </div>

        <!-- 期刊式元数据侧栏 -->
        <aside class="space-y-4 pt-6 lg:max-w-[280px]">
          <dl class="grid grid-cols-[80px_1fr] gap-x-4 gap-y-3">
            <dt class="eyebrow self-center" style="font-size: 10px;">Versions</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(stats.versions).padStart(2, '0') }} releases</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Latest</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ stats.latest }}</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Changes</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(stats.totalChanges).padStart(2, '0') }} commits</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Span</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ stats.from }} → {{ stats.to }}</dd>
          </dl>
        </aside>
      </div>
    </section>

    <!-- ============== 发布统计胶囊 ============== -->
    <section class="pb-16">
      <div class="flex flex-wrap gap-3">
        <div class="inline-flex items-center gap-2 border px-3 py-1.5"
          style="border-color: var(--accent)/30; background: var(--accent)/6;">
          <span class="inline-block h-1.5 w-1.5 rounded-full" style="background: var(--accent);" />
          <span class="text-[12px] font-medium" style="color: var(--text-primary);">{{ stats.majorCount }} Major</span>
        </div>
        <div class="inline-flex items-center gap-2 border px-3 py-1.5"
          style="border-color: var(--ink-200); background: var(--muted);">
          <span class="inline-block h-1.5 w-1.5 rounded-full" style="background: var(--text-secondary);" />
          <span class="text-[12px] font-medium" style="color: var(--text-primary);">{{ stats.minorCount }} Minor</span>
        </div>
        <div class="inline-flex items-center gap-2 border px-3 py-1.5"
          style="border-color: var(--ink-200); background: var(--muted);">
          <span class="inline-block h-1.5 w-1.5 rounded-full" style="background: var(--text-tertiary);" />
          <span class="text-[12px] font-medium" style="color: var(--text-primary);">{{ stats.patchCount }} Patch</span>
        </div>
      </div>
    </section>

    <!-- ============== Timeline ============== -->
    <section class="pb-20" aria-label="更新日志时间轴">
      <div class="eyebrow flex items-center gap-3 mb-10">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>Release Timeline</span>
      </div>

      <ol class="timeline-list">
        <li v-for="(entry, idx) in changelog" :key="entry.version"
          class="timeline-entry group"
          :style="{ animationDelay: `${idx * 100}ms` }">
          <!-- 时间轴节点 -->
          <div class="timeline-node" aria-hidden="true">
            <span class="timeline-dot"
              :style="{ background: entry.type === 'major' ? 'var(--accent)' : 'var(--text-tertiary)' }" />
            <span class="timeline-line" style="background: var(--ink-200);" />
          </div>

          <!-- 内容卡片 -->
          <div class="timeline-card border"
            :style="{ borderColor: entry.type === 'major' ? 'var(--accent)/30' : 'var(--ink-200)', background: 'var(--paper)' }">
            <!-- 头部：版本号 + 类型 + 日期 -->
            <div class="flex flex-wrap items-baseline gap-x-4 gap-y-2 pb-4 border-b"
              style="border-color: var(--ink-200);">
              <span class="serif-title text-[1.35rem] sm:text-[1.6rem] leading-tight" style="color: var(--text-primary);">
                {{ entry.version }}
              </span>
              <span class="inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                :style="versionType[entry.type].style">
                {{ versionType[entry.type].label }}
              </span>
              <time :datetime="entry.date" class="mono-num ml-auto text-[11.5px]" style="color: var(--text-tertiary);">
                {{ entry.date }}
              </time>
            </div>

            <!-- 亮点 -->
            <ul class="py-4 space-y-2">
              <li v-for="(highlight, hIdx) in entry.highlights" :key="hIdx"
                class="flex items-start gap-3 text-[14.5px] leading-[1.7]" style="color: var(--text-primary);">
                <span class="mt-[9px] inline-block h-px w-4 shrink-0" style="background: var(--accent);" aria-hidden="true" />
                <span>{{ highlight }}</span>
              </li>
            </ul>

            <!-- 详细变更 -->
            <div v-if="entry.changes.length > 0" class="border-t py-3" style="border-color: var(--ink-200);">
              <div class="eyebrow mb-3" style="font-size: 10px;">
                <span class="inline-flex items-center gap-1.5">
                  <GitCommit class="h-2.5 w-2.5" aria-hidden="true" />
                  {{ entry.changes.length }} commits
                </span>
              </div>
              <ul class="space-y-1.5">
                <li v-for="(change, cIdx) in entry.changes" :key="cIdx"
                  class="flex items-start gap-3 text-[13px] leading-[1.65] py-1.5"
                  style="color: var(--text-secondary);">
                  <span class="mono-num inline-flex shrink-0 items-center gap-1.5 px-1.5 py-0.5 rounded-sm text-[9.5px] font-semibold uppercase tracking-[0.12em] mt-0.5"
                    :style="{ background: `${typeMeta[change.type].color}14`, color: typeMeta[change.type].color }">
                    <component :is="typeMeta[change.type].icon" class="h-2.5 w-2.5" aria-hidden="true" />
                    {{ typeMeta[change.type].label }}
                  </span>
                  <span>{{ change.text }}</span>
                </li>
              </ul>
            </div>
          </div>
        </li>
      </ol>
    </section>
  </article>
</template>

<style scoped>
/* 时间轴容器 */
.timeline-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 时间轴条目 */
.timeline-entry {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 20px;
  padding-bottom: 0;
  animation: timeline-rise 0.5s ease both;
}

.timeline-entry:last-child .timeline-line {
  display: none;
}

.timeline-entry:last-child {
  padding-bottom: 0;
}

/* 时间轴节点列 */
.timeline-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 28px;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  flex-shrink: 0;
  z-index: 1;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.timeline-entry:hover .timeline-dot {
  transform: scale(1.5);
  box-shadow: 0 0 0 4px var(--accent)/12;
}

.timeline-line {
  width: 1.5px;
  flex: 1;
  margin-top: 8px;
  min-height: calc(100% + 24px);
}

/* 内容卡片 */
.timeline-card {
  padding: 20px 24px;
  margin-bottom: 24px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.timeline-entry:hover .timeline-card {
  border-color: var(--accent)/20;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* 入场动画 */
@keyframes timeline-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .timeline-entry {
    animation: none;
  }
  .timeline-dot,
  .timeline-card {
    transition: none;
  }
}

/* 移动端：缩小间距 */
@media (max-width: 640px) {
  .timeline-entry {
    grid-template-columns: 18px 1fr;
    gap: 14px;
  }

  .timeline-card {
    padding: 16px;
    margin-bottom: 16px;
  }

  .timeline-node {
    padding-top: 22px;
  }

  .timeline-dot {
    width: 8px;
    height: 8px;
  }
}
</style>
