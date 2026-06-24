<script setup lang="ts">
import { computed } from 'vue'
import {
  Github, Mail, Rss, ArrowUpRight,
  FileText, Zap, Shield, Palette, Layers, Terminal, Image, Cpu,
  BookOpen
} from 'lucide-vue-next'
import { data as postsData } from '../data/posts.data'
import { data as tagsData } from '../data/tags.data'
import { data as categoriesData } from '../data/categories.data'
import type { PostDetail, TagInfo, CategoryInfo } from '../types/blog'

const posts = postsData as PostDetail[]
const tags = tagsData as TagInfo[]
const categories = categoriesData as CategoryInfo[]

const stats = computed(() => ({
  posts: posts.length,
  tags: tags.length,
  categories: categories.length,
  totalMinutes: posts.reduce((sum, p) => sum + (p.readingTime || 0), 0)
}))

// 技术栈 —— 取自 README 技术栈表格
const techStack = [
  { name: 'VitePress', version: '1.4.5', desc: 'SSG + 客户端路由' },
  { name: 'Vite', version: '5.4.11', desc: '极速冷启动 / HMR' },
  { name: 'Vue 3', version: '3.5.13', desc: '自定义主题组件' },
  { name: 'TypeScript', version: '5.6.3', desc: '全面 strict 模式' },
  { name: 'Tailwind CSS', version: '3.4.17', desc: '原子化 + 排版插件' },
  { name: 'Lucide', version: '0.468.0', desc: '矢量图标' },
  { name: 'KaTeX', version: '0.16.11', desc: '数学公式渲染' },
  { name: 'VueUse', version: '11.3.0', desc: '组合式 API 工具' },
  { name: 'unified/remark/rehype', version: '11.x', desc: '安全 Markdown 解析' },
  { name: 'gray-matter', version: '4.0.3', desc: 'YAML 头解析与序列化' },
  { name: 'Sharp', version: '0.33.5', desc: 'WebP / LQIP 生成' },
  { name: 'ESLint + Prettier', version: '8.57 / 3.4', desc: '统一风格' },
]

// 特性亮点 —— 取自 README 特性亮点
const features = [
  { icon: FileText, title: '纯文件驱动', desc: 'Markdown 是唯一数据源，无需数据库、Headless CMS、GraphQL。' },
  { icon: Zap, title: '极致构建性能', desc: 'Vite 5 + 手动 chunk 拆分，首屏 LCP 可控。' },
  { icon: Shield, title: '默认安全', desc: '关闭 v-html，统一走 unified → remark → rehype → rehype-sanitize 安全 AST 管线。' },
  { icon: Palette, title: '现代视觉', desc: 'Tailwind v3 + class 暗色模式 + Inter / JetBrains Mono 字体族。' },
  { icon: Layers, title: '完整站点能力', desc: '首页 / 博客列表 / 分类 / 标签 / 归档 / 友链 / 关于 / 更新日志 / RSS 全部内置。' },
  { icon: Terminal, title: '零依赖 CLI', desc: 'pnpm post new|update|list|read 一条命令管文章，HMR 即时生效。' },
  { icon: Image, title: '图片优化管线', desc: 'pnpm images 一键生成 WebP + LQIP 模糊占位。' },
  { icon: Cpu, title: '强类型', desc: 'tsc strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes。' },
]

interface SocialLink {
  icon: typeof Github | typeof Mail | typeof Rss
  label: string
  href: string
  external: boolean
}

const socialLinks: SocialLink[] = [
  { icon: Github, label: 'GitHub', href: 'https://FilePress · Blog/dcyyd/dcyyd.github.io', external: true },
  { icon: Mail, label: 'Email', href: 'mailto:dcyyd_kcug@yeah.net', external: false },
  { icon: Rss, label: 'RSS', href: '/feed.xml', external: true },
]
</script>

