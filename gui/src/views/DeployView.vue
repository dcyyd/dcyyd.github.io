<script setup lang="ts">
import { onMounted, computed, ref, watch, nextTick } from 'vue'
import { useDeployStore, useToastStore } from '../stores'
import { Search, RotateCcw, Copy, ArrowDown, Filter, Activity } from 'lucide-vue-next'
import type { LogKind } from '../api'

const deploy = useDeployStore()
const toast = useToastStore()

const ts = () => new Date().toTimeString().slice(0, 8)

const summary = computed(() => {
  const c = filteredLines.value.length
  if (deploy.status === 'success') return `成功 · 显示 ${c} / ${deploy.lines.length} 行`
  if (deploy.status === 'error') return `失败 · 显示 ${c} / ${deploy.lines.length} 行`
  if (deploy.status === 'running') return `运行中 · 显示 ${c} / ${deploy.lines.length} 行`
  return `共 ${deploy.lines.length} 行`
})

const modeLabel = computed(() => {
  if (deploy.mode === 'deploy') return '一键部署'
  if (deploy.mode === 'preview') return '本地预览'
  return '—'
})

// ============== 日志搜索/过滤 ==============
const search = ref('')
const levelFilter = ref<'all' | LogKind>('all')
const autoScroll = ref(true)

const filteredLines = computed(() => {
  const term = search.value.trim().toLowerCase()
  return deploy.lines.filter((l) => {
    if (levelFilter.value !== 'all' && l.kind !== levelFilter.value) return false
    if (term && !l.text.toLowerCase().includes(term)) return false
    return true
  })
})

const kindOptions: Array<{ value: 'all' | LogKind; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'info', label: 'info' },
  { value: 'stdout', label: 'stdout' },
  { value: 'stderr', label: 'stderr' },
  { value: 'error', label: 'error' },
  { value: 'done', label: 'done' }
]

watch(filteredLines, async () => {
  if (autoScroll.value) {
    await nextTick()
    const el = document.getElementById('deploy-terminal')
    if (el) el.scrollTop = el.scrollHeight
  }
})

function jumpToBottom() {
  const el = document.getElementById('deploy-terminal')
  if (el) el.scrollTop = el.scrollHeight
}

function startDeploy() {
  if (deploy.running) return
  if (!confirm('即将调用 `pnpm post d -y` 一键部署到 gh-pages，确定继续？')) return
  deploy.startDeploy()
  watchDoneThenToast('deploy')
}
function startPreview() {
  if (deploy.running) return
  deploy.startPreview()
  watchDoneThenToast('preview')
}
function watchDoneThenToast(_m: 'deploy' | 'preview') {
  const stop = setInterval(() => {
    if (deploy.status === 'success') {
      toast.success(_m === 'deploy' ? '部署完成' : '预览服务已就绪')
      clearInterval(stop)
    } else if (deploy.status === 'error') {
      toast.error('任务失败，查看日志')
      clearInterval(stop)
    } else if (!deploy.running) {
      clearInterval(stop)
    }
  }, 400)
}
async function stopPreviewAction() {
  // 先关 SSE，再调 REST 杀进程（杀进程树）
  deploy.stopPreviewStream()
  await deploy.stopPreview()
}

function retryLast() {
  if (deploy.running) return
  const last = deploy.history[0]
  if (!last) {
    toast.warning('暂无失败记录可重试')
    return
  }
  if (last.status !== 'error') {
    toast.info('最近一次任务并非失败')
  }
  deploy.retryLast(last.mode)
  watchDoneThenToast(last.mode)
}

function copyError(text: string) {
  if (!text) return
  try {
    void navigator.clipboard.writeText(text)
    toast.success('已复制错误摘要')
  } catch { toast.error('复制失败') }
}

function fmtDuration(start: number, end: number) {
  const sec = Math.max(0, Math.round((end - start) / 1000))
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60); const s = sec % 60
  return `${m}m ${s}s`
}
function fmtClock(t: number) {
  const d = new Date(t)
  return d.toLocaleTimeString('zh-CN', { hour12: false })
}

