/**
 * 生成 RSS 2.0 订阅源 (feed.xml)
 * 用法: pnpm rss
 *   站点信息请修改下方的 SITE 常量（也可通过 SITE_URL 环境变量覆盖）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// ============================================================
// 站点配置（可被环境变量覆盖）
// ============================================================
const SITE = {
  title: 'FilePress Blog',
  description: '零数据库 · 零 CMS · 纯 Markdown 文件驱动 · VitePress 技术博客。',
  // 站点主页：用于 <link> 与 <atom:link>。可通过 SITE_URL 环境变量覆盖。
  url: (process.env.SITE_URL || 'https://dcyyd.github.io').replace(/\/$/, ''),
  language: 'zh-CN',
  author: {
    name: '窦长友',
    email: 'dcyyd_kcug@yeah.net'
  },
  copyright: `© ${new Date().getFullYear()} 窦长友`
}

const POSTS_DIR = path.join(projectRoot, 'content', 'posts')
const FEED_PATH = path.join(projectRoot, 'public', 'feed.xml')

// ============================================================
// 工具函数
// ============================================================
function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cdata(value) {
  return `<![CDATA[${String(value ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(p)
    if (entry.isFile() && entry.name.endsWith('.md')) return [p]
    return []
  })
}

function toIsoDate(input, fallback) {
  if (!input) return new Date(fallback).toISOString()
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return new Date(fallback).toISOString()
  return d.toISOString()
}

function filenameToSlug(filename) {
  return filename
    .replace(/\.md$/u, '')
    .replace(/^\d+-/u, '')
    .replace(/^\[[^\]]+\]/u, '')
    .trim()
}

function createExcerpt(content, max = 160) {
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > max ? `${plain.slice(0, max).trim()}…` : plain
}

function extractTitle(content, fallback) {
  const m = content.match(/^\s*#\s+(.+)$/m)
  return m ? m[1].trim() : fallback
}

// ============================================================
// 加载并解析所有文章
// ============================================================
function loadPosts() {
  const files = walk(POSTS_DIR)
  const posts = files.map((file) => {
    const raw = fs.readFileSync(file, 'utf-8')
    const parsed = matter(raw)
    const fm = parsed.data || {}
    if (fm.draft === true) return null

    const slug = filenameToSlug(path.basename(file))
    const stat = fs.statSync(file)
    const isoDate = toIsoDate(fm.date, stat.mtime)
    const title = fm.title || extractTitle(parsed.content, slug)
    const description = fm.description || createExcerpt(parsed.content)
    return {
      title,
      description,
      isoDate,
      slug,
      url: `/posts/${slug}`,
      tags: Array.isArray(fm.tags) ? fm.tags.filter((t) => typeof t === 'string') : []
    }
  }).filter(Boolean)

  // 最新优先
  posts.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime())
  return posts
}

// ============================================================
// 生成 RSS XML
// ============================================================
function buildFeed(posts) {
  const buildDate = new Date().toUTCString()
  const items = posts.slice(0, 30).map((post) => {
    const link = `${SITE.url}${post.url}`
    const pubDate = new Date(post.isoDate).toUTCString()
    const categories = post.tags
      .map((tag) => `      <category>${escapeXml(tag)}</category>`)
      .join('\n')
    return `    <item>
      <title>${cdata(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(SITE.author.email)} (${escapeXml(SITE.author.name)})</author>
      <description>${cdata(post.description)}</description>
${categories}
    </item>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE.title)}</title>
    <link>${escapeXml(SITE.url)}</link>
    <description>${cdata(SITE.description)}</description>
    <language>${escapeXml(SITE.language)}</language>
    <copyright>${escapeXml(SITE.copyright)}</copyright>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${escapeXml(`${SITE.url}/feed.xml`)}" rel="self" type="application/rss+xml" />
    <generator>filepress-blog rss generator</generator>
${items}
  </channel>
</rss>
`
}

// ============================================================
// 入口
// ============================================================
function main() {
  console.log('[rss] 正在生成 feed.xml ...')
  const posts = loadPosts()
  const xml = buildFeed(posts)
  fs.mkdirSync(path.dirname(FEED_PATH), { recursive: true })
  fs.writeFileSync(FEED_PATH, xml, 'utf-8')
  console.log(`[rss] 已写入 ${path.relative(projectRoot, FEED_PATH)}（${posts.length} 篇文章）`)
}

main()
