<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Clock, CalendarDays, AlertTriangle, ArrowLeft, ArrowRight, Tag, Hash, Eye } from 'lucide-vue-next'
import { data as postsData } from '../data/posts.data'
import type { PostDetail } from '../types/blog'
import { tagToSlug } from '../utils/slug'
import { formatWordCount } from '../utils/viewCount'
import MarkdownRenderer from './MarkdownRenderer.vue'

const props = defineProps<{
  slug: string
}>()

const posts = postsData as PostDetail[]
const post = computed(() => posts.find((item) => item.slug === props.slug))

// ====== 阅读进度 ======
const progress = ref(0)
const readingProgress = ref(0)

function updateProgress(): void {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  progress.value = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0
  // 进度条视觉宽度 (0-100)
  readingProgress.value = progress.value
}

// ====== TOC 提取 ======
interface TocItem {
  id: string
  text: string
  level: number
}

const tocItems = ref<TocItem[]>([])
const activeTocId = ref('')

function extractToc(): void {
  requestAnimationFrame(() => {
    const headings = document.querySelectorAll('.blog-prose h2, .blog-prose h3')
    const items: TocItem[] = []
    headings.forEach((h, index) => {
      const id = h.id || `heading-${index}`
      if (!h.id) h.id = id
      items.push({
        id,
        text: h.textContent || '',
        level: h.tagName === 'H2' ? 2 : 3
      })
    })
    tocItems.value = items
  })
}

function updateActiveToc(): void {
  const headings = document.querySelectorAll('.blog-prose h2[id], .blog-prose h3[id]')
  let current = ''
  headings.forEach((h) => {
    const rect = h.getBoundingClientRect()
    if (rect.top <= 120) {
      current = h.id
    }
  })
  activeTocId.value = current
}

function scrollToHeading(id: string): void {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ====== 访问量（busuanzi 统计） ======
const mounted = ref(false)

// ====== CC 协议信息 ======
const licenseUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return window.location.href
})

// ====== 生命周期 ======
onMounted(() => {
  mounted.value = true
  window.addEventListener('scroll', updateProgress, { passive: true })
  window.addEventListener('scroll', updateActiveToc, { passive: true })
  updateProgress()
  extractToc()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress)
  window.removeEventListener('scroll', updateActiveToc)
})
</script>

