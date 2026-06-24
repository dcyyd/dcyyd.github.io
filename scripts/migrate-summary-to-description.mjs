/**
 * 一次性迁移：把 frontmatter 中的 `summary` 字段转换为 `description`，
 * 然后删除 `summary` 行。
 * 用法: node scripts/migrate-summary-to-description.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')

async function main() {
  const names = await fs.readdir(POSTS_DIR)
  let count = 0
  for (const name of names) {
    if (!name.endsWith('.md')) continue
    const filePath = path.join(POSTS_DIR, name)
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = matter(raw)
    const fm = { ...parsed.data }
    if (typeof fm.summary !== 'string') continue
    // 折成单行
    const oneLine = fm.summary.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
    if (!fm.description && oneLine) fm.description = oneLine
    delete fm.summary
    const body = parsed.content ?? ''
    // 重新序列化（保留 body）
    const lines = ['---']
    for (const [k, v] of Object.entries(fm)) {
      if (v == null) continue
      if (Array.isArray(v)) {
        if (v.length === 0) continue
        lines.push(`${k}:`)
        for (const item of v) {
          const s = String(item)
          if (/[\n\r\t]/.test(s) || /^\s|\s$/.test(s) || /(^|\s)[:#&*!|>%@`]|\s:\s|^\d/.test(s)) {
            lines.push(`  - '${s.replace(/'/g, "''")}'`)
          } else {
            lines.push(`  - ${s}`)
          }
        }
        continue
      }
      if (typeof v === 'object') { lines.push(`${k}: ${JSON.stringify(v)}`); continue }
      if (typeof v === 'boolean' || typeof v === 'number') { lines.push(`${k}: ${v}`); continue }
      if (typeof v === 'string') {
        const s = v
        if (/[\n\r\t]/.test(s) || /^\s|\s$/.test(s) || /(^|\s)[:#&*!|>%@`]|\s:\s|^\d/.test(s)) {
          lines.push(`${k}: '${s.replace(/'/g, "''")}'`)
        } else {
          lines.push(`${k}: ${s}`)
        }
      }
    }
    lines.push('---')
    const out = lines.join('\n') + '\n' + body
    await fs.writeFile(filePath, out, 'utf-8')
    count++
    console.log(`✓ ${name}  (description: ${(fm.description ?? '').slice(0, 30)}…)`)
  }
  console.log(`\n共处理 ${count} 篇文章`)
}

main().catch((e) => { console.error(e); process.exit(1) })
