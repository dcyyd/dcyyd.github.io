/**
 * FilePress Blog GUI · 前端 API 客户端
 *
 * 设计：fetch + EventSource 封装 · 不引入 axios
 */

const BASE = '/api'

export interface PostSummary {
  slug: string
  filePath: string
  frontmatter: Record<string, unknown>
  body: string
  size: number
  mtime: number
}

export interface LogSummary {
  name: string
  size: number
  mtime: number
}

interface HealthResp {
  ok: boolean
  version: string
  postsDir: string
  running: string[]
}

interface ListPostsResp {
  ok: boolean
  count: number
  posts: PostSummary[]
}

interface GetPostResp { ok: boolean; post: PostSummary }
interface CreatePostResp { ok: boolean; post: PostSummary }
interface UpdatePostResp { ok: boolean; post: PostSummary }
interface DeletePostResp { ok: boolean; deleted: string }

interface ListLogsResp { ok: boolean; logs: LogSummary[] }
interface GetLogResp { ok: boolean; name: string; content: string; size: number }

interface PreviewStatusResp { ok: boolean; running: boolean; runningKeys: string[] }
interface PreviewStopResp { ok: boolean; killed: boolean }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  })
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = { ok: false, error: text } }
  if (!res.ok) {
    const err = (data as { error?: string })?.error ?? `HTTP ${res.status}`
    throw new Error(err)
  }
  // 即便 HTTP 200，业务层也可能在 body 中返回 ok:false（如文章不存在）
  if (data && typeof data === 'object' && (data as { ok?: boolean }).ok === false) {
    const err = (data as { error?: string })?.error ?? '业务请求失败'
    throw new Error(err)
  }
  return data as T
}

/** 日志事件（行 + 来源类型） */
export type LogKind = 'info' | 'stdout' | 'stderr' | 'error' | 'done'

export interface LogEvent {
  kind: LogKind
  line: string
  done?: boolean
  ok?: boolean
  code?: number
}

export function streamSse(
  path: string,
  onEvent: (ev: LogEvent) => void
): () => void {
  const es = new EventSource(BASE + path)
  const kinds: LogKind[] = ['info', 'stdout', 'stderr', 'error', 'done']
  for (const k of kinds) {
    es.addEventListener(k, (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as { line: string; code?: number; ok?: boolean }
        const ev: LogEvent = { kind: k, line: payload.line ?? '', done: k === 'done' }
        if (typeof payload.ok === 'boolean') ev.ok = payload.ok
        if (typeof payload.code === 'number') ev.code = payload.code
        onEvent(ev)
      } catch { /* noop */ }
      if (k === 'done' || k === 'error') {
        es.close()
      }
    })
  }
  es.onerror = () => {
    // 浏览器扩展偶发 message port closed — 静默忽略，由用户手动重试
    try { es.close() } catch { /* noop */ }
  }
  return () => es.close()
}

export const api = {
  health: () => request<HealthResp>('/health'),
  listPosts: () => request<ListPostsResp>('/posts'),
  getPost: (slug: string) => request<GetPostResp>('/posts/' + encodeURIComponent(slug)),
  createPost: (payload: { slug: string; frontmatter: Record<string, unknown>; body: string }) =>
    request<CreatePostResp>('/posts', { method: 'POST', body: JSON.stringify(payload) }),
  updatePost: (slug: string, payload: { frontmatter: Record<string, unknown>; body: string }) =>
    request<UpdatePostResp>('/posts/' + encodeURIComponent(slug), { method: 'PUT', body: JSON.stringify(payload) }),
  deletePost: (slug: string) =>
    request<DeletePostResp>('/posts/' + encodeURIComponent(slug), { method: 'DELETE' }),

  listLogs: () => request<ListLogsResp>('/logs'),
  getLog: (name: string) => request<GetLogResp>('/logs/' + encodeURIComponent(name)),

  // ---- SSE 流式任务 ----
  deploy: (onEvent: (ev: LogEvent) => void) => streamSse('/deploy', onEvent),
  cli: (cmd: 'list' | 'help', onEvent: (ev: LogEvent) => void) => streamSse('/cli/' + cmd, onEvent),

  // ---- 本地预览 ----
  startPreview: (onEvent: (ev: LogEvent) => void) => streamSse('/preview/start', onEvent),
  stopPreview: () => request<PreviewStopResp>('/preview/stop'),
  previewStatus: () => request<PreviewStatusResp>('/preview/status')
}
