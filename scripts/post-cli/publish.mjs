/**
 * publish · 将草稿文章转为正式发布
 *
 * 用法:
 *   pnpm post p <slug>              发布草稿（移除 draft 标记，更新 date）
 *   pnpm post p <slug> -D 2026-06-01 指定发布日期
 *   pnpm post p <slug> --yes        跳过确认
 *
 * 行为:
 *  - 仅对 draft: true 的文章生效
 *  - 移除 draft 标记，将 date 设为今天（或 --date 指定）
 *  - 自动设置 updated 字段
 *  - 已是非草稿的文章会给出提示
 */

import path from 'node:path'

import { POSTS_DIR, readPostFile, writePostFile, mergeFrontmatter } from './frontmatter.mjs'
import { validateSlug } from './validate.mjs'
import { todayIso, normalizeDate } from './validate.mjs'
import { fail, info, success, prompt, ui, blank, heading } from './ui.mjs'

export async function runPublish(positional, flags) {
  heading(ui.bold(ui.yellow('📢 发布草稿')))

  // 1. slug
  let slugInput = positional[0] || flags.slug
  if (!slugInput) {
    slugInput = await prompt('要发布的草稿 slug', { defaultValue: null })
  }
  if (!slugInput) {
    throw fail('请提供要发布的草稿 slug。', {
      hint: '使用 "pnpm post l --draft" 查看所有草稿。',
      exitCode: 2
    })
  }
  const slug = validateSlug(slugInput)

  // 2. 读取
  const { frontmatter, body, filePath } = await readPostFile(slug)

  // 3. 检查是否草稿
  if (!frontmatter.draft) {
    info(`文章 "${slug}" 不是草稿，无需发布。`)
    return
  }

  // 4. 确定发布日期
  const publishDate = flags.date ? normalizeDate(flags.date) : todayIso()

  blank()
  info(`${ui.bold('草稿信息')}:`)
  info(`  slug:     ${ui.cyan(slug)}`)
  info(`  title:    ${frontmatter.title || '(未命名)'}`)
  info(`  原日期:   ${frontmatter.date || '(无)'} → ${ui.green(publishDate)}`)
  blank()

  if (flags.yes !== true) {
    const ok = await prompt('确认发布？', { defaultValue: 'yes' })
    if (!(ok === null || /^y(es)?$/i.test(ok))) {
      info('已取消发布。')
      return
    }
  }

  // 5. 写入：移除 draft、更新日期、添加 updated
  const patch = {
    draft: false,
    date: publishDate,
    updated: todayIso()
  }
  const next = mergeFrontmatter(frontmatter, patch, { tagsMode: 'replace', updatedAt: todayIso() })
  // mergeFrontmatter 自动设置了 updated，但我们需确认 draft 已被移除
  delete next.draft

  const written = await writePostFile({
    filePath,
    frontmatter: next,
    body,
    overwrite: true
  })

  blank()
  success(`已发布: ${ui.cyan(written)}`)
  info(`发布日期: ${publishDate}`)
}
