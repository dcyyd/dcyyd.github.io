/**
 * list · 列出所有文章
 *
 * 选项:
 *   --json     以 JSON 输出
 *   --tag x    只显示含指定 tag 的文章
 *   --draft    包含草稿
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import matter from 'gray-matter'
import { POSTS_DIR } from './frontmatter.mjs'
import { blank, heading, ui, wordCount, readingTime } from './ui.mjs'

function formatDate(d) {
  if (!d) return '(无)'
  if (d instanceof Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return String(d)
}

export async function runList(_positional, flags) {
  let files
  try {
    files = await fs.readdir(POSTS_DIR)
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      if (flags.json) {
        process.stdout.write('[]\n')
        return
      }
      process.stdout.write(`${ui.dim('(content/posts 目录不存在)')}\n`)
      return
    }
    throw err
  }
  const mdFiles = files.filter((f) => f.endsWith('.md')).sort()

  const items = []
  for (const file of mdFiles) {
    const filePath = path.join(POSTS_DIR, file)
    const raw = await fs.readFile(filePath, 'utf8')
    const { data, content } = matter(raw)
    const wc = wordCount(content)
    const rt = readingTime(wc)
    items.push({
      slug: file.replace(/\.md$/u, ''),
      title: data.title || '(未命名)',
      date: data.date || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: data.author || '',
      draft: data.draft === true,
      words: wc,
      readingTime: Number(rt)
    })
  }

  const filtered = flags.tag
    ? items.filter((i) => i.tags.includes(flags.tag))
    : items
  const visible = flags.draft ? filtered : filtered.filter((i) => !i.draft)

  if (flags.json) {
    const output = visible.map(({ slug, title, date, tags, draft, words, readingTime }) => ({
      slug, title, date, tags, draft, words, readingTime
    }))
    process.stdout.write(JSON.stringify(output, null, 2) + '\n')
    return
  }

  heading(ui.bold(ui.cyan('☰  文章列表')))

  if (visible.length === 0) {
    process.stdout.write(`${ui.dim('(无匹配文章)')}\n`)
    return
  }

  // 表格输出
  const slugWidth = Math.max(4, ...visible.map((i) => i.slug.length))
  const tagWidth = Math.max(4, ...visible.map((i) => i.tags.map(t => `#${t}`).join(' ').length))
  process.stdout.write(
    `${ui.bold('STATUS')}  ${ui.bold('SLUG'.padEnd(slugWidth))}  ${ui.bold('DATE'.padEnd(12))}  ${ui.bold('WORDS')}  ${ui.bold('TITLE')}\n`
  )
  process.stdout.write(`${ui.dim('-'.repeat(slugWidth + 80))}\n`)
  for (const item of visible) {
    const status = item.draft ? ui.yellow(' D ') : ui.green(' ✓ ')
    const slug = ui.cyan(item.slug.padEnd(slugWidth))
    const dateStr = formatDate(item.date)
    const date = dateStr.padEnd(12)
    const words = String(item.words).padStart(4)
    const time = ui.dim(`${String(item.readingTime).padStart(2)}m`)
    const marker = item.draft ? ui.yellow(' [DRAFT]') : ''
    process.stdout.write(`${status}  ${slug}  ${date}  ${words}${time}  ${item.title}${marker}\n`)
  }
  blank()

  const totalWords = visible.reduce((s, i) => s + i.words, 0)
  const totalTime = readingTime(totalWords)
  process.stdout.write(`${ui.dim(`共 ${visible.length} 篇文章  ·  ${totalWords} 字  ·  约 ${totalTime} min 阅读`)}\n`)
}
