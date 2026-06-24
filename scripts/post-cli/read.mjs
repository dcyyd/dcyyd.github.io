/**
 * read · 打印指定文章的 frontmatter + 正文摘要
 */

import { readPostFile } from './frontmatter.mjs'
import { blank, heading, ui } from './ui.mjs'
import { fail, prompt } from './ui.mjs'
import { validateSlug } from './validate.mjs'

export async function runRead(positional, flags) {
  heading(ui.bold(ui.cyan('📖  文章详情')))

  let slugInput = positional[0] || flags.slug
  if (!slugInput) {
    slugInput = await prompt('文章 slug', { defaultValue: null })
  }
  if (!slugInput) {
    throw fail('请提供文章 slug。', { hint: '使用 "pnpm post list" 查看现有文章。', exitCode: 2 })
  }
  const slug = validateSlug(slugInput)

  const { frontmatter, body, filePath } = await readPostFile(slug)

  process.stdout.write(`${ui.dim('文件:')} ${filePath}\n`)
  process.stdout.write(`${ui.dim('slug:')} ${ui.cyan(slug)}\n\n`)

  process.stdout.write(`${ui.bold('Frontmatter')}\n`)
  process.stdout.write(`${ui.dim('-'.repeat(40))}\n`)
  for (const [k, v] of Object.entries(frontmatter)) {
    if (v == null) continue
    if (Array.isArray(v)) {
      process.stdout.write(`${k}: ${v.map(ui.cyan).join(', ')}\n`)
    } else {
      process.stdout.write(`${k}: ${v}\n`)
    }
  }

  blank()
  process.stdout.write(`${ui.bold('Body 前 10 行')}\n`)
  process.stdout.write(`${ui.dim('-'.repeat(40))}\n`)
  const head = body.split('\n').slice(0, 10).join('\n')
  process.stdout.write(head + (body.split('\n').length > 10 ? '\n…' : ''))
  blank()
}
