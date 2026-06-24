<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Clock, FileText, Type, Hash, ListTree, Code2, Workflow, Save, Trash2, RotateCcw, Wand2 } from 'lucide-vue-next'
import { usePostsStore, useToastStore } from '../stores'
import { renderMarkdown } from '../utils/markdown'
import { calculateEditorStats, extractOutline } from '../utils/editorStats'
import type { PostSummary } from '../api'
import type { EditorStats, OutlineItem } from '../utils/editorStats'
import mermaid from 'mermaid'

const route = useRoute()
const router = useRouter()
const postsStore = usePostsStore()
const toast = useToastStore()

const slug = computed(() => (route.params.slug as string) || '')
const isNew = computed(() => !slug.value)

const loading = ref(false)
const saving = ref(false)
const dirty = ref(false)

interface Frontmatter { title: string; date: string; tags: string[]; category: string; draft: boolean; description: string; [k: string]: unknown }
const frontmatter = ref<Frontmatter>({
  title: '',
  date: new Date().toISOString().slice(0, 10),
  tags: [],
  category: '',
  draft: false,
  description: ''
})
const body = ref('')
const tagsInput = ref('')

const titleForView = computed(() => {
  if (isNew.value) return '新建文章'
  return frontmatter.value.title || slug.value
})

// ============== 防抖渲染：避免每次按键同步解析 Markdown 阻塞主线程 ==============
const DEBOUNCE_MS = 150

const previewHtml = ref('')
const stats = ref<EditorStats>({ chars: 0, words: 0, chinese: 0, latin: 0, lines: 1, readingTime: 1 })
const outline = ref<OutlineItem[]>([])
const previewUpdating = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function updatePreviewSync() {
  try {
    const text = body.value
    previewHtml.value = renderMarkdown(text)
    stats.value = calculateEditorStats(text)
    outline.value = extractOutline(text)
  } catch (e) {
    console.error('[EditorView] Preview update error:', e)
    previewHtml.value = `<div style="padding:16px;color:#ef4444;border:1px dashed #ef4444;border-radius:6px;font-size:13px;">渲染错误: ${e instanceof Error ? e.message : String(e)}</div>`
  } finally {
    previewUpdating.value = false
  }
}

function schedulePreviewUpdate() {
  previewUpdating.value = true
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(updatePreviewSync, DEBOUNCE_MS)
}

function cancelDebounce() {
  if (debounceTimer !== null) { clearTimeout(debounceTimer); debounceTimer = null }
}

// 初始渲染（body 初始为空，直接同步即可）
updatePreviewSync()

// 监听 body 变化触发防抖更新
watch(body, () => schedulePreviewUpdate(), { flush: 'sync' })

// ============== 自动保存草稿（localStorage） ==============
const DRAFT_KEY = computed(() => `fpb:draft:${slug.value || 'new'}`)
const DRAFT_INTERVAL = 30_000
let draftTimer: number | null = null
const lastSavedDraft = ref<string | null>(null)

function captureDraft(): string {
  return JSON.stringify({
    ts: Date.now(),
    frontmatter: frontmatter.value,
    tagsInput: tagsInput.value,
    body: body.value
  })
}
function saveDraft(): void {
  try {
    window.localStorage.setItem(DRAFT_KEY.value, captureDraft())
    lastSavedDraft.value = new Date().toISOString()
  } catch { /* noop */ }
}
function loadDraft(): string | null {
  try { return window.localStorage.getItem(DRAFT_KEY.value) } catch { return null }
}
function clearDraft(): void {
  try { window.localStorage.removeItem(DRAFT_KEY.value); lastSavedDraft.value = null } catch { /* noop */ }
}
function hasDraftToRestore(): boolean {
  const raw = loadDraft()
  if (!raw) return false
  try {
    const obj = JSON.parse(raw)
    return typeof obj?.body === 'string' && obj.body.length > 0
  } catch { return false }
}
function applyDraft(): void {
  const raw = loadDraft()
  if (!raw) return
  try {
    const obj = JSON.parse(raw)
    if (typeof obj.body === 'string') body.value = obj.body
    if (obj.frontmatter) frontmatter.value = { ...frontmatter.value, ...obj.frontmatter }
    if (typeof obj.tagsInput === 'string') tagsInput.value = obj.tagsInput
    dirty.value = true
  } catch { /* noop */ }
}

