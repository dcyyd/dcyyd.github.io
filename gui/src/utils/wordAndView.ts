/**
 * FilesView 列表所用的轻量计算工具
 * 避免重复读 viewCount.ts 的内部结构
 */
import { calculateEditorStats } from './editorStats'

const VIEW_KEY = 'fpb:view-counts:v1'

interface ViewStore { updatedAt: number; entries: Record<string, number> }

function read(): ViewStore {
  if (typeof window === 'undefined') return { updatedAt: 0, entries: {} }
  try {
    const raw = window.localStorage.getItem(VIEW_KEY)
    if (!raw) return { updatedAt: 0, entries: {} }
    const obj = JSON.parse(raw)
    if (obj && typeof obj === 'object' && obj.entries) return obj as ViewStore
  } catch { /* noop */ }
  return { updatedAt: 0, entries: {} }
}

export function getViewCount(slug: string): number {
  if (!slug) return 0
  return read().entries[slug] || 0
}

export function getWordCount(markdown: string): number {
  return calculateEditorStats(markdown ?? '').words
}
