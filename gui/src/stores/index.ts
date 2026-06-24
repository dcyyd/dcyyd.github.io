import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, type PostSummary, type LogSummary, type LogKind } from '@/api'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref<PostSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number>(0)

  async function refresh(force = false) {
    // 5 秒内不重复拉
    if (!force && Date.now() - lastFetched.value < 5000) return
    loading.value = true
    error.value = null
    try {
      const res = await api.listPosts()
      posts.value = res.posts
      lastFetched.value = Date.now()
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function getPost(slug: string): Promise<PostSummary> {
    const res = await api.getPost(slug)
    return res.post
  }

  async function createPost(payload: { slug: string; frontmatter: Record<string, unknown>; body: string }) {
    const res = await api.createPost(payload)
    await refresh(true)
    return res.post
  }

  async function updatePost(slug: string, payload: { frontmatter: Record<string, unknown>; body: string }) {
    const res = await api.updatePost(slug, payload)
    await refresh(true)
    return res.post
  }

  async function deletePost(slug: string) {
    await api.deletePost(slug)
    await refresh(true)
  }

  return { posts, loading, error, lastFetched, refresh, getPost, createPost, updatePost, deletePost }
})

export const useLogsStore = defineStore('logs', () => {
  const logs = ref<LogSummary[]>([])
  const loading = ref(false)

  async function refresh(_force = false) {
    loading.value = true
    try {
      const res = await api.listLogs()
      logs.value = res.logs
    } finally {
      loading.value = false
    }
  }

  async function read(name: string) {
    const res = await api.getLog(name)
    return res.content
  }

  return { logs, loading, refresh, read }
})

/**
 * 部署 / 预览共享状态 store
 * - 日志、模式、运行状态都在 store 里，路由切换不会丢失
 * - SSE 流按 mode 独立句柄，停止按钮只关闭对应的那个
 */