<template>
  <article v-if="post" class="relative mx-auto max-w-[90rem]">
    <!-- ====== 阅读进度条 ====== -->
    <div
      class="reading-progress fixed top-0 left-0 z-50 h-[3px] pointer-events-none"
      :style="{ width: readingProgress + '%', background: 'var(--accent, #10b981)' }"
      aria-hidden="true"
    />

    <div class="flex justify-center">
      <!-- ====== 主内容区 ====== -->
      <div class="w-full max-w-3xl px-4 sm:px-6">
        <!-- ====== HERO ====== -->
        <header class="animate-fade-up pt-16 pb-10 sm:pt-20 sm:pb-12 border-b" style="border-color: var(--ink-200);">
          <!-- 封面图 -->
          <div v-if="post.cover" class="mb-8 overflow-hidden rounded-xl border" style="border-color: var(--ink-200);">
            <img
              :src="post.cover"
              :alt="post.title"
              class="w-full h-auto object-cover aspect-video"
              loading="eager"
            />
          </div>

          <!-- 面包屑 -->
          <div class="flex items-center gap-2 mb-5 text-[11px] font-medium" style="color: var(--text-tertiary);">
            <a href="/blog" class="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--accent)]">
              <ArrowLeft class="h-3 w-3" aria-hidden="true" />
              博客
            </a>
            <span aria-hidden="true" class="opacity-40">/</span>
            <a
              v-if="post.category"
              :href="`/categories/${tagToSlug(post.category)}`"
              class="transition-colors hover:text-[var(--accent)]"
            >
              {{ post.category }}
            </a>
            <span v-else class="opacity-60">文章</span>
          </div>

          <!-- 标题 -->
          <h1
            class="serif-title text-balance text-[2.25rem] leading-[1.06] tracking-tight sm:text-[3rem] lg:text-[3.5rem]"
            style="color: var(--text-primary);"
          >
            {{ post.title }}
          </h1>

          <!-- 描述 -->
          <p
            v-if="post.description"
            class="mt-5 text-[16px] leading-[1.8] max-w-[60ch]"
            style="color: var(--text-secondary);"
          >
            {{ post.description }}
          </p>

          <!-- 元信息卡片 -->
          <div class="flex flex-wrap items-center gap-x-6 gap-y-3 mt-7">
            <div class="flex items-center gap-4 text-[12.5px]" style="color: var(--text-tertiary);">
              <!-- 日期 -->
              <time :datetime="post.isoDate" class="inline-flex items-center gap-1.5 font-medium">
                <CalendarDays class="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                {{ post.date }}
              </time>
              <!-- 阅读时长 -->
              <span class="inline-flex items-center gap-1.5">
                <Clock class="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                <span class="mono-num">{{ post.readingTime }} 分钟阅读</span>
              </span>
              <!-- 字数 -->
              <span class="inline-flex items-center gap-1.5">
                <Hash class="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                <span class="mono-num">{{ formatWordCount(post.wordCount) }} 字</span>
              </span>
              <!-- 访问量（busuanzi 统计） -->
              <span v-if="mounted" class="inline-flex items-center gap-1.5">
                <Eye class="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                <span class="mono-num">
                  <span id="busuanzi_page_pv">加载中...</span> 次浏览
                </span>
              </span>
            </div>

            <!-- 降级标记 -->
            <span
              v-if="!post.hasFrontmatter"
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
              style="background: rgba(180,83,9,0.08); color: #b45309; border: 1px solid rgba(180,83,9,0.2);"
            >
              <AlertTriangle class="h-3 w-3" aria-hidden="true" />
              降级元数据
            </span>
          </div>

          <!-- Tags -->
          <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap items-center gap-2 mt-6">
            <Tag class="h-3.5 w-3.5 opacity-50" style="color: var(--text-tertiary);" aria-hidden="true" />
            <a
              v-for="tag in post.tags"
              :key="tag"
              :href="`/tags/${tagToSlug(tag)}`"
              class="tag-pill inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium transition-all duration-200 border border-solid"
              style="border-color: var(--ink-200); color: var(--text-secondary); background: var(--paper);"
            >
              {{ tag }}
            </a>
          </div>
        </header>

        <!-- ====== 正文 ====== -->
        <div class="blog-prose pt-10 pb-10">
          <MarkdownRenderer :root="post.content" />
        </div>

        <!-- ====== CC BY-NC-ND 4.0 版权声明 ====== -->
        <section
          class="license-block mb-10 overflow-hidden rounded-xl border border-solid"
          style="border-color: var(--ink-200); background: var(--paper);"
        >
          <!-- 协议头部 -->
          <div
            class="flex items-center gap-3 px-6 py-4 border-b border-solid"
            style="border-color: var(--ink-150); background: linear-gradient(135deg, var(--muted) 0%, var(--paper) 100%);"
          >
            <div
              class="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style="background: var(--accent); color: #fff;"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <path d="M14.83 14.83a4 4 0 1 1 0-5.66"/>
              </svg>
            </div>
            <div>
              <h4 class="text-[13px] font-semibold leading-snug" style="color: var(--text-primary);">
                版权声明 &middot; CC BY-NC-ND 4.0
              </h4>
              <p class="text-[11px] mt-0.5" style="color: var(--text-tertiary);">
                署名-非商业性使用-禁止演绎 4.0 国际
              </p>
            </div>
          </div>

          <!-- 协议内容 -->
          <div class="px-6 py-5 space-y-4 text-[13px] leading-relaxed">
            <!-- 版权归属 -->
            <div class="flex items-start gap-3">
              <span
                class="inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0 mt-0.5"
                style="background: var(--muted); color: var(--text-tertiary); font-size: 11px;"
                aria-hidden="true"
              >1</span>
              <div>
                <span class="font-semibold" style="color: var(--text-primary);">版权归属</span>
                <p class="mt-1" style="color: var(--text-secondary);">
                  本作品著作权归 <strong style="color: var(--text-primary);">{{ post.author || '窦长友' }}</strong> 所有，
                  首次发布于
                  <a
                    :href="licenseUrl"
                    class="break-all transition-colors duration-200 hover:text-[var(--accent)]"
                    style="color: var(--accent); text-decoration: underline; text-underline-offset: 3px;"
                    rel="bookmark"
                  >{{ licenseUrl }}</a>
                  ，受相关知识产权法律法规保护。
                </p>
              </div>
            </div>

            <!-- 授权范围 -->
            <div class="flex items-start gap-3">
              <span
                class="inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0 mt-0.5"
                style="background: var(--muted); color: var(--text-tertiary); font-size: 11px;"
                aria-hidden="true"
              >2</span>
              <div>
                <span class="font-semibold" style="color: var(--text-primary);">授权范围</span>
                <ul class="mt-1.5 space-y-1" style="color: var(--text-secondary); list-style: none; padding: 0;">
                  <li class="flex items-baseline gap-1.5">
                    <span style="color: var(--accent); font-weight: 600;" aria-hidden="true">&#10003;</span>
                    <span>可自由<strong style="color: var(--text-primary);">分享</strong> — 在任何媒介以任何形式复制、转载本文</span>
                  </li>
                  <li class="flex items-baseline gap-1.5">
                    <span style="color: #ef4444; font-weight: 600;" aria-hidden="true">&#10007;</span>
                    <span>不得用于<strong style="color: var(--text-primary);">商业目的</strong> — 未经书面授权禁止商用</span>
                  </li>
                  <li class="flex items-baseline gap-1.5">
                    <span style="color: #ef4444; font-weight: 600;" aria-hidden="true">&#10007;</span>
                    <span>禁止<strong style="color: var(--text-primary);">演绎修改</strong> — 不得改编、转换或以本文为基础再创作</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- 署名要求 -->
            <div class="flex items-start gap-3">
              <span
                class="inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0 mt-0.5"
                style="background: var(--muted); color: var(--text-tertiary); font-size: 11px;"
                aria-hidden="true"
              >3</span>
              <div>
                <span class="font-semibold" style="color: var(--text-primary);">署名要求</span>
                <p class="mt-1" style="color: var(--text-secondary);">
                  转载或引用时须<strong style="color: var(--text-primary);">明确标注作者姓名</strong>、<strong style="color: var(--text-primary);">原文出处</strong>及本许可协议链接。
                  不得以任何方式暗示或声称作者为您的使用背书。
                </p>
              </div>
            </div>

            <!-- 协议链接 -->
            <div
              class="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-dashed"
              style="border-color: var(--ink-150);"
            >
              <a
                href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.zh"
                target="_blank"
                rel="noopener noreferrer license"
                class="license-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 border border-solid"
                style="border-color: var(--ink-200); color: var(--text-secondary); background: var(--paper);"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                查看完整许可证
              </a>
              <a
                href="https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode.zh-Hans"
                target="_blank"
                rel="noopener noreferrer license"
                class="license-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 border border-solid"
                style="border-color: var(--ink-200); color: var(--text-secondary); background: var(--paper);"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="3" y="3" rx="2" ry="2"/><line x1="8" x2="16" y1="12" y2="12"/><line x1="12" x2="12" y1="8" y2="16"/></svg>
                法律文本（英文）
              </a>
            </div>
          </div>
        </section>

        <!-- ====== 评论区 ====== -->
        <CommentSection class="comments-section" />

        <!-- ====== 上下篇导航 ====== -->
        <nav class="pb-20 grid gap-4 sm:grid-cols-2" aria-label="上下篇文章导航">
          <!-- Previous -->
          <a
            v-if="post.previous"
            :href="post.previous.url"
            class="nav-card group flex flex-col justify-between p-5 rounded-xl border border-solid transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg"
            style="border-color: var(--ink-200); background: var(--paper);"
          >
            <span
              class="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style="color: var(--text-tertiary);"
            >
              <ArrowLeft class="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
              上一篇
            </span>
            <strong
              class="block mt-2.5 text-[14.5px] font-medium leading-[1.45] line-clamp-2 transition-colors duration-200 group-hover:text-[var(--accent)]"
              style="color: var(--text-primary);"
            >
              {{ post.previous.title }}
            </strong>
          </a>
          <span
            v-else
            class="nav-card flex flex-col justify-center p-5 rounded-xl border border-dashed"
            style="border-color: var(--ink-200); background: var(--paper); opacity: 0.35;"
            aria-hidden="true"
          >
            <span class="text-[10px] font-semibold uppercase tracking-[0.14em]" style="color: var(--text-tertiary);">上一篇</span>
            <span class="mt-1 text-[13px]" style="color: var(--text-tertiary);">— 第一篇文章 —</span>
          </span>

          <!-- Next -->
          <a
            v-if="post.next"
            :href="post.next.url"
            class="nav-card group flex flex-col justify-between p-5 rounded-xl border border-solid transition-all duration-300 hover:-translate-y-[2px] hover:shadow-lg text-right"
            style="border-color: var(--ink-200); background: var(--paper);"
            :class="post.previous ? '' : 'sm:col-start-2'"
          >
            <span
              class="inline-flex items-center gap-1.5 justify-end w-full text-[10px] font-semibold uppercase tracking-[0.14em]"
              style="color: var(--text-tertiary);"
            >
              下一篇
              <ArrowRight class="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </span>
            <strong
              class="block mt-2.5 text-[14.5px] font-medium leading-[1.45] line-clamp-2 transition-colors duration-200 group-hover:text-[var(--accent)]"
              style="color: var(--text-primary);"
            >
              {{ post.next.title }}
            </strong>
          </a>
          <span
            v-else
            class="nav-card flex flex-col justify-center p-5 rounded-xl border border-dashed text-right"
            style="border-color: var(--ink-200); background: var(--paper); opacity: 0.35;"
            :class="post.previous ? '' : 'sm:col-start-2'"
            aria-hidden="true"
          >
            <span class="text-[10px] font-semibold uppercase tracking-[0.14em]" style="color: var(--text-tertiary);">下一篇</span>
            <span class="mt-1 text-[13px]" style="color: var(--text-tertiary);">— 已是最新 —</span>
          </span>
        </nav>
      </div>

      <!-- ====== 右侧 TOC 桌面端 ====== -->
      <aside
        v-if="tocItems.length > 0"
        class="hidden xl:block w-60 shrink-0 pl-10"
      >
        <nav
          class="toc-sidebar sticky transition-all duration-300"
          :style="{ top: 'calc(var(--vp-nav-height, 64px) + 3.5rem)' }"
          aria-label="文章目录"
        >
          <h4
            class="text-[11px] font-semibold uppercase tracking-[0.14em] mb-4"
            style="color: var(--text-tertiary);"
          >
            目录
          </h4>
          <ul class="space-y-1.5 border-l-2 border-solid" style="border-color: var(--ink-100);">
            <li v-for="item in tocItems" :key="item.id">
              <button
                class="toc-link block w-full text-left py-1 transition-all duration-200 text-[13px] leading-[1.5]"
                :class="[
                  item.level === 3 ? 'pl-5' : 'pl-3',
                  activeTocId === item.id ? 'toc-active font-medium' : ''
                ]"
                :style="{
                  color: activeTocId === item.id ? 'var(--accent)' : 'var(--text-tertiary)',
                  borderLeft: activeTocId === item.id ? '2px solid var(--accent)' : '2px solid transparent',
                  marginLeft: '-2px'
                }"
                @click="scrollToHeading(item.id)"
              >
                {{ item.text }}
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  </article>
</template>

<style scoped>
/* ====== 进度条 ====== */
.reading-progress {
  transition: width 0.15s linear;
  will-change: width;
}

/* ====== 标签徽章 ====== */
.tag-pill:hover {
  border-color: var(--accent) !important;
  color: var(--accent) !important;
  background: rgba(16, 185, 129, 0.06) !important;
  transform: translateY(-1px);
}

/* ====== 协议按钮 ====== */
.license-btn:hover {
  border-color: var(--accent) !important;
  color: var(--accent) !important;
}

/* ====== 导航卡片 ====== */
.nav-card {
  cursor: pointer;
  text-decoration: none;
}

/* ====== TOC 侧边栏 ====== */
.toc-sidebar {
  max-height: calc(100vh - 10rem);
  overflow-y: auto;
}

.toc-link {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  line-height: 1.5;
  transition: color 0.2s ease;
}

.toc-link:hover {
  color: var(--accent) !important;
}

.toc-active {
  color: var(--accent) !important;
}

/* TOC 滚动条 */
.toc-sidebar::-webkit-scrollbar {
  width: 4px;
}

.toc-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.toc-sidebar::-webkit-scrollbar-thumb {
  background: var(--ink-200);
  border-radius: 2px;
}
</style>
