/**
 * serve · 启动 VitePress 开发服务器
 *
 * 用法:
 *   pnpm post s                 默认端口启动
 *   pnpm post s --port 8080     指定端口
 *   pnpm post s --host          允许外部访问
 *   pnpm post s --rss           启动前生成 RSS
 *
 * 行为:
 *  - 子进程启动 vitepress dev，stdin/stdout/stderr 直连终端
 *  - Ctrl+C 终止 dev server 同时退出本进程
 */

import { spawn } from 'node:child_process'
import { heading, ui, info, success } from './ui.mjs'

export async function runServe(_positional, flags) {
  heading(ui.bold(ui.green('⚡ 启动开发服务器')))

  const args = ['dev', '.']

  if (flags.port || flags.p) {
    args.push('--port', String(flags.port || flags.p))
  }
  if (flags.host || flags.h) {
    args.push('--host')
  }
  // --open 打开浏览器
  if (flags.open || flags.o) {
    args.push('--open')
  }

  // 可选的 prerun：生成 RSS
  if (flags.rss) {
    info('正在生成 RSS...')
    const { execSync } = await import('node:child_process')
    try {
      execSync('node scripts/generate-rss.mjs', { cwd: process.cwd(), stdio: 'pipe' })
      success('RSS 已生成。')
    } catch (err) {
      ui.warn(`RSS 生成失败: ${err.message}`)
    }
  }

  const port = flags.port || flags.p || 5173
  const host = flags.host || flags.h ? '0.0.0.0' : 'localhost'
  info(`服务器启动中: http://${host}:${port}`)
  info('按 Ctrl+C 停止。')

  const child = spawn('npx', ['vitepress', ...args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
  })

  child.on('close', (code) => {
    if (code !== 0 && code !== null) {
      process.exitCode = code
    }
  })
}
