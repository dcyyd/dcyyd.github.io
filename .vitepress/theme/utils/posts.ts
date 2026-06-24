import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { CategoryInfo, PostDetail, PostFrontmatter, PostLink, TagInfo, YearArchive } from '../types/blog'
import { formatDate, toIsoDate } from './date'
import { createExcerpt, extractTitle } from './excerpt'
import { renderMarkdownToSafeAst } from './markdown'
import { toPostMeta } from './postMeta'
import { calculateReadingTime, calculateWordCount } from './readingTime'
import { filenameToSlug, tagToSlug } from './slug'

interface CachedPost {
  mtimeMs: number
  post: Omit<PostDetail, 'previous' | 'next'>
}

interface CollectionCache {
  signature: string
  posts: PostDetail[]
}

const postsDirectory = path.join(process.cwd(), 'content', 'posts')
const fileCache = new Map<string, CachedPost>()
let collectionCache: CollectionCache | null = null

export function getAllPosts(): PostDetail[] {
  ensurePostsDirectory()
  const markdownFiles = getMarkdownFiles(postsDirectory)
  const signature = markdownFiles
    .map((filePath) => `${filePath}:${fs.statSync(filePath).mtimeMs}`)
    .join('|')

  if (collectionCache?.signature === signature) return collectionCache.posts

  const parsedPosts = markdownFiles
    .map(parsePostFile)
    .filter((post) => post !== null)
    .sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime())

  const posts = parsedPosts.map((post, index, list): PostDetail => ({
    ...post,
    previous: toPostLink(list[index + 1]),
    next: toPostLink(list[index - 1])
  }))

  collectionCache = { signature, posts }
  return posts
}

export function getPostBySlug(slug: string): PostDetail | undefined {
  return getAllPosts().find((post) => post.slug === slug)
}

export function getAllTags(): TagInfo[] {
  const counter = new Map<string, number>()

  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      counter.set(tag, (counter.get(tag) ?? 0) + 1)
    }
  }

  return [...counter.entries()]
    .map(([name, count]) => ({ name, slug: tagToSlug(name), count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

export function getAllCategories(): CategoryInfo[] {
  const counter = new Map<string, number>()

  for (const post of getAllPosts()) {
    if (!post.category) continue
    counter.set(post.category, (counter.get(post.category) ?? 0) + 1)
  }

  return [...counter.entries()]
    .map(([name, count]) => ({ name, slug: tagToSlug(name), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
}

export function getPostsByTagSlug(tagSlug: string): PostDetail[] {
  const tag = getAllTags().find((item) => item.slug === tagSlug)
  if (!tag) return []
  return getAllPosts().filter((post) => post.tags.includes(tag.name))
}

export function getPostsByCategorySlug(categorySlug: string): PostDetail[] {
  const category = getAllCategories().find((item) => item.slug === categorySlug)
  if (!category) return []
  return getAllPosts().filter((post) => post.category === category.name)
}

export function getYearArchives(): YearArchive[] {
  const groups = new Map<number, PostDetail[]>()

  for (const post of getAllPosts()) {
    const year = new Date(post.isoDate).getFullYear()
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(post)
  }

  return [...groups.entries()]
    .map(([year, posts]) => ({
      year,
      count: posts.length,
      posts: posts.map(toPostMeta)
    }))
    .sort((a, b) => b.year - a.year)
}

function parsePostFile(filePath: string): Omit<PostDetail, 'previous' | 'next'> | null {
  const stat = fs.statSync(filePath)
  const cached = fileCache.get(filePath)
  if (cached && cached.mtimeMs === stat.mtimeMs) return cached.post

  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = matter(raw)
  const frontmatter = normalizeFrontmatter(parsed.data)
  if (frontmatter.draft === true) return null

  const slug = filenameToSlug(path.basename(filePath))
  const fallbackTitle = extractTitle(parsed.content, slug)
  const isoDate = toIsoDate(frontmatter.date ?? stat.mtime)
  const title = frontmatter.title ?? fallbackTitle
  const descriptionRaw = frontmatter.description ?? (frontmatter as Record<string, unknown>).summary
  const description = typeof descriptionRaw === 'string' && descriptionRaw.trim()
    ? descriptionRaw.trim()
    : createExcerpt(parsed.content)
  const tags = frontmatter.tags ?? []
  const category = frontmatter.category ?? ''

  const post: Omit<PostDetail, 'previous' | 'next'> = {
    title,
    description,
    date: formatDate(isoDate),
    isoDate,
    slug,
    url: `/posts/${slug}`,
    tags,
    category,
    readingTime: calculateReadingTime(parsed.content),
    wordCount: calculateWordCount(parsed.content),
    excerpt: createExcerpt(parsed.content),
    hasFrontmatter: Object.keys(parsed.data).length > 0,
    cover: frontmatter.cover,
    markdown: parsed.content,
    content: renderMarkdownToSafeAst(parsed.content)
  }

  fileCache.set(filePath, { mtimeMs: stat.mtimeMs, post })
  return post
}

function normalizeFrontmatter(data: Record<string, unknown>): PostFrontmatter {
  return {
    title: typeof data.title === 'string' ? data.title : undefined,
    description: typeof data.description === 'string' ? data.description : undefined,
    date: typeof data.date === 'string' ? data.date : undefined,
    tags: Array.isArray(data.tags)
      ? data.tags.filter((tag): tag is string => typeof tag === 'string')
      : undefined,
    category: typeof data.category === 'string' ? data.category : undefined,
    draft: typeof data.draft === 'boolean' ? data.draft : undefined,
    cover: typeof data.cover === 'string' ? data.cover : undefined
  }
}

function getMarkdownFiles(directory: string): string[] {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return getMarkdownFiles(entryPath)
      if (entry.isFile() && entry.name.endsWith('.md')) return [entryPath]
      return []
    })
    .sort((a, b) => a.localeCompare(b))
}

function ensurePostsDirectory(): void {
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true })
  }
}

function toPostLink(post: Omit<PostDetail, 'previous' | 'next'> | undefined): PostLink | undefined {
  if (!post) return undefined
  return {
    title: post.title,
    slug: post.slug,
    url: post.url,
    date: post.date
  }
}