function fromPost(p: PostSummary) {
  const fm = (p.frontmatter ?? {}) as Partial<Frontmatter>
  // 兼容老文章：summary 字段在 posts.ts 中已被视为 description 等价
  const descriptionRaw = (fm as Record<string, unknown>).description ?? (fm as Record<string, unknown>).summary
  frontmatter.value = {
    title: String(fm.title ?? ''),
    date: String(fm.date ?? new Date().toISOString().slice(0, 10)),
    tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
    category: String(fm.category ?? ''),
    draft: Boolean(fm.draft),
    description: String(typeof descriptionRaw === 'string' ? descriptionRaw : ''),
    ...fm
  }
  tagsInput.value = frontmatter.value.tags.join(', ')
  body.value = p.body ?? ''
  dirty.value = false
  // 使用防抖更新预览，避免同步阻塞主线程
  schedulePreviewUpdate()
}

async function load() {
  if (isNew.value) {
    fromPost({
      slug: '',
      filePath: '',
      frontmatter: { title: '', date: new Date().toISOString().slice(0, 10) },
      body: '',
      size: 0,
      mtime: 0
    } as PostSummary)
    return
  }
  loading.value = true
  // 防御性：10 秒后强制关闭 loading，避免任何异常路径把 UI 卡在「加载中…」
  const forceTimer = window.setTimeout(() => {
    if (loading.value) {
      console.warn('[EditorView] load 超时，强制关闭 loading')
      loading.value = false
      toast.error('加载超时，请刷新重试')
    }
  }, 10000)
  try {
    const r = await postsStore.getPost(slug.value)
    if (r) {
      fromPost(r)
      // 拉取成功后再检测是否有未恢复的草稿
      if (hasDraftToRestore()) {
        restoreDraftHint.value = true
      }
    } else {
      toast.error('文章不存在')
    }
  } catch (e) {
    console.error('[EditorView] load error:', e)
    toast.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    window.clearTimeout(forceTimer)
    loading.value = false
  }
}

const restoreDraftHint = ref(false)

function autoSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || `post-${Date.now()}`
}

// ============== Frontmatter 智能补全（已移除） ==============


// ============== 文本域引用 & 片段插入 ==============
const bodyEl = ref<HTMLTextAreaElement | null>(null)
function insertAtCursor(before: string, after = ''): void {
  const el = bodyEl.value
  if (!el) {
    body.value += before + after
    return
  }
  el.focus()
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = body.value.slice(start, end)
  const inserted = before + (selected || '') + after
  body.value = body.value.slice(0, start) + inserted + body.value.slice(end)
  // 复原光标
  nextTick(() => {
    el.selectionStart = el.selectionEnd = start + inserted.length
  })
}

function insertCodeBlock(lang: string): void {
  insertAtCursor('\n```' + lang + '\n', '\n```\n')
}
function insertMermaid(): void {
  insertAtCursor('\n```mermaid\nflowchart TD\n  A[开始] --> B{判断}\n  B -->|是| C[执行]\n  B -->|否| D[结束]\n', '\n```\n')
}
function insertLink(): void {
  const url = window.prompt('链接 URL：', 'https://')
  if (!url) return
  const text = window.prompt('链接文本：', url) || url
  insertAtCursor(`[${text}](${url})`)
}
function insertImage(): void {
  const url = window.prompt('图片 URL：', '/images/')
  if (!url) return
  const alt = window.prompt('图片描述：', '') || 'image'
  insertAtCursor(`![${alt}](${url})`)
}

