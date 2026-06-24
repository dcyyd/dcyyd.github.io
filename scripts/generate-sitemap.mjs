/**
 * 生成 sitemap.xml
 *
 * 用法:
 *   pnpm sitemap
 *   pnpm build    # 已自动串联：typecheck → rss → sitemap → vitepress build
 *
 * 站点信息可通过环境变量覆盖：
 *   SITE_URL=https://dcyyd.github.io pnpm sitemap
 *
 * 输出: <root>/public/sitemap.xml
 *
 * URL 清单:
 *   - 静态页面（首页 / 博客 / 分类 / 归档 / 更新日志 / 友链 / 关于）
 *   - 每篇文章
 *   - 每个分类
 *   - 每个标签
 *   - RSS feed
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

// ============================================================
// 站点配置
// ============================================================
const SITE = {
  // 站点主页：可通过 SITE_URL 环境变量覆盖
  url: (process.env.SITE_URL || 'https://dcyyd.github.io').replace(/\/$/, ''),
  // 自部署项目页场景：传入 `https://user.github.io/project/` 时 BASE='project/'
  // 注意：BASE 末尾需带 `/`
  base: (process.env.SITE_BASE || '').replace(/^\/?/, '').replace(/\/?$/, '/')
}

// 输出路径
const POSTS_DIR = path.join(PROJECT_ROOT, 'content', 'posts')
const SITEMAP_PATH = path.join(PROJECT_ROOT, 'public', 'sitemap.xml')

// 静态页面（与 .vitepress/config.mts 中 nav 一致）
const STATIC_PAGES = [
  { loc: '/',          changefreq: 'daily',   priority: '1.0' },
  { loc: '/blog',      changefreq: 'daily',   priority: '0.9' },
  { loc: '/categories', changefreq: 'weekly', priority: '0.8' },
  { loc: '/archives',  changefreq: 'weekly',  priority: '0.7' },
  { loc: '/changelog', changefreq: 'weekly',  priority: '0.5' },
  { loc: '/friends',   changefreq: 'monthly', priority: '0.5' },
  { loc: '/about',     changefreq: 'monthly', priority: '0.6' }
]

// ============================================================
// 工具函数
// ============================================================

/** slugify 与 .vitepress/theme/utils/slug.ts 保持一致 */
const UNSAFE_CHARS = /[^\p{L}\p{N}]+/gu
const DUP_DASH = /-{2,}/g

function slugify(value) {
  const normalized = String(value ?? '')
    .trim()
    .normalize('NFKD')
    .replace(UNSAFE_CHARS, '-')
    .replace(DUP_DASH, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return normalized.length > 0 ? normalized : 'post'
}

function filenameToSlug(filename) {
  return slugify(filename.replace(/\.md$/u, ''))
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
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
  if (!input) return fallback
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return fallback
  return d.toISOString()
}

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true })
  }
}

// ============================================================
// 资源收集
// ============================================================

/** 读取所有 post 资源 */
function loadPosts() {
  ensurePostsDir()
  const files = walk(POSTS_DIR)

  const posts = []
  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = matter(raw)
    const fm = parsed.data || {}
    const stat = fs.statSync(filePath)
    const slug = filenameToSlug(path.basename(filePath))
    const isoDate = toIsoDate(fm.date, stat.mtime.toISOString())

    // 草稿不入索引
    if (fm.draft === true) continue

    posts.push({
      slug,
      title: typeof fm.title === 'string' ? fm.title : slug,
      description: typeof fm.description === 'string' ? fm.description : '',
      category: typeof fm.category === 'string' ? fm.category : '',
      tags: Array.isArray(fm.tags) ? fm.tags.filter(t => typeof t === 'string') : [],
      isoDate,
      mtime: stat.mtime.toISOString()
    })
  }

  // 倒序：与页面排序保持一致
  posts.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime())
  return posts
}

function uniqueSlugMap(values) {
  return [...new Set(values.filter(Boolean))].map(name => ({
    name,
    slug: slugify(name)
  }))
}

// ============================================================
// 渲染
// ============================================================

/** 拼接完整 URL：保证 base 末尾带 /，loc 始终以 / 开头 */
function buildUrl(loc) {
  const cleanLoc = loc.startsWith('/') ? loc : `/${loc}`
  return `${SITE.url}${SITE.base}${cleanLoc.replace(/^\/+/, '')}`
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const url = buildUrl(loc)
  return `  <url>
    <loc>${escapeXml(url)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ''}${priority ? `\n    <priority>${priority}</priority>` : ''}
  </url>`
}

function buildSitemap(posts) {
  const lines = []
  const now = new Date().toISOString()

  // 1. 静态页面
  for (const p of STATIC_PAGES) {
    lines.push(urlEntry({ ...p, lastmod: now }))
  }

  // 2. 文章
  for (const post of posts) {
    lines.push(urlEntry({
      loc: `/posts/${post.slug}`,
      lastmod: post.isoDate,
      changefreq: 'monthly',
      priority: '0.7'
    }))
  }

  // 3. 分类
  const categories = uniqueSlugMap(posts.map(p => p.category))
  for (const c of categories) {
    lines.push(urlEntry({
      loc: `/categories/${c.slug}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.6'
    }))
  }

  // 4. 标签
  const tags = uniqueSlugMap(posts.flatMap(p => p.tags))
  for (const t of tags) {
    lines.push(urlEntry({
      loc: `/tags/${t.slug}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.5'
    }))
  }

  // 5. RSS feed
  lines.push(urlEntry({
    loc: '/feed.xml',
    lastmod: now,
    changefreq: 'daily',
    priority: '0.4'
  }))

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${lines.join('\n')}
</urlset>
`
}

// ============================================================
// 入口
// ============================================================

function main() {
  console.log('[sitemap] 正在生成 sitemap.xml ...')
  const posts = loadPosts()
  const xml = buildSitemap(posts)
  fs.mkdirSync(path.dirname(SITEMAP_PATH), { recursive: true })
  fs.writeFileSync(SITEMAP_PATH, xml, 'utf-8')

  const urlCount = (xml.match(/<url>/g) || []).length
  console.log(`[sitemap] ✔ 已写入 ${SITEMAP_PATH}`)
  console.log(`[sitemap]   · 文章：${posts.length}`)
  console.log(`[sitemap]   · 分类：${uniqueSlugMap(posts.map(p => p.category)).length}`)
  console.log(`[sitemap]   · 标签：${uniqueSlugMap(posts.flatMap(p => p.tags)).length}`)
  console.log(`[sitemap]   · 站点 URL：${SITE.url}${SITE.base}`)
  console.log(`[sitemap]   · 合计 URL：${urlCount}`)
}

main()
