<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Search, X, FileText, Hash, Clock, FolderOpen } from 'lucide-vue-next'
import { data as postsData } from '../data/posts.data'
import type { PostDetail } from '../types/blog'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const posts = postsData as PostDetail[]

// ---------- search index ----------
interface SearchResult {
  slug: string
  title: string
  titleHL: string
  description: string
  descHL: string
  snippet: string
  snippetHL: string
  tags: string[]
  category: string
  date: string
  url: string
  score: number
}

const query = ref('')
const results = ref<SearchResult[]>([])
const selectedIdx = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLDivElement | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

// ---------- helpers ----------
function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\p{P}]+/gu, ' ').trim()
}

function highlightText(text: string, term: string): string {
  if (!term) return escapeHtml(text)
  const regex = new RegExp(`(${escapeRegex(term)})`, 'giu')
  return escapeHtml(text).replace(regex, '<mark class="search-hl">$1</mark>')
}

function escapeHtml(s: string): string {
  return s.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;')
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

function extractSnippet(text: string, term: string, len = 120): string {
  const idx = normalize(text).indexOf(normalize(term))
  if (idx === -1) return text.slice(0, len) + (text.length > len ? '...' : '')
  const start = Math.max(0, idx - 40)
  const end = Math.min(text.length, idx + term.length + len)
  let snip = text.slice(start, end)
  if (start > 0) snip = '...' + snip
  if (end < text.length) snip = snip + '...'
  return snip
}

// ---------- search ----------
function doSearch() {
  const q = query.value.trim()
  if (!q || q.length < 1) {
    results.value = []
    return
  }
  const qNorm = normalize(q)
  const scored = posts
    .map((p) => {
      let score = 0
      const titleNorm = normalize(p.title)
      const descNorm = normalize(p.description || '')
      const bodyNorm = normalize(p.markdown || '')

      if (titleNorm.includes(qNorm)) score += 100
      if (titleNorm.startsWith(qNorm)) score += 50
      if (descNorm.includes(qNorm)) score += 40
      if (bodyNorm.includes(qNorm)) score += 20

      // tag match
      const matchedTag = p.tags.some((t) => normalize(t).includes(qNorm))
      if (matchedTag) score += 60

      return { post: p, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map((r) => {
      const post = r.post
      return {
        slug: post.slug,
        title: post.title,
        titleHL: highlightText(post.title, q),
        description: post.description || '',
        descHL: highlightText(post.description || '', q),
        snippet: extractSnippet(post.markdown || '', q),
        snippetHL: highlightText(extractSnippet(post.markdown || '', q), q),
        tags: post.tags,
        category: post.category,
        date: post.date,
        url: post.url,
        score: r.score,
      }
    })

  results.value = scored
  selectedIdx.value = 0
}

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doSearch, 150)
}

// ---------- keyboard ----------
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIdx.value = Math.min(selectedIdx.value + 1, results.value.length - 1)
    scrollToSelected()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIdx.value = Math.max(selectedIdx.value - 1, 0)
    scrollToSelected()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const r = results.value[selectedIdx.value]
    if (r) navigateTo(r.url)
  }
}

