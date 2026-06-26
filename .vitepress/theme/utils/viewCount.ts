/**
 * 访问量统计工具
 *
 * 主统计：busuanzi（云持久化）
 *   - 站点 PV：busuanzi_site_pv（单用户每访问一次 +1）
 *   - 站点 UV：busuanzi_site_uv（单用户每天只计 1 次）
 *   - 页面 PV：busuanzi_page_pv（单用户每访问一次本页面 +1）
 *
 * 降级统计：localStorage（busuanzi 不可用时兜底）
 *   - 文章计数：按 slug 累计 +1（sessionStorage 去重）
 *   - 容量安全：最多 500 条，旧条目自动淘汰
 *
 * SSR 安全：所有 DOM / 存储访问通过 typeof window 保护
 */

const STORAGE_KEY = 'fpb:view-counts:v1'
const MAX_ENTRIES = 500
const SESSION_DEDUPE_KEY = 'fpb:article-session:v1'

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

// ========== busuanzi 检测 ==========

/** 检测 busuanzi 是否已加载成功 */
export function isBusuanziLoaded(): boolean {
  if (!isBrowser()) return false
  return typeof (window as unknown as { busuanzi?: unknown }).busuanzi !== 'undefined'
}

/** 等待 busuanzi 加载（最多 5 秒） */
export function waitBusuanzi(timeout: number = 5000): Promise<boolean> {
  if (!isBrowser()) return Promise.resolve(false)
  if (isBusuanziLoaded()) return Promise.resolve(true)
  return new Promise((resolve) => {
    const startTime = Date.now()
    const check = () => {
      if (isBusuanziLoaded()) {
        resolve(true)
        return
      }
      if (Date.now() - startTime >= timeout) {
        resolve(false)
        return
      }
      setTimeout(check, 100)
    }
    check()
  })
}

// ========== 文章计数（本地 localStorage 降级） ==========

/**
 * 给指定 slug 累计 +1（本地计数）
 * - 通过 sessionStorage 防止同一会话内重复计数
 * - busuanzi 不可用时作为降级方案
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