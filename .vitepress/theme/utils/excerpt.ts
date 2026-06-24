export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^---[\s\S]*?---/u, '')
    .replace(/```[\s\S]*?```/gu, '')
    .replace(/\$\$[\s\S]*?\$\$/gu, '')
    .replace(/`([^`]*)`/gu, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/^#{1,6}\s+/gmu, '')
    .replace(/[>*_~|#-]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
}

export function extractTitle(markdown: string, fallback: string): string {
  const titleLine = markdown.split('\n').find((line) => /^#\s+/u.test(line.trim()))
  if (!titleLine) return fallback
  return titleLine.replace(/^#\s+/u, '').trim() || fallback
}

export function createExcerpt(markdown: string, length = 200): string {
  const text = stripMarkdown(markdown)
  return text.length > length ? `${text.slice(0, length)}…` : text
}
