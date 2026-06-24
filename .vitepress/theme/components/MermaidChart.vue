<script setup lang="ts">
/**
 * Mermaid 图表渲染组件
 * - 客户端按 mermaid 库渲染指定 source
 * - 主题色跟随站点（深/浅色）
 * - 错误时显示原始 source + 错误信息，避免页面崩溃
 */
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import mermaid from 'mermaid'

const props = defineProps<{
  code: string
  id?: string
}>()

const container = ref<HTMLElement | null>(null)
const status = ref<'idle' | 'rendering' | 'ok' | 'error'>('idle')
const errorMsg = ref('')
let seq = 0

function detectTheme(): 'dark' | 'default' {
  if (typeof document === 'undefined') return 'default'
  const root = document.documentElement
  if (root.classList.contains('dark')) return 'dark'
  const dataTheme = root.getAttribute('data-theme') || ''
  if (dataTheme === 'dark') return 'dark'
  if (root.classList.contains('vp-dark')) return 'dark'
  return 'default'
}

function getThemeVars(theme: 'dark' | 'default') {
  if (theme === 'dark') {
    return {
      background: '#1a1d24',
      primaryColor: '#2a2f3a',
      primaryTextColor: '#e5e7eb',
      primaryBorderColor: '#3a4150',
      lineColor: '#94a3b8',
      secondaryColor: '#3a4150',
      tertiaryColor: '#252932',
      fontFamily: 'inherit',
      fontSize: '14px'
    }
  }
  return {
    background: '#ffffff',
    primaryColor: '#f1f5f9',
    primaryTextColor: '#1f2937',
    primaryBorderColor: '#cbd5e1',
    lineColor: '#475569',
    secondaryColor: '#e2e8f0',
    tertiaryColor: '#f8fafc',
    fontFamily: 'inherit',
    fontSize: '14px'
  }
}

async function render() {
  if (!container.value) return
  if (!props.code?.trim()) return
  status.value = 'rendering'
  errorMsg.value = ''
  const theme = detectTheme()
  const id = `mmd-${props.id ?? String(++seq)}-${Date.now()}`
  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
      themeVariables: getThemeVars(theme),
      flowchart: { useMaxWidth: true, htmlLabels: true }
    })
    const { svg } = await mermaid.render(id, props.code.trim())
    if (container.value) {
      container.value.innerHTML = svg
      status.value = 'ok'
    }
  } catch (e) {
    status.value = 'error'
    errorMsg.value = e instanceof Error ? e.message : String(e)
    if (container.value) container.value.innerHTML = ''
  }
}

onMounted(render)
watch(
  () => [props.code, typeof document !== 'undefined' && document.documentElement.classList.contains('dark')],
  () => render()
)
onBeforeUnmount(() => {
  if (container.value) container.value.innerHTML = ''
})
</script>

<template>
  <div class="mermaid-block my-6">
    <div v-if="status === 'rendering'" class="mermaid-loading" aria-live="polite">
      <span class="dot dot--yellow" /> 正在渲染 Mermaid 图表…
    </div>
    <div
      v-show="status !== 'error'"
      ref="container"
      class="mermaid-container"
      :data-mermaid-source="code"
    />
    <div v-if="status === 'error'" class="mermaid-error" role="alert">
      <div class="mermaid-error__head">⚠ Mermaid 渲染失败</div>
      <div class="mermaid-error__msg">{{ errorMsg }}</div>
      <pre class="mermaid-error__src"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.mermaid-block {
  border: 1px solid var(--ink-200);
  border-radius: 8px;
  background: var(--card);
  padding: 1.25rem 1rem;
  overflow-x: auto;
  position: relative;
}

.mermaid-container {
  display: flex;
  justify-content: center;
  min-height: 40px;
}
.mermaid-container :deep(svg) {
  max-width: 100%;
  height: auto;
}

.mermaid-loading {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.mermaid-error {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.75rem;
  color: #ef4444;
}
.mermaid-error__head { font-weight: 600; margin-bottom: 0.25rem; }
.mermaid-error__msg { color: var(--text-tertiary); margin-bottom: 0.5rem; }
.mermaid-error__src {
  background: var(--muted);
  padding: 0.75rem;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre;
  color: var(--text);
}
</style>