interface CodeSnippet { label: string; lang: string; code: string }
const OPEN = '{' + '{'
const CLOSE = '}' + '}'
// 注意：SFC 解析器会扫描顶层的 <script>/<template>，所以代码片段中的同类标签必须拆分拼接，
// 否则 `<script setup lang="ts">` 会被当成真正的 script 块，导致 "Element is missing end tag" 错误。
const SCRIPT_TAG_OPEN = '<' + 'script setup lang="ts">'
const SCRIPT_TAG_CLOSE = '<' + '/script>'
const TEMPLATE_TAG_OPEN = '<' + 'template>'
const TEMPLATE_TAG_CLOSE = '<' + '/template>'
const codeSnippets: CodeSnippet[] = [
  { label: 'Bash 脚本', lang: 'bash', code: '#!/usr/bin/env bash\nset -e\n' },
  { label: 'TypeScript', lang: 'ts', code: 'export function hello(name: string): string {\n  return `Hi, ${name}`\n}\n' },
  {
    label: 'Vue 单文件',
    lang: 'vue',
    code: SCRIPT_TAG_OPEN + '\ndefineProps<{ title: string }>()\n' + SCRIPT_TAG_CLOSE +
      '\n\n' + TEMPLATE_TAG_OPEN + '\n  <h1>' + OPEN + ' title ' + CLOSE + '</h1>\n' + TEMPLATE_TAG_CLOSE + '\n'
  },
  { label: 'JSON', lang: 'json', code: '{\n  "name": "demo",\n  "version": "1.0.0"\n}\n' }
]
const snippetMenuOpen = ref(false)
function pickSnippet(s: CodeSnippet): void {
  insertAtCursor('\n```' + s.lang + '\n' + s.code, '```\n')
  snippetMenuOpen.value = false
}

function jumpToOffset(offset: number): void {
  const el = bodyEl.value
  if (!el) return
  el.focus()
  el.selectionStart = el.selectionEnd = offset
  // 计算行号位置并滚动
  const before = body.value.slice(0, offset)
  const lineIndex = before.split('\n').length
  const lineHeight = 22
  el.scrollTop = Math.max(0, (lineIndex - 4) * lineHeight)
}

async function save() {
  if (saving.value) return
  if (!frontmatter.value.title.trim()) {
    toast.warning('请先填写标题')
    return
  }
  saving.value = true
  try {
    frontmatter.value.tags = tagsInput.value
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const fm = { ...frontmatter.value }
    delete (fm as Record<string, unknown>).tags
    Object.assign(fm, { tags: frontmatter.value.tags })

    // 描述规整为单行字符串，避免被 YAML 序列化成 `>-` 折叠块标量
    if (typeof fm.description === 'string') {
      fm.description = fm.description.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
    }

    if (isNew.value) {
      const newSlug = autoSlug(frontmatter.value.title)
      const r = await postsStore.createPost({ slug: newSlug, frontmatter: fm as Record<string, unknown>, body: body.value })
      toast.success(`已创建 · ${r.slug}`)
      clearDraft()
      restoreDraftHint.value = false
      router.replace(`/editor/${encodeURIComponent(r.slug)}`)
    } else {
      await postsStore.updatePost(slug.value, { frontmatter: fm as Record<string, unknown>, body: body.value })
      toast.success('已保存')
      clearDraft()
      restoreDraftHint.value = false
    }
    dirty.value = false
  } catch (e) {
    toast.error(e instanceof Error ? e.message : String(e))
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (isNew.value) return
  if (!confirm(`确定删除「${frontmatter.value.title}」？此操作不可恢复。`)) return
  try {
    await postsStore.deletePost(slug.value)
    toast.success('已删除')
    router.push('/files')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : String(e))
  }
}

watch([body, frontmatter, tagsInput], () => { dirty.value = true }, { deep: true })

// 启动自动保存草稿定时器
function startDraftTimer(): void {
  stopDraftTimer()
  draftTimer = window.setInterval(() => {
    if (dirty.value && body.value) saveDraft()
  }, DRAFT_INTERVAL)
}
function stopDraftTimer(): void {
  if (draftTimer !== null) { window.clearInterval(draftTimer); draftTimer = null }
}
function discardDraft(): void {
  if (!confirm('确定放弃当前草稿恢复（不会删除文件，仅清空 localStorage 草稿）？')) return
  clearDraft()
  restoreDraftHint.value = false
}

// ============== Mermaid 客户端渲染 ==============
const previewRef = ref<HTMLElement | null>(null)
let mermaidReady = false
async function ensureMermaid() {
  if (mermaidReady) return
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
    fontFamily: 'inherit',
    flowchart: { useMaxWidth: true, htmlLabels: true }
  })
  mermaidReady = true
}

