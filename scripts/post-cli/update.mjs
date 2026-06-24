/**
 * update · 更新已有文章的 frontmatter
 *
 * 用法:
 *   pnpm post update <slug> --title "新标题"
 *   pnpm post update <slug> --tags "vue3,typescript" --append-tags
 *   pnpm post update <slug> --remove-tag "deprecated"
 *
 * 行为:
 *  - 缺省的字段保持不变
 *  - 传 --key "" (空字符串) 等同显式置空（会被序列化器剔除）
 *  - --append-tags 走追加合并
 *  - --remove-tag <name> 走移除
 *  - 自动维护 updated 字段
 */

import path from 'node:path'

import { POSTS_DIR, readPostFile, writePostFile, mergeFrontmatter } from './frontmatter.mjs'
import { ensureSlug, parseTags } from './slug.mjs'
import { normalizeDate, todayIso, validateSlug } from './validate.mjs'
import { fail, info, success, prompt, ui, blank, heading } from './ui.mjs'

export async function runUpdate(positional, flags) {
  heading(ui.bold(ui.cyan('✎ 更新文章元数据')))

  // 1. slug
  let slugInput = positional[0] || flags.slug
  if (!slugInput) {
    slugInput = await prompt('要更新的文章 slug', { defaultValue: null })
  }
  if (!slugInput) {
    throw fail('请提供要更新的文章 slug。', {
      hint: '使用 "pnpm post update <slug>" 或 "pnpm post list" 查找。',
      exitCode: 2
    })
  }
  const slug = validateSlug(slugInput)
  const filePath = path.join(POSTS_DIR, `${slug}.md`)

  // 2. 读取
  const { frontmatter: old, body } = await readPostFile(slug)

  // 3. 计算 patch
  const patch = {}

  if ('title' in flags) patch.title = String(flags.title).trim()
  if ('description' in flags) {
    patch.description = String(flags.description).trim() || undefined
  }
  if ('date' in flags) patch.date = normalizeDate(flags.date)
  if ('author' in flags) {
    patch.author = String(flags.author).trim() || undefined
  }
  if ('category' in flags) {
    patch.category = String(flags.category).trim() || undefined
  }
  if ('cover' in flags) {
    patch.cover = String(flags.cover).trim() || undefined
  }
  if ('draft' in flags) {
    patch.draft = flags.draft === true || flags.draft === 'true' || undefined
  }

  // tags 处理顺序：先确定 current，再依次追加/移除/替换
  let currentTags = Array.isArray(old.tags) ? old.tags : []
  if ('tags' in flags) {
    // --tags 直接替换整组
    currentTags = parseTags(flags.tags)
  }
  if ('append-tags' in flags) {
    const appendList = parseTags(flags['append-tags'])
    currentTags = [...new Set([...currentTags, ...appendList])]
  }
  if ('remove-tag' in flags) {
    const removeList = parseTags(flags['remove-tag'])
    currentTags = currentTags.filter((t) => !removeList.includes(t))
  }
  // 仅当用户显式操作了 tags 时才落入 patch
  if ('tags' in flags || 'append-tags' in flags || 'remove-tag' in flags) {
    patch.tags = currentTags
  }
  // 兼容老变量名以复用 mergeFrontmatter
  const tagsMode = 'replace'

  // updated
  let updatedAt = null
  if ('updated' in flags) {
    if (flags.updated === '' || flags.updated === 'false') {
      patch.updated = null // 显式清除
    } else {
      patch.updated = normalizeDate(flags.updated)
      updatedAt = patch.updated
    }
  } else {
    updatedAt = todayIso()
  }

  if (Object.keys(patch).length === 0) {
    throw fail(
      '没有可更新的字段。',
      { hint: '使用 --title / --tags / --description 等显式指定要更新的字段。' }
    )
  }

  // 4. 预览
  blank()
  info(`${ui.bold('当前元数据')}:`)
  for (const [k, v] of Object.entries(old)) {
    info(`  ${ui.dim(k + ':')} ${formatValue(v)}`)
  }
  blank()
  info(`${ui.bold('将要应用')}:`)
  for (const [k, v] of Object.entries(patch)) {
    info(`  ${ui.dim(k + ':')} ${formatValue(v)}`)
  }
  blank()
  if (flags.yes !== true) {
    const ok = await prompt('确认写入？', { defaultValue: 'yes' })
    if (!(ok === null || /^y(es)?$/i.test(ok))) {
      info('已取消，未写入。')
      return
    }
  }

  const next = mergeFrontmatter(old, patch, { tagsMode, updatedAt })
  const written = await writePostFile({
    filePath,
    frontmatter: next,
    body,
    overwrite: true
  })

  blank()
  success(`已更新: ${ui.cyan(written)}`)
  info('VitePress HMR 会自动捕获变更，无需重启 dev server。')
}

function formatValue(v) {
  if (v == null) return ui.dim('(empty)')
  if (Array.isArray(v)) return v.length === 0 ? ui.dim('(empty)') : v.map((x) => ui.cyan(x)).join(', ')
  return String(v)
}
