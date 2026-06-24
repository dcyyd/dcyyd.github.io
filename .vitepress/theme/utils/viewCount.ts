/**
 * 访问量统计 · 客户端轻量方案
 *
 * 存储：localStorage（按 slug 累计 +1）
 * - 同一设备同一文章每次进入详情页 +1
 * - 容量安全：仅缓存最近 500 条，旧的会被淘汰
 * - SSR 安全：所有访问通过 typeof window 保护
 *
 * 设计取舍：纯前端统计无后端，可在后续接入自建 API（如 `/api/views/:slug`）
 *          升级为全局访问量；本工具仅做最简的本地实现。
 */

const STORAGE_KEY = 'fpb:view-counts:v1'
const MAX_ENTRIES = 500
const SESSION_DEDUPE_KEY = 'fpb:view-session:v1'

interface ViewCounts {
  updatedAt: number
  entries: Record<string, number>
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function load(): ViewCounts {
  if (!isBrowser()) return { updatedAt: 0, entries: {} }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { updatedAt: 0, entries: {} }
    const parsed = JSON.parse(raw) as Partial<ViewCounts>
    return {
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
      entries: parsed.entries && typeof parsed.entries === 'object' ? parsed.entries : {}
    }
  } catch {
    return { updatedAt: 0, entries: {} }
  }
}

function persist(data: ViewCounts): void {
  if (!isBrowser()) return
  try {
    // 限容：超过上限时按 updatedAt 之前的项先丢弃
    const keys = Object.keys(data.entries)
    if (keys.length > MAX_ENTRIES) {
      const overflow = keys.length - MAX_ENTRIES
      for (let i = 0; i < overflow; i++) {
        const k = keys[i]
        if (k) delete data.entries[k]
      }
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage 满/被禁，静默忽略
  }
}

/** 读取某 slug 的本地累计访问次数（不写入） */
export function getViewCount(slug: string): number {
  if (!slug) return 0
  const data = load()
  return data.entries[slug] ?? 0
}

/** 读取所有本地访问次数映射 */
export function getAllViewCounts(): Record<string, number> {
  return { ...load().entries }
}

/**
 * 给指定 slug 累计 +1
 * - 通过 sessionStorage 防止同一会话内（标签切换/前进后退）重复计数
 * - 写入失败时静默返回 false
 */
export function incrementViewCount(slug: string): number {
  if (!slug) return 0
  if (!isBrowser()) return 0
  try {
    const sessionRaw = window.sessionStorage.getItem(SESSION_DEDUPE_KEY)
    const sessionSet: Set<string> = sessionRaw ? new Set(JSON.parse(sessionRaw)) : new Set()
    if (sessionSet.has(slug)) {
      return getViewCount(slug)
    }
    sessionSet.add(slug)
    window.sessionStorage.setItem(SESSION_DEDUPE_KEY, JSON.stringify([...sessionSet]))
  } catch {
    // sessionStorage 不可用时退化为每次都 +1
  }

  const data = load()
  const current = data.entries[slug] ?? 0
  const next = current + 1
  data.entries[slug] = next
  data.updatedAt = Date.now()
  persist(data)
  return next
}

/** 格式化数字 · 1000 → 1k，10000 → 1w（中文站点风格） */
export function formatViewCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}w`
}

/** 格式化字数 · 1200 → 1.2k，12345 → 1.2w */
export function formatWordCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}w`
}
