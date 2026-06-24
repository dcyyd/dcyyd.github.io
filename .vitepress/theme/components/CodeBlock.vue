<script setup lang="ts">
import type { VNodeChild } from 'vue'
import { computed, defineComponent, h, ref } from 'vue'
import type { SafeElementNode, SafeNode } from '../types/blog'
import { Check, Clipboard, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps<{
  code: string
  language: string
  nodes: SafeNode[]
}>()

// ============== 基础信息 ==============
const languageLabel = computed(() => props.language || 'text')
const copied = ref(false)

// 代码行数（用于行号 + 折叠判断）
const totalLines = computed(() => {
  if (!props.code) return 1
  // 避免空行被算成多行
  return Math.max(props.code.split('\n').length, 1)
})

// ============== 折叠状态 ==============
const FOLD_THRESHOLD = 16
const folded = ref(totalLines.value > FOLD_THRESHOLD)
const isCollapsible = computed(() => totalLines.value > FOLD_THRESHOLD)

// ============== 复制功能 ==============
async function copyCode(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  await navigator.clipboard.writeText(props.code)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1800)
}

function toggleFold(): void {
  folded.value = !folded.value
}

// ============== 主题配置 ==============
const languageConfig: Record<string, { color: string; label: string }> = {
  ts:        { color: '#3178c6', label: 'TS' },
  typescript:{ color: '#3178c6', label: 'TS' },
  js:        { color: '#f1e05a', label: 'JS' },
  javascript:{ color: '#f1e05a', label: 'JS' },
  vue:       { color: '#41b883', label: 'Vue' },
  tsx:       { color: '#3178c6', label: 'TSX' },
  jsx:       { color: '#f1e05a', label: 'JSX' },
  css:       { color: '#563d7c', label: 'CSS' },
  html:      { color: '#e34c26', label: 'HTML' },
  json:      { color: '#a0a0a0', label: 'JSON' },
  bash:      { color: '#89e051', label: 'Bash' },
  shell:     { color: '#89e051', label: 'Shell' },
  sh:        { color: '#89e051', label: 'Shell' },
  md:        { color: '#083fa1', label: 'Markdown' },
  markdown:  { color: '#083fa1', label: 'Markdown' },
  python:    { color: '#3572A5', label: 'Python' },
  py:        { color: '#3572A5', label: 'Python' },
  go:        { color: '#00ADD8', label: 'Go' },
  rust:      { color: '#dea584', label: 'Rust' },
  rs:        { color: '#dea584', label: 'Rust' },
  yaml:      { color: '#cb171e', label: 'YAML' },
  yml:       { color: '#cb171e', label: 'YAML' },
  dockerfile:{ color: '#384d54', label: 'Docker' },
  docker:    { color: '#384d54', label: 'Docker' },
  sql:       { color: '#e38c00', label: 'SQL' },
  graphql:   { color: '#e10098', label: 'GQL' },
  gql:       { color: '#e10098', label: 'GQL' },
  scss:      { color: '#cf649a', label: 'SCSS' },
  sass:      { color: '#cf649a', label: 'Sass' },
  less:      { color: '#1d365d', label: 'Less' }
}

const config = computed(() =>
  languageConfig[languageLabel.value.toLowerCase()] ?? { color: '#6366f1', label: languageLabel.value.toUpperCase() }
)
const accentColor = computed(() => config.value.color)

// ============== 渲染内联节点 ==============
function renderInlineNode(node: SafeNode): VNodeChild {
  if (node.type === 'text') return node.value
  if (node.type === 'root') return node.children.map(renderInlineNode)
  const safeProps: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(node.properties)) {
    if (key === 'className') safeProps.class = value
    if (key === 'aria-hidden') safeProps[key] = value
  }
  return h(node.tagName, safeProps, node.children.map(renderInlineNode))
}

const CodeContent = defineComponent({
  name: 'CodeContent',
  setup() {
    return () => h('code', { class: `language-${languageLabel.value}` }, props.nodes.map(renderInlineNode))
  }
})
</script>

