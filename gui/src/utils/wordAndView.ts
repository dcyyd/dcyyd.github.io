/**
 * 浏览量 & 字数统计工具（GUI + 前端共享 localForage 键）
 *
 * 存储键：fpb:view-counts:v1（与 .vitepress/theme/utils/viewCount.ts 共用）
 * - 同一设备同一文章每次进入详情页 +1（sessionStorage 去重由前端 PostPage 控制）
 * - 容量安全：最多 500 条，旧条目自动淘汰
 * - SSR 安全：所有访问通过 typeof window 保护
 */
import { calculateEditorStats } from './editorStats'

const STORAGE_KEY = 'fpb:view-counts:v1'
const MAX_ENTRIES = 500

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

/** 单篇文章浏览量 */
export function getViewCount(slug: string): number {
  if (!slug) return 0
  return load().entries[slug] ?? 0
}

/** 全部文章 → 浏览量映射（一次读取，适合批量计算） */
export function getAllViewCounts(): Record<string, number> {
  return { ...load().entries }
}

/** 站点累计总访问量（所有文章浏览量之和） */
export function getTotalViewCount(): number {
  return Object.values(load().entries).reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0)
}

/** 格式化数字 · 1000 → 1k，10000 → 1w（中文站点风格） */
export function formatViewCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}w`
}

/** 字数统计（与站点 readingTime 一致） */
export function getWordCount(markdown: string): number {
  return calculateEditorStats(markdown ?? '').words
}