async function renderMermaidInPreview() {
  if (!previewRef.value) return
  await ensureMermaid()
  const nodes = previewRef.value.querySelectorAll<HTMLElement>('.mermaid-container[data-mermaid-source]')
  for (const el of Array.from(nodes)) {
    const source = decodeURIComponent(el.getAttribute('data-mermaid-source') ?? '')
    if (!source.trim()) continue
    const id = el.getAttribute('data-mermaid-id') ?? `mmd-${Math.random().toString(36).slice(2, 8)}`
    try {
      const { svg } = await mermaid.render(id, source)
      el.innerHTML = svg
    } catch (e) {
      el.innerHTML = `<pre class="mermaid-error" style="color:#ef4444;font-size:12px;">⚠ Mermaid 渲染失败：${e instanceof Error ? e.message : String(e)}</pre>`
    }
  }
}

watch(previewHtml, async () => {
  await nextTick()
  renderMermaidInPreview()
}, { flush: 'post' })

// ============== 键盘快捷键 ==============
function onKeydown(e: KeyboardEvent) {
  // Ctrl/Cmd + S → 保存
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    void save()
    return
  }
  // Esc → 关闭片段菜单
  if (e.key === 'Escape' && snippetMenuOpen.value) {
    snippetMenuOpen.value = false
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  await load()
  await nextTick()
  renderMermaidInPreview()
  startDraftTimer()
  // 首次进入无 slug 时，从未保存草稿恢复
  if (isNew.value && hasDraftToRestore()) restoreDraftHint.value = true
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  stopDraftTimer()
  cancelDebounce()
  if (dirty.value && body.value) saveDraft()
})
</script>