<template>
  <div
    class="code-block group relative my-6 overflow-hidden rounded-lg border"
    :class="folded && isCollapsible ? 'is-folded' : ''"
  >
    <!-- ====== 标题栏 ====== -->
    <div class="code-block__header">
      <!-- 左: macOS 点 + 语言徽章 -->
      <div class="code-block__left">
        <div class="code-block__dots" aria-hidden="true">
          <span class="dot dot--red" />
          <span class="dot dot--yellow" />
          <span class="dot dot--green" />
        </div>
        <span
          class="code-block__lang"
          :style="{
            color: accentColor,
            borderColor: accentColor + '40',
            background: accentColor + '14'
          }"
        >
          <span class="code-block__lang-dot" :style="{ background: accentColor }" aria-hidden="true" />
          {{ config.label }}
        </span>
        <!-- 行数 (折叠时显示) -->
        <span v-if="isCollapsible" class="code-block__meta">
          {{ totalLines }} 行
        </span>
      </div>

      <!-- 右: 折叠 + 复制 -->
      <div class="code-block__right">
        <button
          v-if="isCollapsible"
          type="button"
          class="code-block__btn"
          :aria-label="folded ? '展开代码' : '折叠代码'"
          :aria-expanded="!folded"
          @click="toggleFold"
        >
          <ChevronDown v-if="folded" class="h-3.5 w-3.5" aria-hidden="true" />
          <ChevronUp v-else class="h-3.5 w-3.5" aria-hidden="true" />
          <span>{{ folded ? '展开' : '折叠' }}</span>
        </button>
        <button
          type="button"
          class="code-block__btn"
          :aria-label="copied ? '已复制' : '复制代码'"
          @click="copyCode"
        >
          <Transition name="copy-icon" mode="out-in">
            <Check v-if="copied" key="check" class="h-3.5 w-3.5" :style="{ color: '#10b981' }" aria-hidden="true" />
            <Clipboard v-else key="clipboard" class="h-3.5 w-3.5" aria-hidden="true" />
          </Transition>
          <Transition name="copy-text" mode="out-in">
            <span v-if="copied" key="copied" class="code-block__btn-text code-block__btn-text--success">已复制</span>
            <span v-else key="copy" class="code-block__btn-text">复制</span>
          </Transition>
        </button>
      </div>
    </div>

    <!-- ====== 代码体 ====== -->
    <div class="code-block__body">
      <div class="code-block__lines" aria-hidden="true">
        <span
          v-for="line in totalLines"
          :key="line"
          class="code-block__line-num"
        >{{ line }}</span>
      </div>
      <pre class="code-block__pre"><CodeContent /></pre>
    </div>

    <!-- ====== 折叠渐变遮罩 ====== -->
    <div v-if="folded && isCollapsible" class="code-block__fade" aria-hidden="true">
      <button
        type="button"
        class="code-block__expand"
        @click="toggleFold"
        aria-label="展开全部代码"
      >
        <ChevronDown class="h-4 w-4" aria-hidden="true" />
        <span>展开剩余 {{ totalLines - FOLD_THRESHOLD }} 行</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
 * 整体容器
 * ============================================ */
.code-block {
  border-color: var(--ink-200);
  background: var(--card);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.3s ease;
}

.code-block:hover {
  border-color: var(--ink-300);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.code-block.is-folded .code-block__body {
  max-height: 18.5em; /* 约 12 行 */
  overflow: hidden;
}

/* ============================================
 * 标题栏
 * ============================================ */
.code-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.875rem;
  border-bottom: 1px solid var(--ink-200);
  background: var(--muted);
  user-select: none;
}

.code-block__left,
.code-block__right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* macOS 三色点 */
.code-block__dots {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.dot {
  width: 0.6875rem;
  height: 0.6875rem;
  border-radius: 50%;
  flex-shrink: 0;
  transition: filter 0.15s ease;
}
.dot--red    { background: #ff5f57; }
.dot--yellow { background: #febc2e; }
.dot--green  { background: #28c840; }
.code-block:hover .dot { filter: brightness(1.1); }

/* 语言徽章 */
.code-block__lang {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  padding: 0.1875rem 0.5rem;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid;
  border-radius: 0.375rem;
  line-height: 1.2;
}

.code-block__lang-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.code-block__meta {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
  padding-left: 0.25rem;
}

/* ============================================
 * 按钮 (复制/折叠)
 * ============================================ */
.code-block__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  padding: 0.25rem 0.5rem;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  line-height: 1.2;
}

.code-block__btn:hover {
  background: var(--ink-100);
  color: var(--text-primary);
}

:deep(.dark) .code-block__btn:hover {
  background: var(--ink-200);
}

.code-block__btn-text {
  display: inline-block;
}
.code-block__btn-text--success {
  color: #10b981;
}

/* 复制图标动画 */
.copy-icon-enter-active,
.copy-icon-leave-active,
.copy-text-enter-active,
.copy-text-leave-active {
  transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}
.copy-icon-enter-from,
.copy-icon-leave-to,
.copy-text-enter-from,
.copy-text-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}

/* ============================================
 * 代码体
 * ============================================ */
.code-block__body {
  display: flex;
  align-items: stretch;
  position: relative;
  overflow: hidden;
  background: var(--card);
}

/* 行号列 */
.code-block__lines {
  display: flex;
  flex-direction: column;
  padding: 0.875rem 0.5rem 0.875rem 0.875rem;
  border-right: 1px solid var(--ink-100);
  background: var(--muted);
  user-select: none;
  text-align: right;
  min-width: 2.5rem;
  flex-shrink: 0;
}

.code-block__line-num {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.65;
  color: var(--text-tertiary);
  opacity: 0.45;
  font-variant-numeric: tabular-nums;
}

.code-block__pre {
  flex: 1;
  margin: 0;
  padding: 0.875rem 1rem;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.65;
  color: var(--text-primary);
  background: transparent;
  tab-size: 2;
  -moz-tab-size: 2;
}

.code-block__pre code {
  font-family: inherit;
  font-size: inherit;
  background: transparent;
  padding: 0;
  color: inherit;
}

/* ============================================
 * 折叠渐变 + 展开按钮
 * ============================================ */
.code-block__fade {
  position: absolute;
  inset: auto 0 0 0;
  height: 5rem;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 0.875rem;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--card) 70%
  );
  pointer-events: none;
}

.code-block__expand {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--ink-200);
  background: var(--card);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.18s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.code-block__expand:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--vp-c-brand-soft);
}

/* ============================================
 * 滚动条
 * ============================================ */
.code-block__pre::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}
.code-block__pre::-webkit-scrollbar-track {
  background: transparent;
}
.code-block__pre::-webkit-scrollbar-thumb {
  background: var(--ink-200);
  border-radius: 3px;
}
.code-block__pre::-webkit-scrollbar-thumb:hover {
  background: var(--ink-300);
}
</style>
