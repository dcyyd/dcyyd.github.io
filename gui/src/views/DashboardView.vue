<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, Type, Eye, Plus, Rocket, History, Activity, Folder, Hash, Clock } from 'lucide-vue-next'
import { usePostsStore } from '../stores'
import { api } from '../api'
import type { PostSummary } from '../api'
import { getViewCount, getWordCount, formatViewCount } from '../utils/wordAndView'

const postsStore = usePostsStore()
const router = useRouter()

const previewRunning = ref(false)
// 浏览量版本号：storage 事件 + 定时轮询
const viewVersion = ref(0)

onMounted(async () => {
  await postsStore.refresh(true)
  try { previewRunning.value = (await api.previewStatus()).running } catch { /* noop */ }
  window.addEventListener('storage', onStorage)
  // 定时轮询：同一标签页内的浏览量变化（storage 事件不会在写入标签页触发）
  startViewPolling()
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorage)
  if (viewPollTimer !== null) {
    window.clearInterval(viewPollTimer)
    viewPollTimer = null
  }
})

function onStorage(e: StorageEvent) {
  if (e.key && e.key.startsWith('fpb:view-counts')) viewVersion.value++
}

let viewPollTimer: number | null = null
function startViewPolling() {
  viewPollTimer = window.setInterval(() => {
    viewVersion.value++
  }, 5000)
}

// ============== 工具 ==============
function titleOf(p: PostSummary): string {
  const t = (p.frontmatter as { title?: unknown })?.title
  return typeof t === 'string' && t ? t : p.slug
}
function isDraft(p: PostSummary): boolean {
  return Boolean((p.frontmatter as { draft?: unknown })?.draft)
}
function categoryOf(p: PostSummary): string {
  const c = (p.frontmatter as { category?: unknown })?.category
  return typeof c === 'string' && c ? c : '未分类'
}
function tagsOf(p: PostSummary): string[] {
  const t = (p.frontmatter as { tags?: unknown })?.tags
  return Array.isArray(t) ? t.filter((x): x is string => typeof x === 'string') : []
}
function relTime(t: number): string {
  if (!t) return '—'
  const diff = Date.now() - t
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} 天前`
  return new Date(t).toLocaleDateString('zh-CN')
}
function fmtNum(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k`
  return `${(n / 10000).toFixed(n % 10000 ? 1 : 0)}w`
}

// ============== 聚合 ==============
const publishedCount = computed(() => postsStore.posts.filter((p) => !isDraft(p)).length)
const totalWords = computed(() => postsStore.posts.reduce((s, p) => s + getWordCount(p.body ?? ''), 0))
const totalViews = computed(() => {
  void viewVersion.value
  return postsStore.posts.reduce((s, p) => s + getViewCount(p.slug), 0)
})

const monthStart = (() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime() })()
const monthlyNew = computed(() => {
  // 优先用 frontmatter.date 字符串 → 转时间；其次 mtime
  return postsStore.posts.filter((p) => {
    const fmd = (p.frontmatter as { date?: unknown })?.date
    if (typeof fmd === 'string' && fmd) {
      const t = new Date(fmd).getTime()
      if (!isNaN(t)) return t >= monthStart
    }
    return p.mtime >= monthStart
  }).length
})

// Top 10 浏览（已移除）
// 分类分布
const categoryStats = computed(() => {
  const map = new Map<string, { count: number; words: number; views: number }>()
  for (const p of postsStore.posts) {
    const c = categoryOf(p)
    const cur = map.get(c) ?? { count: 0, words: 0, views: 0 }
    cur.count++
    cur.words += getWordCount(p.body ?? '')
    cur.views += getViewCount(p.slug)
    map.set(c, cur)
  }
  const list = [...map.entries()].map(([name, stat]) => ({ name, ...stat }))
  list.sort((a, b) => b.count - a.count)
  return list
})
const maxCategoryCount = computed(() => Math.max(1, ...categoryStats.value.map((c) => c.count)))

// 最近 7 天文章数（按 mtime）—— 已移除
// 最近活动
const recentActivity = computed(() => {
  return [...postsStore.posts]
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 8)
    .map((p) => ({ p, views: getViewCount(p.slug) }))
})
</script>

