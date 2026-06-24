/**
 * 校验：slug / 日期 / 必填字段
 */

import { slugify } from './slug.mjs'
import { fail } from './ui.mjs'

export function validateSlug(slug) {
  if (!slug) {
    throw fail('slug 不能为空。', { hint: '使用 --slug 参数或第一个位置参数传入。' })
  }
  const normalized = slugify(slug)
  if (normalized !== slug) {
    throw fail(
      `slug 含非法字符，已规范化为 "${normalized}"。请直接使用规范形式。`,
      { hint: 'slug 仅允许中英文字母与数字，以连字符分隔。' }
    )
  }
  if (normalized.length > 80) {
    throw fail('slug 长度不能超过 80 字符。')
  }
  return normalized
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u

export function normalizeDate(input) {
  if (input == null || input === '') return null
  const text = String(input).trim()
  if (text === 'today' || text === 'now') {
    return todayIso()
  }
  if (!ISO_DATE.test(text)) {
    throw fail(
      `日期格式错误: "${text}"`,
      { hint: '请使用 YYYY-MM-DD 格式，例如 2026-06-17；或使用 today / now。' }
    )
  }
  // 简单合法性
  const [y, m, d] = text.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    throw fail(`日期不合法: "${text}"`)
  }
  return text
}

export function todayIso() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