export const useDeployStore = defineStore('deploy', () => {
  type Mode = 'deploy' | 'preview' | null
  // stopped 表示用户主动按了停止（与 error 区分）
  type Status = 'idle' | 'running' | 'success' | 'error' | 'stopped'

  interface HistoryItem {
    id: number
    mode: Exclude<Mode, null>
    status: Status
    startedAt: number
    endedAt: number
    lineCount: number
    errorSummary: string
  }

  const mode = ref<Mode>(null)
  const running = ref(false)
  const status = ref<Status>('idle')
  const lines = ref<Array<{ id: number; ts: string; kind: LogKind; text: string }>>([])
  const previewRunning = ref(false)
  const history = ref<HistoryItem[]>([])
  let deployCancel: (() => void) | null = null
  let previewCancel: (() => void) | null = null
  let lineId = 0
  let historyId = 0
  let runStartedAt = 0
  let runErrorSummary = ''

  function nowTs() {
    return new Date().toTimeString().slice(0, 8)
  }
  function pushLine(kind: LogKind, text: string) {
    for (const p of String(text).split(/\r?\n/)) {
      if (p === '') continue
      lines.value.push({ id: ++lineId, ts: nowTs(), kind, text: p })
      // 捕获最近一条 error 行作为历史摘要
      if (kind === 'error' && p.length > 0) runErrorSummary = p.slice(0, 120)
    }
    if (lines.value.length > 800) lines.value.splice(0, lines.value.length - 800)
  }
  function clear() {
    lines.value = []
    status.value = 'idle'
    mode.value = null
  }
  function pushHistory(m: Exclude<Mode, null>, s: Status, lineCount: number) {
    history.value.unshift({
      id: ++historyId,
      mode: m,
      status: s,
      startedAt: runStartedAt,
      endedAt: Date.now(),
      lineCount,
      errorSummary: runErrorSummary
    })
    if (history.value.length > 20) history.value.length = 20
    runErrorSummary = ''
  }

  /** 停止一键部署 SSE 流（不影响预览） */
  function stopDeploy() {
    if (deployCancel) { deployCancel(); deployCancel = null }
    if (mode.value === 'deploy') {
      const wasRunning = status.value === 'running'
      running.value = false
      // 用户主动停止 → 标记 stopped，不计入 error
      if (wasRunning) {
        status.value = 'stopped'
        pushLine('info', '⏹ 已停止一键部署')
        pushHistory('deploy', 'stopped', lines.value.length)
      } else if (status.value === 'running') {
        status.value = 'stopped'
      }
    }
  }
  /** 停止本地预览 SSE 流（不影响部署） */
  function stopPreviewStream() {
    if (previewCancel) { previewCancel(); previewCancel = null }
    if (mode.value === 'preview') {
      const wasRunning = status.value === 'running'
      running.value = false
      if (wasRunning) {
        status.value = 'stopped'
        pushLine('info', '⏹ 已停止预览监听')
        pushHistory('preview', 'stopped', lines.value.length)
      } else if (status.value === 'running') {
        status.value = 'stopped'
      }
    }
  }
  /** 通用停止：按当前 mode 路由 */
  function stop() {
    if (mode.value === 'deploy') stopDeploy()
    else if (mode.value === 'preview') stopPreviewStream()
  }

  function startDeploy() {
    // 注意：确认弹窗由调用方 (DeployView) 触发，避免在 store 内访问浏览器 API
    if (running.value) return
    clear()
    mode.value = 'deploy'
    status.value = 'running'
    running.value = true
    runStartedAt = Date.now()
    runErrorSummary = ''
    pushLine('info', '▶ 启动一键部署…')
    deployCancel = api.deploy((ev) => {
      if (ev.kind === 'done') {
        // 已被用户主动 stop 的情况下，不要用后端 done 事件覆盖 stopped 状态
        if (status.value === 'stopped') {
          deployCancel = null
          return
        }
        status.value = ev.ok ? 'success' : 'error'
        pushLine('done', ev.line)
        running.value = false
        pushHistory('deploy', status.value, lines.value.length)
        deployCancel = null
      } else {
        pushLine(ev.kind, ev.line)
      }
    })
  }
  function startPreview() {
    if (running.value) return
    clear()
    mode.value = 'preview'
    status.value = 'running'
    running.value = true
    runStartedAt = Date.now()
    runErrorSummary = ''
    pushLine('info', '▶ 启动本地预览（pnpm post s --open）…')
    // 启动前先确保 backend preview 进程是干净的（双重保险）
    api.stopPreview().catch(() => {})
    previewCancel = api.startPreview((ev) => {
      if (ev.kind === 'done') {
        if (status.value === 'stopped') {
          previewCancel = null
          return
        }
        status.value = ev.ok ? 'success' : 'error'
        pushLine('done', ev.line)
        running.value = false
        previewRunning.value = !!ev.ok
        pushHistory('preview', status.value, lines.value.length)
        previewCancel = null
      } else {
        pushLine(ev.kind, ev.line)
      }
    })
  }
  /** 重试最近一次失败：可指定 mode，否则根据最近一条历史 */
  function retryLast(targetMode?: Exclude<Mode, null>) {
    if (running.value) return
    const m = targetMode ?? history.value[0]?.mode
    if (m === 'deploy') startDeploy()
    else if (m === 'preview') startPreview()
  }
  /** 复制某条历史的错误摘要 */
  function copyHistorySummary(item: HistoryItem) {
    if (!item.errorSummary) return false
    try { void navigator.clipboard.writeText(item.errorSummary); return true } catch { return false }
  }
  /** 通过 REST 接口停止预览后端进程（与 SSE 流解耦） */
  async function stopPreview() {
    try {
      const r = await api.stopPreview()
      previewRunning.value = false
      pushLine('info', r.killed ? '⏹ 已停止预览' : '⚠ 预览未运行')
    } catch (e) {
      pushLine('error', e instanceof Error ? e.message : String(e))
    }
  }
  async function refreshPreviewStatus() {
    try {
      const r = await api.previewStatus()
      previewRunning.value = r.running
    } catch { /* noop */ }
  }

  return {
    mode, running, status, lines, previewRunning, history,
    clear, pushLine, stop, stopDeploy, stopPreviewStream,
    startDeploy, startPreview, stopPreview, refreshPreviewStatus,
    retryLast, copyHistorySummary
  }
})

export const useToastStore = defineStore('toast', () => {
  interface Toast { id: number; type: 'success' | 'error' | 'info' | 'warning'; message: string }
  const items = ref<Toast[]>([])
  let seq = 0

  function push(type: Toast['type'], message: string) {
    const id = ++seq
    items.value.push({ id, type, message })
    setTimeout(() => remove(id), 4000)
  }

  function remove(id: number) {
    items.value = items.value.filter((t) => t.id !== id)
  }

  return {
    items,
    success: (m: string) => push('success', m),
    error: (m: string) => push('error', m),
    info: (m: string) => push('info', m),
    warning: (m: string) => push('warning', m),
    remove
  }
})
