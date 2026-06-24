/**
 * 编辑器实时统计工具
 * - 中文字符按 1 字计数，拉丁词按 1 词计数（与站点 readingTime 保持一致）
 * - 提取 h1/h2/h3 大纲用于目录预览
 */

const chineseCharPattern = /[\u4e00-\u9fff]/gu
const latinWordPattern = /[a-zA-Z0-9_]+/gu
const codeBlockPattern = /```[\s\S]*?```/gu
const inlineCodePattern = /`[^`\n]*`/gu
const imagePattern = /!\[[^\]]*\]\([^)]*\)/gu
const linkPattern = /\[([^\]]+)\]\([^)]*\)/gu

function stripNoise(md: string): string {
  return md
    .replace(codeBlockPattern, '')
    .replace(inlineCodePattern, '')
    .replace(imagePattern, '')
    .replace(linkPattern, '$1')
}

export interface EditorStats {
  /** 原始字符数（去除空白） */
  chars: number
  /** 词数（中文字符 + 拉丁词） */
  words: number
  /** 中文汉字数 */
  chinese: number
  /** 英文/数字词数 */
  latin: number
  /** 行数（≥ 1） */
  lines: number
  /** 预计阅读时长（分钟） */
  readingTime: number
}

export function calculateEditorStats(markdown: string): EditorStats {
  const text = stripNoise(markdown ?? '')
  const chinese = text.match(chineseCharPattern)?.length ?? 0
  const latin = text.match(latinWordPattern)?.length ?? 0
  const words = chinese + latin
  const chars = (markdown ?? '').replace(/\s+/g, '').length
  const lines = Math.max(1, (markdown ?? '').split('\n').length)
  const readingTime = Math.max(1, Math.ceil(words / 200))
  return { chars, words, chinese, latin, lines, readingTime }
}

export interface OutlineItem {
  level: 1 | 2 | 3
  text: string
  /** 在原文中作为锚点的 offset 位置，用于点击跳转 */
  offset: number
}

/** 提取 markdown 标题大纲（仅 h1-h3，文本保留，去掉 # 与尾随空白） */
export function extractOutline(markdown: string): OutlineItem[] {
  if (!markdown) return []
  const lines = markdown.split('\n')
  const items: OutlineItem[] = []
  let offset = 0
  for (const line of lines) {
    const m = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line)
    if (m) {
      items.push({
        level: m[1]!.length as 1 | 2 | 3,
        text: m[2]!.trim(),
        offset
      })
    }
    offset += line.length + 1
  }
  return items
}
