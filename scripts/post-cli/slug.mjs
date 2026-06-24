/**
 * 工具函数：与 .vitepress/theme/utils/slug.ts 保持同语义
 * 这样 CLI 生成的 slug 与项目运行时路由一致。
 */

const unsafeChars = /[^\p{L}\p{N}]+/gu
const duplicateDash = /-{2,}/g

export function slugify(value) {
  const normalized = String(value ?? '')
    .trim()
    .normalize('NFKD')
    .replace(unsafeChars, '-')
    .replace(duplicateDash, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  return normalized.length > 0 ? normalized : 'post'
}

/**
 * 从原始输入生成 slug：
 *  - 已是合法 slug 则原样返回
 *  - 否则 slugify
 */
export function ensureSlug(input) {
  if (!input) return null
  const cleaned = String(input).trim().replace(/\.md$/u, '')
  return slugify(cleaned)
}

/**
 * tag 列表归一：支持逗号或空格分隔；去空、去重、保留顺序
 */
export function parseTags(input) {
  if (input == null) return []
  if (Array.isArray(input)) {
    return [...new Set(input.map((t) => String(t).trim()).filter(Boolean))]
  }
  return [
    ...new Set(
      String(input)
        .split(/[,\uFF0C\s]+/u)
        .map((t) => t.trim())
        .filter(Boolean)
    )
  ]
}