<template>
  <article class="mx-auto max-w-[1240px] px-8">
    <!-- ============== HERO · 期刊式头部 ============== -->
    <section class="animate-fade-up pt-12 pb-12 sm:pt-14 sm:pb-20">
      <div class="eyebrow flex items-center gap-3">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>Colophon · 关于本站</span>
      </div>

      <div class="mt-10 grid gap-16 lg:grid-cols-[1.7fr_1fr] lg:items-end">
        <div>
          <h1 class="serif-title text-balance text-[2.75rem] leading-[1.04] sm:text-[3.75rem] lg:text-[5.25rem]"
            style="color: var(--text-primary);">
            <span class="italic-serif">About</span>
          </h1>

          <p class="mt-8 max-w-[560px] text-[17px] leading-[1.7]" style="color: var(--text-secondary);">
            一个以<b class="font-medium text-[var(--text-primary)]">文件即数据</b>为核心理念的现代化技术博客。
            所有文章以 Markdown 存放于
            <code class="mono-num rounded px-1.5 py-0.5 text-[0.85em]"
              style="background: var(--muted); color: var(--text-primary);">content/posts/</code>，
            VitePress 在构建期扫描并生成静态 HTML，运行时无任何 IO 与数据库依赖，
            部署结果是一组可托管在任意 CDN / Nginx / Pages 上的纯静态文件。
          </p>

          <div class="flex flex-wrap gap-3 mt-10">
            <a v-for="item in socialLinks" :key="item.label" :href="item.href"
              :target="item.external ? '_blank' : undefined" rel="noreferrer noopener"
              class="group inline-flex items-center gap-2 border px-4 py-2 text-[12px] font-medium uppercase tracking-[0.14em] hover:bg-[var(--accent)]/5 transition-colors duration-200"
              style="border-color: var(--ink-200); color: var(--text-primary);">
              <component :is="item.icon" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {{ item.label }}
              <ArrowUpRight class="h-3 w-3 opacity-50 transition-opacity duration-200 group-hover:opacity-100 shrink-0"
                aria-hidden="true" />
            </a>
          </div>
        </div>

        <!-- 期刊式元数据侧栏 -->
        <aside class="space-y-4 pt-6 lg:max-w-[280px]">
          <dl class="grid grid-cols-[80px_1fr] gap-x-4 gap-y-3">
            <dt class="eyebrow self-center" style="font-size: 10px;">Articles</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(stats.posts).padStart(2, '0')
              }} dispatches</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Tags</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(stats.tags).padStart(2, '0')
              }} subjects</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Categories</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(stats.categories).padStart(2,
              '0') }} topics</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Reading</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{
              String(stats.totalMinutes).padStart(2, '0') }} min</dd>
          </dl>
        </aside>
      </div>
    </section>

    <!-- ============== 特性亮点 ============== -->
    <section class="pb-24">
      <div class="eyebrow flex items-center gap-3 mb-10">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>特性亮点</span>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="feat in features" :key="feat.title"
          class="group border p-6 hover:border-[var(--accent)]/30 transition-colors duration-200"
          style="border-color: var(--ink-200); background: var(--muted);">
          <component :is="feat.icon" class="mb-4 h-6 w-6" style="color: var(--accent);" aria-hidden="true" />
          <h3 class="text-[14px] font-semibold mb-2" style="color: var(--text-primary);">{{ feat.title }}</h3>
          <p class="text-[13px] leading-[1.65]" style="color: var(--text-secondary);">{{ feat.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ============== 技术栈 ============== -->
    <section class="pb-24">
      <div class="eyebrow flex items-center gap-3 mb-10">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>技术栈</span>
      </div>

      <div class="overflow-hidden" style="border: 1px solid var(--ink-200);">
        <div v-for="(item, i) in techStack" :key="item.name" class="flex items-center justify-between gap-4 px-6 py-3.5"
          :class="i !== techStack.length - 1 ? 'border-b' : ''" style="border-color: var(--ink-200);">
          <div class="flex items-baseline gap-2.5 min-w-0">
            <span class="text-[14px] font-medium truncate" style="color: var(--text-primary);">{{ item.name }}</span>
            <span class="mono-num text-[11px] shrink-0 rounded px-1.5 py-0.5"
              style="background: var(--accent)/8; color: var(--accent);">{{ item.version }}</span>
          </div>
          <span class="text-[12px] shrink-0 hidden sm:inline" style="color: var(--text-secondary);">{{ item.desc
            }}</span>
        </div>
      </div>
    </section>
  </article>
</template>