<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <!-- Hero -->
    <div>
      <div class="eyebrow">OVERVIEW · 概览</div>
      <h1 class="serif-title text-4xl mt-1" style="color: var(--text);">
        <span class="italic-serif">FilePress</span> Blog
      </h1>
      <p class="text-sm mt-2" style="color: var(--text-muted); max-width: 540px;">
        管理工作台 · 写作、编辑、预览、发布。无需打开终端，所有操作都在这里完成。
      </p>
    </div>

    <!-- 站点核心指标 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <button class="card-static p-5 text-left hover:border-current transition" @click="router.push('/files')">
        <div class="flex items-center gap-1.5">
          <FileText class="h-3.5 w-3.5" style="color: var(--text-tertiary);" />
          <div class="eyebrow">ARTICLES</div>
        </div>
        <div class="serif-title text-3xl mt-2 mono-num" style="color: var(--accent);">{{ postsStore.posts.length }}</div>
        <div class="text-xs mt-1" style="color: var(--text-muted);">
          <span class="mono-num">{{ publishedCount }}</span> 已发布 · <span class="mono-num">{{ monthlyNew }}</span> 本月新增
        </div>
      </button>
      <div class="card-static p-5">
        <div class="flex items-center gap-1.5">
          <Type class="h-3.5 w-3.5" style="color: var(--text-tertiary);" />
          <div class="eyebrow">WORDS</div>
        </div>
        <div class="serif-title text-3xl mt-2 mono-num">{{ fmtNum(totalWords) }}</div>
        <div class="text-xs mt-1" style="color: var(--text-muted);">中文字 + 英文词</div>
      </div>
      <div class="card-static p-5">
        <div class="flex items-center gap-1.5">
          <Eye class="h-3.5 w-3.5" style="color: var(--text-tertiary);" />
          <div class="eyebrow">VIEWS</div>
        </div>
        <div class="serif-title text-3xl mt-2 mono-num">{{ fmtNum(totalViews) }}</div>
        <div class="text-xs mt-1" style="color: var(--text-muted);">本站累计 · 本机统计</div>
      </div>
      <div class="card-static p-5">
        <div class="flex items-center gap-1.5">
          <Activity class="h-3.5 w-3.5" style="color: var(--text-tertiary);" />
          <div class="eyebrow">PREVIEW</div>
        </div>
        <div class="serif-title text-2xl mt-2 inline-flex items-center gap-2">
          <span :class="previewRunning ? 'text-emerald-500' : 'text-amber-500'">●</span>
          <span>{{ previewRunning ? '运行中' : '未启动' }}</span>
        </div>
        <div class="text-xs mt-1" style="color: var(--text-muted);">localhost:5173</div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <button class="card-static p-4 text-left hover:border-current transition" @click="router.push('/editor')">
        <Plus class="h-4 w-4" style="color: var(--accent);" />
        <div class="font-semibold mt-1.5 text-sm">新建文章</div>
        <div class="text-xs mt-0.5" style="color: var(--text-muted);">打开编辑器</div>
      </button>
      <button class="card-static p-4 text-left hover:border-current transition" @click="router.push('/deploy')">
        <Rocket class="h-4 w-4" style="color: var(--accent);" />
        <div class="font-semibold mt-1.5 text-sm">一键部署</div>
        <div class="text-xs mt-0.5" style="color: var(--text-muted);">发布到远程</div>
      </button>
      <button class="card-static p-4 text-left hover:border-current transition" @click="router.push('/files')">
        <Folder class="h-4 w-4" style="color: var(--accent);" />
        <div class="font-semibold mt-1.5 text-sm">文件管理</div>
        <div class="text-xs mt-0.5" style="color: var(--text-muted);">批量 / 筛选</div>
      </button>
      <button class="card-static p-4 text-left hover:border-current transition" @click="router.push('/help')">
        <History class="h-4 w-4" style="color: var(--accent);" />
        <div class="font-semibold mt-1.5 text-sm">日志 / 帮助</div>
        <div class="text-xs mt-0.5" style="color: var(--text-muted);">查看记录</div>
      </button>
    </div>

    <!-- 分类分布 + 最近活动 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="card-static p-5">
        <div class="flex items-center gap-1.5 mb-3">
          <Hash class="h-3.5 w-3.5" style="color: var(--text-tertiary);" />
          <div class="eyebrow">CATEGORIES · 分类分布</div>
        </div>
        <div v-if="categoryStats.length === 0" class="empty">
          <div class="text-2xl mb-1" style="opacity: 0.4;">∅</div>
          <div class="text-xs">暂无分类数据</div>
        </div>
        <ul v-else class="space-y-2">
          <li v-for="c in categoryStats" :key="c.name">
            <div class="flex items-center justify-between text-[12px] mb-1">
              <span class="truncate" style="color: var(--text);">{{ c.name }}</span>
              <span class="mono-num text-[10px]" style="color: var(--text-tertiary);">
                {{ c.count }} 篇 · {{ fmtNum(c.words) }} 字 · {{ fmtNum(c.views) }} 浏览
              </span>
            </div>
            <div class="h-[4px] rounded-full" style="background: var(--muted);">
              <div
                class="h-full rounded-full"
                :style="{
                  width: ((c.count / maxCategoryCount) * 100) + '%',
                  background: 'var(--accent)',
                  opacity: 0.7
                }"
              />
            </div>
          </li>
        </ul>
      </div>

      <div class="card-static p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-1.5">
            <Clock class="h-3.5 w-3.5" style="color: var(--text-tertiary);" />
            <div class="eyebrow">RECENT ACTIVITY · 最近活动</div>
          </div>
          <button class="btn btn-ghost btn-xs" @click="router.push('/files')">查看全部 →</button>
        </div>
        <div v-if="recentActivity.length === 0" class="empty">
          <div class="text-2xl mb-1" style="opacity: 0.4;">∅</div>
          <div class="text-xs">还没有文章</div>
          <button class="btn btn-primary btn-sm mt-3" @click="router.push('/editor')">+ 创建第一篇</button>
        </div>
        <ol v-else class="relative" style="border-left: 1px solid var(--border); padding-left: 1rem;">
          <li
            v-for="(item, i) in recentActivity"
            :key="item.p.slug"
            class="relative pb-3 last:pb-0 cursor-pointer hover:opacity-80"
            @click="router.push(`/editor/${encodeURIComponent(item.p.slug)}`)"
          >
            <span
              class="absolute -left-[1.375rem] top-1 w-2 h-2 rounded-full"
              :style="{
                background: i === 0 ? 'var(--accent)' : 'var(--muted)',
                boxShadow: i === 0 ? '0 0 0 4px rgba(99,102,241,0.18)' : 'none'
              }"
            />
            <div class="flex items-center gap-2">
              <span class="text-[12.5px] font-semibold truncate" style="color: var(--text);">
                {{ titleOf(item.p) }}
              </span>
              <span v-if="isDraft(item.p)" class="badge badge-yellow text-[9px]">草稿</span>
            </div>
            <div class="text-[10.5px] mt-0.5 mono-num" style="color: var(--text-tertiary);">
              {{ relTime(item.p.mtime) }} · {{ item.p.slug }}
            </div>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>
