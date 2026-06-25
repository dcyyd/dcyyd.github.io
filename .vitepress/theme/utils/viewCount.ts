/**
 * 访问量统计 · 全局实时计数 + 本地文章计数
 *
 * 全局计数：countapi.xyz（免费、无需注册、全局唯一累加器）
 *   - 每会话首次进入任意页面 hit 一次（sessionStorage 去重）
 *   - 定时轮询读取全局值，维持实时显示
 *   - API 不可用时降级为 localStorage 本地计数
 *
 * 文章计数：localStorage（按 slug 累计 +1）
 *   - 同一设备同一文章每次进入详情页 +1
 *   - 容量安全：仅缓存最近 500 条，旧的会被淘汰
 *   - 同一会话内标签切换/前进后退不重复计数（sessionStorage 去重）
 *
 * SSR 安全：所有 DOM / 存储访问通过 typeof window 保护
 */

const STORAGE_KEY = 'fpb:view-counts:v1'
const MAX_ENTRIES = 500
const SESSION_DEDUPE_KEY = 'fpb:article-session:v1'
const GLOBAL_HIT_SESSION_KEY = 'fpb:global-hit:v1'

// countapi.xyz 全局计数器配置
const GLOBAL_NS = 'dcyyd-github-io'
const GLOBAL_KEY = 'site-visits'
const COUNTAPI_BASE = 'https://api.countapi.xyz'

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
  return load().entries[slug] ?? 0
}

/** 读取所有本地访问次数映射 */
export function getAllViewCounts(): Record<string, number> {
  return { ...load().entries }
}

/** 站点累计总访问量（localStorage 本地兜底值） */
export function getTotalViewCount(): number {
  return Object.values(load().entries).reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0)
}

// ========== 全局实时计数（countapi.xyz） ==========

/** 当前会话是否已 hit 全局计数器 */
function globalHitInThisSession(): boolean {
  if (!isBrowser()) return true
  try {
    return window.sessionStorage.getItem(GLOBAL_HIT_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function markGlobalHitSession(): void {
  if (!isBrowser()) return
  try {
    window.sessionStorage.setItem(GLOBAL_HIT_SESSION_KEY, '1')
  } catch {
    // 静默
  }
}

/**
 * 向全局计数器 hit +1，返回最新值
 * - 同一会话（浏览器标签页组）内只 hit 一次
 * - 返回当前全局累计值；失败时返回 0
 */
export async function hitGlobalViewCount(): Promise<number> {
  if (globalHitInThisSession()) {
    // 已 hit 过本会话，直接读取当前值
    return fetchGlobalViewCount()
  }
  if (!isBrowser()) return 0
  try {
    const url = `${COUNTAPI_BASE}/hit/${GLOBAL_NS}/${GLOBAL_KEY}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return 0
    const data = (await res.json()) as { value?: number }
    markGlobalHitSession()
    return typeof data.value === 'number' ? data.value : 0
  } catch {
    return 0
  }
}

/**
 * 读取全局计数器当前值（不 +1）
 * - countapi.xyz 不可用时降级为 localStorage 本地累计
 */
export async function fetchGlobalViewCount(): Promise<number> {
  if (!isBrowser()) return 0
  try {
    const url = `${COUNTAPI_BASE}/get/${GLOBAL_NS}/${GLOBAL_KEY}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return getTotalViewCount()
    const data = (await res.json()) as { value?: number }
    return typeof data.value === 'number' ? data.value : getTotalViewCount()
  } catch {
    return getTotalViewCount()
  }
}

// ========== 文章计数（本地 localStorage） ==========

/**
 * 给指定 slug 累计 +1（本地计数）
 * - 通过 sessionStorage 防止同一会话内重复计数
 * - 同时异步 hit 全局计数器（首次访问时）
 */
export function incrementViewCount(slug: string): number {
  if (!slug) return 0
  if (!isBrowser()) return 0

  // 异步 hit 全局计数器（不阻塞返回值）
  hitGlobalViewCount()

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