<template>
  <div class="h-full flex flex-col p-6 min-h-0">
    <!-- 工具条 -->
    <div class="card-static p-4 mb-4 flex flex-wrap items-center gap-3">
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold truncate" style="color: var(--text);">
          {{ titleForView }}
          <span v-if="dirty" class="badge badge-yellow ml-1">未保存</span>
          <span v-else-if="!isNew" class="badge badge-green ml-1">已保存</span>
          <span v-else class="badge badge-blue ml-1">新文章</span>
        </div>
        <div class="text-xs mt-0.5" style="color: var(--text-muted);">
          <span v-if="isNew">填写右侧表单后点击「创建」</span>
          <span v-else>slug: <code class="mono-num">{{ slug }}</code></span>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 ml-auto">
        <!-- 实时统计 -->
        <div class="flex items-center gap-3 text-[11.5px] px-3 py-1.5 rounded-md" style="background: var(--muted); color: var(--text-secondary);">
          <span class="inline-flex items-center gap-1" :title="`原始字符 ${stats.chars}`">
            <FileText class="h-3 w-3" /> <span class="mono-num">{{ stats.chars }}</span> 字符
          </span>
          <span class="inline-flex items-center gap-1" :title="`中文 ${stats.chinese} · 英文 ${stats.latin}`">
            <Type class="h-3 w-3" /> <span class="mono-num">{{ stats.words }}</span> 字
          </span>
          <span class="inline-flex items-center gap-1" :title="`行数 ${stats.lines}`">
            <Hash class="h-3 w-3" /> <span class="mono-num">{{ stats.lines }}</span> 行
          </span>
          <span class="inline-flex items-center gap-1" title="预计阅读时长">
            <Clock class="h-3 w-3" /> <span class="mono-num">{{ stats.readingTime }}</span> min
          </span>
        </div>
        <button v-if="!isNew" class="btn btn-danger btn-sm" @click="remove">
          <Trash2 class="h-3.5 w-3.5" aria-hidden="true" /> 删除
        </button>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          <span v-if="saving">⏳ 保存中…</span>
          <span v-else-if="isNew" class="inline-flex items-center gap-1.5"><Save class="h-3.5 w-3.5" aria-hidden="true" />创建</span>
          <span v-else class="inline-flex items-center gap-1.5"><Save class="h-3.5 w-3.5" aria-hidden="true" />保存</span>
        </button>
      </div>
    </div>

    <!-- 草稿恢复提示 -->
    <div v-if="restoreDraftHint" class="card-static px-4 py-2.5 mb-3 flex items-center gap-3 text-sm" style="border-color: var(--accent); background: rgba(99,102,241,0.06);">
      <span style="color: var(--accent);">📝 检测到未保存的本地草稿</span>
      <span class="text-xs" style="color: var(--text-tertiary);">上次编辑：{{ lastSavedDraft ? new Date(lastSavedDraft).toLocaleString() : '不久之前' }}</span>
      <div class="ml-auto flex gap-2">
        <button class="btn btn-sm btn-primary" @click="applyDraft(); restoreDraftHint = false">
          <RotateCcw class="h-3 w-3" /> 恢复
        </button>
        <button class="btn btn-sm" @click="discardDraft">
          放弃
        </button>
      </div>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="card-static p-10 text-center" style="color: var(--text-muted);">加载中…</div>

    <div v-else class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
      <!-- 左侧：表单 + 编辑器 -->
      <div class="lg:col-span-7 flex flex-col gap-4 min-h-0">
        <!-- frontmatter -->
        <div class="card-static p-5 space-y-3">
          <div class="flex items-center gap-2">
            <span class="eyebrow">FRONTMATTER · 元数据</span>
            <span class="text-[10.5px]" style="color: var(--text-tertiary);">
              草稿已自动暂存 <span v-if="lastSavedDraft">· {{ new Date(lastSavedDraft).toLocaleTimeString() }}</span>
            </span>
          </div>
          <div>
            <label class="text-xs mb-1 block" style="color: var(--text-muted);">标题 *</label>
            <input v-model="frontmatter.title" class="input" placeholder="给文章起一个标题" />
            <div v-if="isNew && frontmatter.title" class="text-[10.5px] mt-1" style="color: var(--text-tertiary);">
              预计 slug: <code class="mono-num">{{ autoSlug(frontmatter.title) }}</code>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs mb-1 block" style="color: var(--text-muted);">日期</label>
              <input v-model="frontmatter.date" class="input" placeholder="YYYY-MM-DD" />
            </div>
            <div>
              <label class="text-xs mb-1 block" style="color: var(--text-muted);">分类</label>
              <input v-model="frontmatter.category" class="input" placeholder="如：前端 / 工具" />
            </div>
          </div>
          <div>
            <label class="text-xs mb-1 block" style="color: var(--text-muted);">标签（逗号分隔）</label>
            <input v-model="tagsInput" class="input" placeholder="Vue, VitePress, 设计" />
          </div>
          <div>
            <label class="text-xs mb-1 block" style="color: var(--text-muted);">描述（用于 SEO 与列表预览）</label>
            <textarea v-model="frontmatter.description" class="textarea" rows="2" placeholder="一句话概述" />
            <div class="text-[10.5px] mt-1" style="color: var(--text-tertiary);">
              {{ frontmatter.description.length }} / 200 字符
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm cursor-pointer" style="color: var(--text-muted);">
            <input type="checkbox" v-model="frontmatter.draft" class="accent-current" />
            标记为草稿（不会出现在列表）
          </label>
        </div>

        <!-- 编辑器 -->
        <div class="card-static flex-1 flex flex-col min-h-0">
          <div class="px-5 py-2.5 border-b flex items-center gap-2 flex-wrap" style="border-color: var(--border);">
            <span class="eyebrow">MARKDOWN · 正文</span>
            <div class="flex items-center gap-1 ml-1">
              <button class="btn btn-sm" type="button" title="插入一级标题" @click="insertAtCursor('\n# ', '')">
                <span class="font-mono text-[11px]">H1</span>
              </button>
              <button class="btn btn-sm" type="button" title="插入二级标题" @click="insertAtCursor('\n## ', '')">
                <span class="font-mono text-[11px]">H2</span>
              </button>
              <button class="btn btn-sm" type="button" title="插入无序列表" @click="insertAtCursor('\n- ', '')">
                <ListTree class="h-3.5 w-3.5" />
              </button>
              <button class="btn btn-sm" type="button" title="插入引用" @click="insertAtCursor('\n> ', '')">
                <span class="font-mono text-[11px]">&gt;</span>
              </button>
              <button class="btn btn-sm" type="button" title="插入代码块" @click="insertCodeBlock('ts')">
                <Code2 class="h-3.5 w-3.5" />
              </button>
              <button class="btn btn-sm" type="button" title="插入 Mermaid 图表" @click="insertMermaid">
                <Workflow class="h-3.5 w-3.5" style="color: var(--accent);" />
              </button>
              <button class="btn btn-sm" type="button" title="插入链接" @click="insertLink">
                🔗
              </button>
              <button class="btn btn-sm" type="button" title="插入图片" @click="insertImage">
                🖼
              </button>
              <div class="relative">
                <button
                  class="btn btn-sm"
                  type="button"
                  title="代码片段"
                  @click="snippetMenuOpen = !snippetMenuOpen"
                >
                  <Wand2 class="h-3.5 w-3.5" /> 片段
                </button>
                <div
                  v-if="snippetMenuOpen"
                  class="card-static p-1 min-w-[180px] mt-1 shadow-lg absolute z-30"
                  style="right: 0;"
                >
                  <button
                    v-for="s in codeSnippets"
                    :key="s.label"
                    type="button"
                    class="block w-full text-left px-2.5 py-1.5 text-[12px] hover:bg-[var(--muted)] rounded"
                    @click="pickSnippet(s)"
                  >
                    <span class="mono-num text-[10.5px] mr-1.5" style="color: var(--text-tertiary);">{{ s.lang }}</span>{{ s.label }}
                  </button>
                </div>
              </div>
            </div>
            <span class="text-[10.5px] ml-auto" style="color: var(--text-tertiary);">{{ body.length }} 字符</span>
          </div>
          <textarea
            ref="bodyEl"
            v-model="body"
            class="flex-1 w-full p-5 outline-none font-mono text-[13px] resize-none"
            style="background: var(--card); color: var(--text); min-height: 420px; line-height: 1.7;"
            spellcheck="false"
            placeholder="# 开始书写…"
          ></textarea>
        </div>
      </div>

      <!-- 右侧：预览 + 大纲 -->
      <div class="lg:col-span-5 flex flex-col gap-4 min-h-0">
        <!-- 目录大纲 -->
        <div v-if="outline.length > 0" class="card-static p-4 max-h-[180px] overflow-auto">
          <div class="flex items-center gap-1.5 mb-2">
            <ListTree class="h-3.5 w-3.5" style="color: var(--text-muted);" />
            <span class="eyebrow">大纲</span>
            <span class="text-[10.5px] ml-auto" style="color: var(--text-tertiary);">点击跳转</span>
          </div>
          <ul class="space-y-0.5">
            <li
              v-for="(item, i) in outline"
              :key="`${item.offset}-${i}`"
              :style="{ paddingLeft: ((item.level - 1) * 12) + 'px' }"
            >
              <button
                type="button"
                class="text-left w-full text-[12px] truncate py-0.5 px-1.5 rounded hover:bg-[var(--muted)] transition"
                :style="{
                  color: item.level === 1 ? 'var(--text)' : 'var(--text-secondary)',
                  fontWeight: item.level === 1 ? '600' : '400'
                }"
                @click="jumpToOffset(item.offset)"
              >
                <span class="mono-num text-[10px] mr-1" style="color: var(--text-tertiary);">H{{ item.level }}</span>
                {{ item.text }}
              </button>
            </li>
          </ul>
        </div>
        <div class="card-static flex-1 flex flex-col min-h-0">
          <div class="px-5 py-3 border-b flex items-center gap-2" style="border-color: var(--border);">
            <span class="eyebrow">PREVIEW · 实时预览</span>
            <span v-if="previewUpdating" class="text-[10.5px]" style="color: var(--text-tertiary);">渲染中…</span>
            <span v-if="frontmatter.draft" class="badge badge-yellow ml-1">草稿</span>
            <span v-else-if="!previewUpdating" class="badge badge-green ml-1">将发布</span>
          </div>
          <div ref="previewRef" class="flex-1 overflow-auto p-6" style="background: var(--paper);">
            <article class="preview-body" v-html="previewHtml || '<p style=\'color: var(--text-tertiary); font-style: italic;\'>在左侧开始书写…</p>'"></article>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
