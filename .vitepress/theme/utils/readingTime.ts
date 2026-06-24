const chineseCharPattern = /[\u4e00-\u9fff]/gu
const latinWordPattern = /[a-zA-Z0-9_]+/gu

/** 去除代码块/行内代码/图片/链接，保留纯文本，供字数与阅读时长统计共用 */
function stripMarkdownNoise(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/gu, '')
    .replace(/`[^`]*`/gu, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, '')
    .replace(/\[[^\]]*\]\([^)]*\)/gu, '')
}

export function calculateWordCount(markdown: string): number {
  const text = stripMarkdownNoise(markdown)
  const chineseCount = text.match(chineseCharPattern)?.length ?? 0
  const latinCount = text.match(latinWordPattern)?.length ?? 0
  return chineseCount + latinCount
}

export function calculateReadingTime(markdown: string): number {
  const text = stripMarkdownNoise(markdown)
  const chineseCount = text.match(chineseCharPattern)?.length ?? 0
  const latinCount = text.match(latinWordPattern)?.length ?? 0
  const totalWords = chineseCount + latinCount

  return Math.max(1, Math.ceil(totalWords / 200))
}
