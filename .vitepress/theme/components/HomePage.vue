<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, BookOpen, Clock, FileText, Tag as TagIcon, ArrowUpRight } from 'lucide-vue-next'
import { data as postsData } from '../data/posts.data'
import { data as tagsData } from '../data/tags.data'
import type { PostDetail, PostMeta, TagInfo } from '../types/blog'
import { toPostMeta } from '../utils/postMeta'
import ArticleCard from './ArticleCard.vue'

const posts = postsData as PostDetail[]
const tags = tagsData as TagInfo[]

const postMetas = computed<PostMeta[]>(() => posts.map(toPostMeta))

const stats = computed(() => ({
  posts: postMetas.value.length,
  tags: tags.length,
  totalMinutes: postMetas.value.reduce((sum, p) => sum + (p.readingTime || 0), 0)
}))

const techStack = [
  'VitePress 1.4',
  'Vue 3.5',
  'TypeScript Strict',
  'Tailwind 3',
  'Vite 5',
  'Lucide',
  'KaTeX',
  'VueUse',
  'sharp',
  'gray-matter',
  'rehype-sanitize',
  'ESLint'
]

const today = new Date()
const issueNumber = String(6).padStart(2, '0')
const isoDate = `${today.getFullYear()} · ${String(today.getMonth() + 1).padStart(2, '0')} · ${String(today.getDate()).padStart(2, '0')}`

const featuredPosts = computed(() => postMetas.value.slice(0, 3))
const recentPosts = computed(() => postMetas.value.slice(3, 7))
</script>

<template>
  <article class="mx-auto max-w-[1240px] px-8">
    <!-- ============== HERO · 期刊式头部 ============== -->
    <section class="animate-fade-up pt-24 pb-20 sm:pt-28 sm:pb-24">
      <div class="eyebrow flex items-center gap-3">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>Volume 01 · Issue {{ issueNumber }} · {{ isoDate }}</span>
      </div>

      <div class="mt-10 grid gap-16 lg:grid-cols-[1.7fr_1fr] lg:items-end">
        <div>
          <h1 class="serif-title text-balance text-[2.75rem] leading-[1.04] sm:text-[3.75rem] lg:text-[5.25rem]"
            style="color: var(--text-primary);">
            <span class="italic-serif">FilePress Blog</span>
          </h1>

          <p class="mt-8 max-w-[560px] text-[17px] leading-[1.7]" style="color: var(--text-secondary);">
            零数据库 · 零 CMS。所有内容来自
            <code class="mono-num rounded px-1.5 py-0.5 text-[0.85em]"
              style="background: var(--muted); color: var(--text-primary);">content/posts/</code>
            —— 构建期解析 frontmatter、标签、阅读时长与安全 Markdown AST，
            部署结果是一组可托管在任意 CDN 的纯静态文件。
          </p>

          <div class="mt-10 flex flex-wrap items-center gap-3">
            <a href="/blog" class="btn btn-primary">
              <BookOpen class="h-4 w-4" />
              浏览全部文章
              <ArrowRight class="h-4 w-4" />
            </a>
            <a href="/feed.xml" rel="noopener" class="btn btn-ghost">订阅 RSS</a>
          </div>
        </div>

        <aside class="space-y-4 pt-6 lg:max-w-[280px]">
          <dl class="grid grid-cols-[80px_1fr] gap-x-4 gap-y-3">
            <dt class="eyebrow self-center" style="font-size: 10px;">Issue</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">№ {{ issueNumber }} / 2026</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Volume</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">01</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Articles</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(stats.posts).padStart(2, '0') }} dispatches</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Tags</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(stats.tags).padStart(2, '0') }} subjects</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Reading</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(stats.totalMinutes).padStart(2, '0') }} min</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Stack</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">VitePress · Vue · TS</dd>
          </dl>
        </aside>
      </div>
    </section>

    <!-- ============== 跑马灯技术栈 ============== -->
    <section class="pb-16">
      <div class="marquee-mask">
        <div class="marquee-track">
          <span v-for="(item, i) in [...techStack, ...techStack, ...techStack, ...techStack]" :key="i" class="marquee-item">
            <span class="marquee-dot" />
            <span class="mono-num text-[12px] tracking-wide" style="color: var(--text-primary);">{{ item }}</span>
          </span>
        </div>
      </div>
    </section>
  </article>
</template>

<style scoped>
.marquee-mask {
  position: relative;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  overflow: hidden;
  padding: 12px 0;
  background: var(--muted);
  border-radius: 9999px;
  mask-image: linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%);
}

.marquee-track {
  display: inline-flex;
  align-items: center;
  gap: 36px;
  white-space: nowrap;
  animation: marquee-scroll 28s linear infinite;
  will-change: transform;
}

.marquee-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.marquee-dot {
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: var(--accent);
  flex-shrink: 0;
}

.marquee-track:hover {
  animation-play-state: paused;
}

@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-25%); }
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
}
</style>
