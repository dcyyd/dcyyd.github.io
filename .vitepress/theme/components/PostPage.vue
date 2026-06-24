<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Clock, CalendarDays, AlertTriangle, ArrowLeft, ArrowRight, Tag, Hash, Eye } from 'lucide-vue-next'
import { data as postsData } from '../data/posts.data'
import type { PostDetail } from '../types/blog'
import { tagToSlug } from '../utils/slug'
import { formatViewCount, formatWordCount, incrementViewCount } from '../utils/viewCount'
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

// ====== 访问量（客户端 +1，session 内去重） ======
const viewCount = ref(0)

// ====== 生命周期 ======
onMounted(() => {
  window.addEventListener('scroll', updateProgress, { passive: true })
  window.addEventListener('scroll', updateActiveToc, { passive: true })
  updateProgress()
  extractToc()
  // 累计访问量（同一会话同篇文章只 +1 一次）
  if (props.slug) viewCount.value = incrementViewCount(props.slug)
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
              <!-- 访问量 -->
              <span class="inline-flex items-center gap-1.5">
                <Eye class="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                <span class="mono-num" :title="`本站累计 ${viewCount} 次浏览（本机统计）`">
                  {{ formatViewCount(viewCount) }} 次浏览
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