// 心跳：用 ref<number> 模拟时间戳，每秒 +1
const heartbeat = ref(0)
let heartbeatTimer: number | null = null
watch(() => deploy.running, (r) => {
  if (r) {
    heartbeat.value = Date.now()
    if (heartbeatTimer === null) {
      heartbeatTimer = window.setInterval(() => { heartbeat.value = Date.now() }, 1000)
    }
  } else {
    if (heartbeatTimer !== null) { window.clearInterval(heartbeatTimer); heartbeatTimer = null }
  }
})
const sinceStart = computed(() => {
  if (heartbeat.value === 0 || !deploy.running) return 0
  return Math.round((heartbeat.value - findStartTs()) / 1000)
})
function findStartTs(): number {
  // 找日志里第一行 info 后的时间戳或 store 启动时间
  // 这里以最近一次 startDeploy/startPreview 的 historyItem.startedAt 为准
  return deploy.history[0]?.startedAt ?? Date.now()
}

onMounted(() => {
  deploy.refreshPreviewStatus()
})
</script>

<template>
  <div class="p-8 max-w-5xl mx-auto space-y-6">
    <!-- 双卡片：部署 / 预览 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- 部署 -->
      <div class="card-static p-6">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <div class="eyebrow">DEPLOY · 部署</div>
            <div class="serif-title text-lg mt-1">一键部署到 GitHub Pages</div>
          </div>
          <span class="badge badge-gray">pnpm post d</span>
        </div>
        <p class="text-sm mb-4" style="color: var(--text-muted);">
          自动执行：清理 → 构建 → 推送 gh-pages。部署过程中可在下方日志面板实时查看输出。
        </p>
        <div class="flex gap-2">
          <button class="btn btn-primary" :disabled="deploy.running" @click="startDeploy">
            <span v-if="deploy.running && deploy.mode === 'deploy'">⏳ 部署中…</span>
            <span v-else>▲ 启动一键部署</span>
          </button>
          <button
            class="btn btn-ghost"
            :disabled="!(deploy.running && deploy.mode === 'deploy')"
            @click="deploy.stopDeploy"
          >⏹ 停止</button>
        </div>
      </div>

      <!-- 预览 -->
      <div class="card-static p-6">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <div class="eyebrow">PREVIEW · 预览</div>
            <div class="serif-title text-lg mt-1">本地预览（pnpm post s --open）</div>
          </div>
          <span class="badge" :class="deploy.previewRunning ? 'badge-green' : 'badge-gray'">
            <span class="dot" :class="deploy.previewRunning ? 'dot-green' : 'dot-gray'"></span>
            {{ deploy.previewRunning ? '运行中 · :5173' : '未运行' }}
          </span>
        </div>
        <p class="text-sm mb-4" style="color: var(--text-muted);">
          等价于 <code class="mono-num">pnpm post s --open</code>：直接拉起 VitePress dev，端口 5173。
        </p>
        <div class="flex gap-2 flex-wrap">
          <button class="btn btn-primary" :disabled="deploy.running" @click="startPreview">
            <span v-if="deploy.running && deploy.mode === 'preview'">⏳ 启动中…</span>
            <span v-else>▶ 启动预览</span>
          </button>
          <button
            class="btn btn-ghost"
            :disabled="!deploy.previewRunning && !(deploy.running && deploy.mode === 'preview')"
            @click="stopPreviewAction"
          >⏹ 停止</button>
          <a
            v-if="deploy.previewRunning"
            class="btn btn-ghost"
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
          >↗ 打开预览</a>
        </div>
      </div>
    </div>

    <!-- 终端日志 -->
    <div class="card-static">
      <div class="px-5 py-3 flex items-center justify-between gap-2 border-b flex-wrap" style="border-color: var(--border);">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
          <span class="eyebrow">实时日志</span>
          <span class="text-xs" style="color: var(--text-muted);">{{ summary }}</span>
          <span v-if="deploy.mode" class="badge badge-gray">{{ modeLabel }}</span>
          <span v-if="deploy.status === 'running'" class="badge badge-yellow">
            <span class="dot dot-yellow" :class="{ 'dot-pulse': true }"></span>运行中
            <span v-if="sinceStart > 0" class="mono-num ml-1">· {{ sinceStart }}s</span>
          </span>
          <span v-else-if="deploy.status === 'success'" class="badge badge-green">
            <span class="dot dot-green"></span>成功
          </span>
          <span v-else-if="deploy.status === 'stopped'" class="badge badge-gray">
            <span class="dot dot-gray"></span>已停止
          </span>
          <span v-else-if="deploy.status === 'error'" class="badge badge-red">
            <span class="dot dot-red"></span>失败
          </span>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <div class="relative">
            <input
              v-model="search"
              class="input pl-7 text-[12px] h-9 w-[180px]"
              placeholder="搜索日志…"
            />
          </div>
          <div class="relative inline-flex items-center">
            <select v-model="levelFilter" class="select pl-7 text-[12px] h-9 w-auto">
              <option v-for="o in kindOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <label class="flex items-center gap-1 text-[11px] cursor-pointer" style="color: var(--text-muted);">
            <input v-model="autoScroll" type="checkbox" class="accent-current" />
            自动滚到底
          </label>
          <button class="btn btn-ghost btn-xs" :disabled="deploy.running" @click="deploy.clear">🗑 清空</button>
        </div>
      </div>
      <div id="deploy-terminal" class="terminal m-0 rounded-t-none" style="max-height: 520px;">
        <template v-if="filteredLines.length === 0">
          <span class="terminal-line terminal-line-info">
            $ {{ search || levelFilter !== 'all' ? '（无匹配日志）' : '等待执行任务…' }}
          </span>
        </template>
        <span
          v-for="l in filteredLines"
          :key="l.id"
          class="terminal-line"
          :class="`terminal-line-${l.kind}`"
        >
          <span class="terminal-ts">{{ l.ts }}</span>{{ l.text }}
        </span>
        <span
          v-if="deploy.status === 'running'"
          class="terminal-line terminal-line-info"
        ><span class="terminal-ts">{{ ts() }}</span>▌</span>
      </div>
      <div class="px-5 py-2 border-t flex items-center justify-between text-[10.5px]" style="border-color: var(--border); color: var(--text-tertiary);">
        <span class="inline-flex items-center gap-1.5">
          <Activity class="h-3 w-3" />
          <span v-if="deploy.running" class="text-emerald-500 inline-flex items-center gap-1">
            <span class="dot dot-green dot-pulse"></span> 实时
          </span>
          <span v-else>未运行</span>
        </span>
        <button v-if="!autoScroll" class="btn btn-ghost btn-xs" @click="jumpToBottom">
          <ArrowDown class="h-3 w-3" /> 跳到底部
        </button>
      </div>
    </div>

    <!-- 部署历史（已移除） -->

    <!-- 帮助 -->
    <div class="card-muted p-5 text-sm" style="color: var(--text-muted);">
      <div class="eyebrow mb-2">FAQ</div>
      <ul class="space-y-1 list-disc list-inside">
        <li>部署失败？先确认 <code class="mono-num">git status</code> 干净，且 <code class="mono-num">remote</code> 已配置。</li>
        <li>预览失败？GUI 启动的就是 <code class="mono-num">pnpm post s --open</code>，等价的 VitePress dev 在 5173。</li>
        <li>日志太长？用上方搜索框 + 级别过滤定位，或直接复制错误摘要。</li>
        <li>上次失败？「一键重试」按钮会按原模式重发，无需重新选择。</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.dot-pulse {
  animation: dot-pulse 1s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}
</style>
