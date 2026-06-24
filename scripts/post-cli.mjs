#!/usr/bin/env node
/**
 * post-cli · VitePress 文件驱动博客的内容管理工具
 *
 * 用法:
 *   pnpm post n [slug] [options]        创建新文章 (new)
 *   pnpm post u <slug> [options]        更新文章元数据 (update)
 *   pnpm post p <slug>                  发布草稿 (publish)
 *   pnpm post d [options]               一键部署到 GitHub Pages (deploy)
 *   pnpm post l [options]               列出所有文章 (list)
 *   pnpm post r <slug>                  查看文章元数据 (read)
 *   pnpm post s [--port 8080]           启动开发服务器 (serve)
 *   pnpm post c                         清理构建缓存 (clean)
 *   pnpm post help [command]            查看帮助
 *
 * 设计原则:
 *   - 零外部依赖（仅用项目已装的 gray-matter）
 *   - 校验失败、文件已存在、权限错误等场景给出明确错误码
 *   - 内容更新通过文件系统落盘，Vite HMR 会自动捕获变更，无需重启 dev server
 */

import { runNew } from './post-cli/new.mjs'
import { runUpdate } from './post-cli/update.mjs'
import { runPublish } from './post-cli/publish.mjs'
import { runDeploy } from './post-cli/deploy.mjs'
import { runList } from './post-cli/list.mjs'
import { runRead } from './post-cli/read.mjs'
import { runServe } from './post-cli/serve.mjs'
import { printHelp, printCommandHelp } from './post-cli/help.mjs'
import { error, info, success, VERSION } from './post-cli/ui.mjs'

/** 命令别名映射：简写 → 全称 */
const ALIASES = {
  n: 'new',
  u: 'update',
  p: 'publish',
  d: 'deploy',
  l: 'list',
  r: 'read',
  s: 'serve',
  c: 'clean',
  server: 'serve',
  publish: 'publish',
  deploy: 'deploy'
}

const FULL_COMMANDS = new Set(['new', 'update', 'publish', 'deploy', 'list', 'read', 'serve', 'clean', 'help', '--help', '-h', '--version', '-v'])

/** 短选项映射：-x → --xxx */
const SHORT_FLAGS = {
  t: 'tags',
  T: 'title',
  d: 'description',
  D: 'date',
  a: 'author',
  c: 'category',
  C: 'cover',
  o: 'open',
  y: 'yes',
  f: 'force',
  m: 'message',
  p: 'port',
  h: 'host'
}

function resolveCommand(cmd) {
  if (!cmd) return cmd
  if (cmd.startsWith('-')) return cmd
  return ALIASES[cmd] || cmd
}

function isKnownCommand(cmd) {
  if (!cmd) return false
  if (cmd.startsWith('-')) return true
  return FULL_COMMANDS.has(cmd) || cmd in ALIASES
}

/**
 * 解析 argv 为 { command, positional, flags }
 * 支持 --key value / --key=value / --flag / -x value
 */
function parseArgs(argv) {
  const cmd = argv[2]
  const rest = argv.slice(3)
  const positional = []
  const flags = {}

  let i = 0
  for (; i < rest.length; i += 1) {
    const arg = rest[i]
    // 长选项
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=')
      if (eqIdx > -1) {
        const key = arg.slice(2, eqIdx)
        flags[key] = arg.slice(eqIdx + 1)
      } else {
        const key = arg.slice(2)
        const next = rest[i + 1]
        if (next !== undefined && !next.startsWith('-')) {
          flags[key] = next
          i += 1
        } else {
          flags[key] = true
        }
      }
    }
    // 短选项 -x
    else if (arg.startsWith('-') && arg.length === 2) {
      const short = arg[1]
      const mapped = SHORT_FLAGS[short]
      if (!mapped) {
        flags[short] = true
        continue
      }
      const next = rest[i + 1]
      if (next !== undefined && !next.startsWith('-')) {
        flags[mapped] = next
        i += 1
      } else {
        flags[mapped] = true
      }
    } else {
      positional.push(arg)
    }
  }

  return { command: cmd, positional, flags }
}

async function main() {
  if (process.argv.length <= 2) {
    printHelp()
    return
  }

  const { command: rawCmd, positional, flags } = parseArgs(process.argv)

  // 顶层帮助
  if (!rawCmd || rawCmd === '--help' || rawCmd === '-h') {
    printHelp()
    return
  }

  // 版本
  if (rawCmd === '--version' || rawCmd === '-v') {
    info(`post-cli v${VERSION}`)
    return
  }

  const command = resolveCommand(rawCmd)

  // 未知命令
  if (!isKnownCommand(rawCmd)) {
    error(`未知命令: ${rawCmd}`)
    info('运行 "pnpm post help" 查看可用命令。')
    process.exitCode = 2
    return
  }

  // 单一命令帮助
  if (command === 'help') {
    const target = resolveCommand(positional[0]) || positional[0]
    if (target) {
      printCommandHelp(target)
    } else {
      printHelp()
    }
    return
  }

  try {
    switch (command) {
      case 'new':
        await runNew(positional, flags)
        break
      case 'update':
        await runUpdate(positional, flags)
        break
      case 'publish':
        await runPublish(positional, flags)
        break
      case 'deploy':
        await runDeploy(positional, flags)
        break
      case 'list':
        await runList(positional, flags)
        break
      case 'read':
        await runRead(positional, flags)
        break
      case 'serve':
        await runServe(positional, flags)
        break
      case 'clean': {
        const { default: fs } = await import('node:fs/promises')
        const cacheDir = new URL('.vitepress/cache', `file:///${process.cwd().replace(/\\/g, '/')}`).pathname.replace(/^\/([A-Z]:\/)/i, '$1')
        const distDir = new URL('.vitepress/dist', `file:///${process.cwd().replace(/\\/g, '/')}`).pathname.replace(/^\/([A-Z]:\/)/i, '$1')
        let cleaned = 0
        for (const dir of [cacheDir, distDir]) {
          try {
            await fs.rm(dir, { recursive: true, force: true })
            info(`已清理: ${dir}`)
            cleaned += 1
          } catch {
            // 目录不存在则跳过
          }
        }
        if (cleaned) success('清理完成。')
        else info('无需清理。')
        break
      }
      default:
        printHelp()
    }
  } catch (err) {
    if (err && err.cliMessage) {
      error(err.cliMessage)
      if (err.hint) info(err.hint)
    } else {
      error(err?.message || String(err))
    }
    process.exitCode = typeof err?.exitCode === 'number' ? err.exitCode : 1
  }
}

main()
