/**
 * frontmatter 与文章文件读写。
 *
 * 设计目标：
 *  - 严格遵循项目现有的 frontmatter 顺序：title → description → date → tags → ...
 *  - YAML 序列化复用项目已装的 gray-matter（与构建期解析保持一致）
 *  - 文件不存在、权限不足时抛出 CLI 友好错误
 */

import { constants as fsConstants } from 'node:fs'
import fsAsync from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'

import { fail } from './ui.mjs'

export const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')

/** frontmatter 字段输出顺序（缺省时移除） */
const FRONTMATTER_ORDER = [
  'title',
  'description',
  'date',
  'updated',
  'author',
  'category',
  'tags',
  'cover',
  'draft'
]

/** 解析一个 .md 文件 */
export async function readPostFile(slug) {
  const filePath = path.join(POSTS_DIR, `${slug}.md`)
  let raw
  try {
    raw = await fsAsync.readFile(filePath, 'utf8')
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      throw fail(`文章不存在: ${slug}`, {
        hint: '使用 "pnpm post list" 查看现有文章。',
        exitCode: 3
      })
    }
    if (err && err.code === 'EACCES') {
      throw fail(`无权限读取文件: ${filePath}`, { exitCode: 4 })
    }
    throw err
  }
  const parsed = matter(raw)
  return {
    filePath,
    frontmatter: parsed.data || {},
    body: parsed.content || '',
    raw
  }
}

/**
 * 写入 .md 文件
 * @param {object} opts
 * @param {string} opts.filePath
 * @param {object} opts.frontmatter
 * @param {string} opts.body
 * @param {boolean} [opts.overwrite=false]
 */
export async function writePostFile({ filePath, frontmatter, body, overwrite = false }) {
  if (!overwrite) {
    try {
      await fsAsync.access(filePath)
      throw fail(`文件已存在: ${path.relative(process.cwd(), filePath)}`, {
        hint: '使用 update 命令修改，或显式传入 --force 覆盖。',
        exitCode: 5
      })
    } catch (err) {
      if (err && err.code !== 'ENOENT') throw err
    }
  } else {
    // overwrite 路径下文件缺失视为错误
    try {
      await fsAsync.access(filePath)
    } catch {
      throw fail(`文件不存在: ${path.relative(process.cwd(), filePath)}`, {
        hint: '使用 new 命令创建。',
        exitCode: 3
      })
    }
  }

  // 确保目录存在
  await fsAsync.mkdir(path.dirname(filePath), { recursive: true })

  const ordered = orderFrontmatter(frontmatter)
  const output = matter.stringify(body ?? '', ordered)

  try {
    await fsAsync.writeFile(filePath, output, 'utf8')
  } catch (err) {
    if (err && err.code === 'EACCES') {
      throw fail(`无权限写入文件: ${filePath}`, {
        hint: '检查文件 / 目录权限。',
        exitCode: 4
      })
    }
    if (err && err.code === 'ENOSPC') {
      throw fail('磁盘空间不足。', { exitCode: 6 })
    }
    throw err
  }

  return path.relative(process.cwd(), filePath)
}

/**
 * 字段按既定顺序输出；缺省值（如空数组、空字符串）不输出
 */
export function orderFrontmatter(data) {
  const result = {}
  for (const key of FRONTMATTER_ORDER) {
    if (!(key in data)) continue
    const value = data[key]
    if (value === undefined || value === null) continue
    if (Array.isArray(value) && value.length === 0) continue
    if (typeof value === 'string' && value.trim() === '') continue
    result[key] = value
  }
  // 兜底：保留其它未知字段
  for (const [k, v] of Object.entries(data)) {
    if (k in result) continue
    if (v === undefined || v === null) continue
    if (Array.isArray(v) && v.length === 0) continue
    if (typeof v === 'string' && v.trim() === '') continue
    result[k] = v
  }
  return result
}

/**
 * 合并 old + patch：
 *  - 显式传入的 key 覆盖
 *  - tags 走追加（除非传 --tags 时显式覆盖整个数组，由命令侧判断）
 *  - updated 字段若未传则自动设为今天
 */
export function mergeFrontmatter(oldData, patch, { tagsMode = 'replace', updatedAt = null } = {}) {
  const next = { ...oldData }

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    if (key === 'tags') {
      next.tags = tagsMode === 'append' && Array.isArray(oldData.tags)
        ? [...new Set([...oldData.tags, ...value])]
        : value
      continue
    }
    next[key] = value
  }

  if (updatedAt) {
    next.updated = updatedAt
  } else if ('updated' in patch && !patch.updated) {
    delete next.updated
  }

  return next
}

/**
 * 检查目录写权限 / 存在性（在 new 命令开始时预检，给出友好错误）
 */
export async function ensurePostsDir() {
  try {
    await fsAsync.access(POSTS_DIR, fsConstants.W_OK)
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      try {
        await fsAsync.mkdir(POSTS_DIR, { recursive: true })
        return
      } catch (mkdirErr) {
        throw fail(
          `content/posts 目录不存在且无法创建: ${POSTS_DIR}`,
          { hint: '请检查父目录权限。', exitCode: 7 }
        )
      }
    }
    if (err && err.code === 'EACCES') {
      throw fail(`content/posts 目录无写权限: ${POSTS_DIR}`, { exitCode: 4 })
    }
    throw err
  }
}
