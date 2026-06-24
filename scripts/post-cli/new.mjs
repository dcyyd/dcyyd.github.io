/**
 * new · 在 content/posts/ 创建新文章
 *
 * 用法:
 *   pnpm post n <slug>
 *   pnpm post n <slug> -T "标题" -t "vue3,ts" --draft
 *   pnpm post n <slug> -o  (创建后自动用 VS Code 打开)
 *
 * 简写:
 *   -T --title    -d --description    -D --date
 *   -a --author   -c --category       -t --tags
 *   -C --cover    -o --open
 *
 * 交互式 fallback:
 *   - slug 缺失 → 提示输入
 *   - title 缺失 → 默认 "未命名文章: <slug>"
 */

import path from 'node:path'

import { buildBody } from './template.mjs'
import { POSTS_DIR, ensurePostsDir, writePostFile } from './frontmatter.mjs'
import { ensureSlug, parseTags } from './slug.mjs'
import { normalizeDate, todayIso, validateSlug } from './validate.mjs'
import { fail, info, success, prompt, ui, blank, heading, wordCount, readingTime } from './ui.mjs'
export async function runNew(positional, flags) {
  await ensurePostsDir()

  heading(ui.bold(ui.cyan('✚ 创建新文章')))

  // 1. slug
  let slugInput = positional[0] || flags.slug
  if (!slugInput) {
    slugInput = await prompt('文章 slug（仅字母/数字/连字符）', {
      defaultValue: flags.slug || null
    })
  }
  if (!slugInput) {
    throw fail('slug 是必填项。', { hint: '使用 "pnpm post n <slug>" 显式传入。', exitCode: 2 })
  }
  const slug = validateSlug(slugInput)
  const filePath = path.join(POSTS_DIR, `${slug}.md`)

  // 2. title
  let title = flags.title
  if (!title) {
    title = await prompt('文章标题', { defaultValue: `未命名文章：${slug}` })
  }
  title = (title || `未命名文章：${slug}`).trim()

  // 3. description
  let description = flags.description
  if (description === undefined) {
    description = await prompt('文章描述（可选）', { defaultValue: '' })
  }
  if (description) description = String(description).trim()

  // 4. date
  let date = flags.date ? normalizeDate(flags.date) : null
  if (flags.date) {
    date = normalizeDate(flags.date)
  } else {
    const ans = await prompt('发布日期（YYYY-MM-DD，today）', { defaultValue: 'today' })
    date = ans ? normalizeDate(ans) : todayIso()
  }
  if (!date) date = todayIso()

  // 5. author
  let author = flags.author
  if (author === undefined) {
    author = await prompt('作者（可选）', { defaultValue: '' })
  }
  if (author) author = String(author).trim()

  // 6. category
  let category = flags.category
  if (category === undefined) {
    category = await prompt('分类（可选）', { defaultValue: '' })
  }
  if (category) category = String(category).trim()

  // 7. tags
  let tags = parseTags(flags.tags)
  if (tags.length === 0) {
    const ans = await prompt('标签（逗号分隔，可选）', { defaultValue: '' })
    tags = parseTags(ans)
  }

  // 8. 草稿
  const draft = flags.draft === true || flags.draft === 'true'

  // 9. cover
  const cover = flags.cover ? String(flags.cover).trim() : undefined

  // 组装 frontmatter
  const frontmatter = {
    title,
    description: description || undefined,
    date,
    author: author || undefined,
    category: category || undefined,
    tags,
    cover,
    draft: draft || undefined
  }

  const body = buildBody({ title, slug, tags })
    .replace(/\{\{TODAY\}\}/gu, date)

  // 写入文件
  const written = await writePostFile({
    filePath,
    frontmatter,
    body,
    overwrite: flags.force === true
  })

  const wc = wordCount(body)
  const rt = readingTime(wc)

  blank()
  success(`已创建: ${ui.cyan(written)}`)
  blank()
  info(`slug:       ${ui.bold(slug)}`)
  info(`title:      ${title}`)
  if (tags.length > 0) info(`tags:       ${tags.map(ui.cyan).join(', ')}`)
  if (author) info(`author:     ${author}`)
  if (category) info(`category:   ${category}`)
  if (draft) info(`status:     ${ui.yellow('DRAFT')}`)
  info(`date:       ${date}`)
  info(`模板字数:   ${wc} 字  ·  约 ${rt} min 阅读`)
  blank()
  info('VitePress HMR 会自动捕获文件变更，无需重启 dev server。')

  // --open 用 VS Code 打开
  if (flags.open) {
    blank()
    info('正在用 VS Code 打开...')
    const { spawn } = await import('node:child_process')
    spawn('code', [filePath], { stdio: 'ignore', detached: true, shell: true }).unref()
  }
}
