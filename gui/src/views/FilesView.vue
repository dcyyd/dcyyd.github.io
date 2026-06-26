<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowUpDown, Eye, Hash, Trash2, Square, CheckSquare, RotateCcw, Search } from 'lucide-vue-next'
import { usePostsStore, useToastStore } from '../stores'
import type { PostSummary } from '../api'
import { getViewCount, getWordCount } from '../utils/wordAndView'

const postsStore = usePostsStore()
const router = useRouter()
const toast = useToastStore()

const search = ref('')
const tagFilter = ref('')
const categoryFilter = ref('')
const draftFilter = ref<'all' | 'draft' | 'published'>('all')
const sort = ref<'mtime' | 'title' | 'size' | 'words' | 'views'>('mtime')
const asc = ref(false)
const selected = ref<Set<string>>(new Set())

// 视图统计版本：每次刷新/恢复浏览量后 +1，触发重算
const viewVersion = ref(0)

onMounted(() => postsStore.refresh(true))

// ============== 标签/分类聚合 ==============
function getTags(p: PostSummary): string[] {
  const t = (p.frontmatter as { tags?: unknown })?.tags
  return Array.isArray(t) ? t.filter((x): x is string => typeof x === 'string') : []
}
function getCategory(p: PostSummary): string {
  const c = (p.frontmatter as { category?: unknown })?.category
  return typeof c === 'string' ? c : ''
}
function getTitle(p: PostSummary): string {
  const t = (p.frontmatter as { title?: unknown })?.title
  return typeof t === 'string' && t ? t : p.slug
}
function isDraft(p: PostSummary): boolean {
  return Boolean((p.frontmatter as { draft?: unknown })?.draft)
}

const allTags = computed(() => {
  const set = new Set<string>()
  for (const p of postsStore.posts) for (const t of getTags(p)) set.add(t)
  return [...set].sort()
})
const allCategories = computed(() => {
  const set = new Set<string>()
  for (const p of postsStore.posts) {
    const c = getCategory(p)
    if (c) set.add(c)
  }
  return [...set].sort()
})

// ============== 过滤 + 排序 ==============
const filtered = computed(() => {
  let list = postsStore.posts.slice()
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter((p) =>
      p.slug.toLowerCase().includes(s) ||
      getTitle(p).toLowerCase().includes(s) ||
      (getTags(p).some((t) => t.toLowerCase().includes(s)))
    )
  }
  if (tagFilter.value) {
    list = list.filter((p) => getTags(p).includes(tagFilter.value))
  }
  if (categoryFilter.value) {
    list = list.filter((p) => getCategory(p) === categoryFilter.value)
  }
  if (draftFilter.value === 'draft') list = list.filter(isDraft)
  else if (draftFilter.value === 'published') list = list.filter((p) => !isDraft(p))

  list.sort((a, b) => {
    let diff = 0
    if (sort.value === 'mtime') diff = a.mtime - b.mtime
    else if (sort.value === 'title') diff = getTitle(a).localeCompare(getTitle(b))
    else if (sort.value === 'size') diff = a.size - b.size
    else if (sort.value === 'words') diff = getWordCount(a.body ?? '') - getWordCount(b.body ?? '')
    else if (sort.value === 'views') diff = getViewCount(a.slug) - getViewCount(b.slug)
    return asc.value ? diff : -diff
  })
  return list
})

// 排序变化时清空选择（避免不同列表混用）
watch(sort, () => selected.value.clear())
watch([tagFilter, categoryFilter, draftFilter], () => selected.value.clear())

// ============== 选择 / 批量操作 ==============
const allSelected = computed(() => {
  if (filtered.value.length === 0) return false
  return filtered.value.every((p) => selected.value.has(p.slug))
})
const someSelected = computed(() => filtered.value.some((p) => selected.value.has(p.slug)))

function toggleOne(slug: string) {
  const next = new Set(selected.value)
  if (next.has(slug)) next.delete(slug)
  else next.add(slug)
  selected.value = next
}
function toggleAll() {
  const next = new Set(selected.value)
  if (allSelected.value) for (const p of filtered.value) next.delete(p.slug)
  else for (const p of filtered.value) next.add(p.slug)
  selected.value = next
}
function clearSelection() { selected.value = new Set() }

async function batchDelete() {
  const slugs = [...selected.value]
  if (slugs.length === 0) return
  if (!confirm(`确定删除选中的 ${slugs.length} 篇文章？此操作不可恢复。`)) return
  let ok = 0
  let fail = 0
  for (const s of slugs) {
    try { await postsStore.deletePost(s); ok++ }
    catch { fail++ }
  }
  toast.success(`批量删除完成：成功 ${ok} 篇${fail ? `，失败 ${fail} 篇` : ''}`)
  selected.value = new Set()
}