function scrollToSelected() {
  nextTick(() => {
    const el = listRef.value?.querySelector('[data-selected="true"]') as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

function navigateTo(url: string) {
  close()
  window.location.href = url
}

// ---------- open / close ----------
function close() {
  emit('update:modelValue', false)
}

function onBackdrop(e: MouseEvent) {
  if ((e.target as HTMLElement).dataset.backdrop === 'true') {
    close()
  }
}

watch(() => query.value, onInput)

// global cmd+k / ctrl+k
function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    emit('update:modelValue', true)
  }
  if (e.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onGlobalKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="search-fade">
      <div
        v-if="modelValue"
        class="search-backdrop"
        data-backdrop="true"
        @click="onBackdrop"
        @keydown="onKeydown"
      >
        <div class="search-modal" role="dialog" aria-label="搜索文章">
          <!-- input -->
          <div class="search-input-wrap">
            <Search class="h-4 w-4 shrink-0" style="color: var(--text-tertiary);" aria-hidden="true" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="search-input"
              placeholder="搜索文章标题、内容、标签..."
              autocomplete="off"
              aria-label="搜索关键词"
            />
            <kbd class="search-kbd">Esc</kbd>
          </div>

          <!-- results -->
          <div v-if="results.length > 0" ref="listRef" class="search-results" role="listbox">
            <button
              v-for="(r, i) in results"
              :key="r.slug"
              :data-selected="i === selectedIdx"
              class="search-result-item"
              :class="{ 'is-selected': i === selectedIdx }"
              role="option"
              :aria-selected="i === selectedIdx"
              @click="navigateTo(r.url)"
              @mouseenter="selectedIdx = i"
            >
              <!-- title -->
              <div class="flex items-start gap-2">
                <FileText class="h-3.5 w-3.5 mt-0.5 shrink-0" style="color: var(--text-tertiary);" aria-hidden="true" />
                <span class="sr-title" v-html="r.titleHL" />
              </div>

              <!-- snippet -->
              <p v-if="r.snippet" class="sr-snippet" v-html="r.snippetHL" />

              <!-- meta -->
              <div class="sr-meta">
                <span v-if="r.category" class="sr-meta-item">
                  <FolderOpen class="h-3 w-3" aria-hidden="true" />
                  {{ r.category }}
                </span>
                <span class="sr-meta-item">
                  <Clock class="h-3 w-3" aria-hidden="true" />
                  {{ r.date }}
                </span>
                <span v-for="tag in r.tags.slice(0, 3)" :key="tag" class="sr-tag">
                  <Hash class="h-2.5 w-2.5" aria-hidden="true" />
                  {{ tag }}
                </span>
              </div>
            </button>
          </div>

          <!-- empty -->
          <div v-else-if="query.trim().length > 0" class="search-empty">
            <X class="h-5 w-5 mx-auto" style="color: var(--text-tertiary);" aria-hidden="true" />
            <p class="mt-2 text-[13px]" style="color: var(--text-secondary);">未找到匹配的文章</p>
            <p class="mt-0.5 text-[11px]" style="color: var(--text-tertiary);">尝试其他关键词</p>
          </div>

          <!-- hint -->
          <div v-else class="search-hint">
            <p class="text-[12px]" style="color: var(--text-tertiary);">
              <kbd class="inline-kbd">↑</kbd> <kbd class="inline-kbd">↓</kbd> 导航 &nbsp;
              <kbd class="inline-kbd">Enter</kbd> 打开 &nbsp;
              <kbd class="inline-kbd">Esc</kbd> 关闭
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ---------- backdrop ---------- */
.search-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  padding-top: 16vh;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
}

.search-modal {
  width: min(90vw, 560px);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid var(--ink-200);
  background: var(--paper);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

/* ---------- input ---------- */
.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--ink-100);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--text-primary);
  font-family: inherit;
}
.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-kbd {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  font-size: 10.5px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-tertiary);
  border: 1px solid var(--ink-200);
  border-radius: 4px;
  background: var(--muted);
  flex-shrink: 0;
}

/* ---------- results ---------- */
.search-results {
  overflow-y: auto;
  max-height: calc(70vh - 52px);
  padding: 6px;
}

.search-result-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
}
.search-result-item.is-selected,
.search-result-item:hover {
  background: var(--muted);
}

.sr-title {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-primary);
}

.sr-snippet {
  margin-top: 4px;
  margin-left: 22px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.sr-meta {
  margin-top: 5px;
  margin-left: 22px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.sr-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.sr-tag {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 1px 6px;
  font-size: 10px;
  border-radius: 3px;
  background: var(--muted);
  border: 1px solid var(--ink-100);
}

/* ---------- highlight ---------- */
:deep(.search-hl) {
  background: rgba(245, 158, 11, 0.25);
  color: var(--text-primary);
  border-radius: 2px;
  padding: 0 1px;
}

/* ---------- empty / hint ---------- */
.search-empty,
.search-hint {
  padding: 28px 14px 22px;
  text-align: center;
}

.inline-kbd {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-tertiary);
  border: 1px solid var(--ink-200);
  border-radius: 3px;
}

/* ---------- transitions ---------- */
.search-fade-enter-active { transition: opacity 0.15s ease; }
.search-fade-leave-active { transition: opacity 0.1s ease; }
.search-fade-enter-from,
.search-fade-leave-to { opacity: 0; }
</style>