async function batchSetDraft(draft: boolean) {
  const slugs = [...selected.value]
  if (slugs.length === 0) return
  let ok = 0
  let fail = 0
  for (const s of slugs) {
    try {
      const r = await postsStore.getPost(s)
      const fm = { ...(r.frontmatter ?? {}), draft }
      await postsStore.updatePost(s, { frontmatter: fm, body: r.body ?? '' })
      ok++
    } catch { fail++ }
  }
  toast.success(`批量${draft ? '标记为草稿' : '发布'}完成：成功 ${ok} 篇${fail ? `，失败 ${fail} 篇` : ''}`)
  selected.value = new Set()
}

// ============== 单行操作 ==============
function open(slug: string) { router.push(`/editor/${encodeURIComponent(slug)}`) }
function create() { router.push('/editor') }

async function remove(slug: string) {
  if (!confirm(`确定删除「${slug}」？`)) return
  try {
    await postsStore.deletePost(slug)
    selected.value.delete(slug)
    toast.success('已删除')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : String(e))
  }
}

// ============== 格式化 ==============
function dateStr(t: number) {
  if (!t) return '—'
  return new Date(t).toISOString().slice(0, 10)
}
function sizeStr(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}
function fmtNum(n: number) {
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k`
  return `${(n / 10000).toFixed(n % 10000 ? 1 : 0)}w`
}

// ============== 聚合统计 ==============
const totalSize = computed(() => postsStore.posts.reduce((s, p) => s + p.size, 0))
const totalWords = computed(() => postsStore.posts.reduce((s, p) => s + getWordCount(p.body ?? ''), 0))
const totalViews = computed(() => {
  void viewVersion.value
  return postsStore.posts.reduce((s, p) => s + getViewCount(p.slug), 0)
})

// 监听 localStorage 变化（其它页面增加访问量时同步过来）
function onStorage(e: StorageEvent) {
  if (e.key && e.key.startsWith('fpb:view-counts')) viewVersion.value++
}

let viewPollTimer: number | null = null

onMounted(() => {
  window.addEventListener('storage', onStorage)
  // 定时轮询：同一标签页内的浏览量变化
  viewPollTimer = window.setInterval(() => {
    viewVersion.value++
  }, 5000)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorage)
  if (viewPollTimer !== null) {
    window.clearInterval(viewPollTimer)
    viewPollTimer = null
  }
})
</script>

<template>
  <div class="p-8 max-w-6xl mx-auto space-y-5">
    <!-- 顶部统计 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="card-static p-4">
        <div class="eyebrow">ARTICLES</div>
        <div class="serif-title text-2xl mt-1 mono-num">{{ postsStore.posts.length }}</div>
        <div class="text-[10.5px] mt-1" style="color: var(--text-tertiary);">含 {{
          postsStore.posts.filter(isDraft).length }} 草稿</div>
      </div>
      <div class="card-static p-4">
        <div class="eyebrow">TOTAL WORDS</div>
        <div class="serif-title text-2xl mt-1 mono-num">{{ fmtNum(totalWords) }}</div>
        <div class="text-[10.5px] mt-1" style="color: var(--text-tertiary);">中文字 + 英文词</div>
      </div>
      <div class="card-static p-4">
        <div class="eyebrow">TOTAL VIEWS</div>
        <div class="serif-title text-2xl mt-1 mono-num">{{ fmtNum(totalViews) }}</div>
        <div class="text-[10.5px] mt-1" style="color: var(--text-tertiary);">本站累计 · 本机统计</div>
      </div>
      <div class="card-static p-4 flex flex-col items-end gap-2 justify-end">
        <div class="text-[10.5px] mono-num" style="color: var(--text-tertiary);">总大小 {{ sizeStr(totalSize) }}</div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" @click="postsStore.refresh(true)">↻ 刷新</button>
          <button class="btn btn-primary btn-sm" @click="create">+ 新建</button>
        </div>
      </div>
    </div>

    <!-- 筛选：搜索 + 分类/标签/状态多维筛选 一行布局 -->
    <div class="card-static p-3 flex flex-wrap items-center gap-2">
      <div class="relative flex-1 min-w-[200px]">
        <input v-model="search" class="input pl-7" placeholder="搜索 slug / 标题 / 标签…" />
      </div>
      <select v-model="categoryFilter" class="select !w-auto flex-shrink-0" title="按分类筛选">
        <option value="">全部分类</option>
        <option v-for="c in allCategories" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="tagFilter" class="select !w-auto flex-shrink-0" title="按标签筛选">
        <option value="">所有标签</option>
        <option v-for="t in allTags" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="draftFilter" class="select !w-auto flex-shrink-0" title="按状态筛选">
        <option value="all">全部状态</option>
        <option value="published">已发布</option>
        <option value="draft">仅草稿</option>
      </select>
      <select v-model="sort" class="select !w-auto flex-shrink-0" title="排序方式">
        <option value="mtime">按修改时间</option>
        <option value="title">按标题</option>
        <option value="size">按大小</option>
        <option value="words">按字数</option>
        <option value="views">按浏览量</option>
      </select>
      <button class="btn btn-ghost btn-sm inline-flex items-center gap-1 flex-shrink-0" @click="asc = !asc">
        <ArrowUpDown class="h-3.5 w-3.5" /> {{ asc ? '升序' : '降序' }}
      </button>
    </div>

    <!-- 批量操作栏 -->
    <transition name="slide-down">
      <div v-if="someSelected" class="card-static px-4 py-2.5 flex items-center gap-3 text-sm"
        style="border-color: var(--accent); background: rgba(99,102,241,0.06);">
        <span style="color: var(--accent);" class="font-semibold">已选 {{ selected.size }} 篇</span>
        <span class="text-xs" style="color: var(--text-tertiary);">（仅对当前过滤后的列表生效）</span>
        <div class="ml-auto flex items-center gap-2">
          <button class="btn btn-sm" @click="batchSetDraft(false)">批量发布</button>
          <button class="btn btn-sm" @click="batchSetDraft(true)">批量标草稿</button>
          <button class="btn btn-sm btn-danger" @click="batchDelete">
            <Trash2 class="h-3.5 w-3.5" /> 批量删除
          </button>
          <button class="btn btn-ghost btn-sm" @click="clearSelection">取消</button>
        </div>
      </div>
    </transition>

    <!-- 列表 -->
    <div class="card-static overflow-hidden">
      <table class="tbl">
        <thead>
          <tr>
            <th class="w-[40px]">
              <button class="btn btn-ghost btn-xs" @click="toggleAll" :title="allSelected ? '取消全选' : '全选当前页'">
                <CheckSquare v-if="allSelected" class="h-3.5 w-3.5" style="color: var(--accent);" />
                <Square v-else class="h-3.5 w-3.5" />
              </button>
            </th>
            <th>标题</th>
            <th class="w-[100px]">分类</th>
            <th class="w-[100px]">日期</th>
            <th class="w-[80px] text-right">字数</th>
            <th class="w-[70px] text-right">浏览</th>
            <th class="w-[60px] text-right">大小</th>
            <th class="w-[70px]">状态</th>
            <th class="w-[1%]"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.slug" class="cursor-pointer transition" :style="{
            background: selected.has(p.slug) ? 'rgba(99,102,241,0.06)' : 'transparent'
          }" @click="open(p.slug)">
            <td @click.stop>
              <button class="btn btn-ghost btn-xs" @click="toggleOne(p.slug)">
                <CheckSquare v-if="selected.has(p.slug)" class="h-3.5 w-3.5" style="color: var(--accent);" />
                <Square v-else class="h-3.5 w-3.5" />
              </button>
            </td>
            <td>
              <div class="font-semibold truncate max-w-[420px]" :title="getTitle(p)" style="color: var(--text);">
                {{ getTitle(p) }}
              </div>
              <div class="text-xs mt-0.5 flex items-center gap-1" style="color: var(--text-muted);">
                <span class="mono-num">{{ p.slug }}</span>
                <span v-for="t in getTags(p)" :key="t" class="badge badge-outline text-[10px]">#{{ t }}</span>
              </div>
            </td>
            <td class="text-xs" style="color: var(--text-muted);">
              <span v-if="getCategory(p)">{{ getCategory(p) }}</span>
              <span v-else style="opacity: 0.4;">—</span>
            </td>
            <td class="mono-num text-xs" style="color: var(--text-muted);">{{ dateStr(p.mtime) }}</td>
            <td class="mono-num text-xs text-right" style="color: var(--text-secondary);">
              <span class="inline-flex items-center gap-1" :title="`共 ${getWordCount(p.body ?? '')} 字`">
                <Hash class="h-3 w-3 opacity-50" /> {{ fmtNum(getWordCount(p.body ?? '')) }}
              </span>
            </td>
            <td class="mono-num text-xs text-right" style="color: var(--text-secondary);">
              <span class="inline-flex items-center gap-1" :title="`${getViewCount(p.slug)} 次浏览`">
                <Eye class="h-3 w-3 opacity-50" /> {{ fmtNum(getViewCount(p.slug)) }}
              </span>
            </td>
            <td class="mono-num text-xs text-right" style="color: var(--text-muted);">{{ sizeStr(p.size) }}</td>
            <td>
              <span v-if="isDraft(p)" class="badge badge-yellow">草稿</span>
              <span v-else class="badge badge-green">已发布</span>
            </td>
            <td @click.stop>
              <button class="btn btn-ghost btn-xs" title="删除" @click="remove(p.slug)">
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filtered.length === 0" class="empty">
        <div class="text-2xl mb-2" style="opacity: 0.4;">∅</div>
        <div>暂无匹配的文章</div>
        <button v-if="search || tagFilter || categoryFilter || draftFilter !== 'all'" class="btn btn-ghost btn-sm mt-3"
          @click="search = ''; tagFilter = ''; categoryFilter = ''; draftFilter = 'all'">
          <RotateCcw class="h-3 w-3" /> 清空筛选
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 100px;
}
</style>
