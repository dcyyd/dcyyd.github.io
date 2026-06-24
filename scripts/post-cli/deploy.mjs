/**
 * deploy · 一键部署：构建 + 推送 dist 到 gh-pages 分支
 *
 * 用法:
 *   pnpm post d                       完整流程（构建 + 推送）
 *   pnpm post d -y                    跳过确认
 *   pnpm post d --skip-build          复用现有 dist 直接推送
 *   pnpm post d --branch main         推送到指定分支（默认 gh-pages）
 *   pnpm post d --repo <url>          推送到指定仓库
 *   pnpm post d --message "fix: ..."  自定义 commit 信息
 *   pnpm post d --no-cleanup          保留 dist/.git（调试用）
 *
 * 行为:
 *   1. [可选] 执行 `npx vitepress build .` 生成 .vitepress/dist
 *   2. 在 .vitepress/dist 内部初始化临时 Git 仓库
 *   3. 创建/复用 gh-pages 分支
 *   4. force-push 到远端（替换为最新构建产物）
 *   5. 清理 dist/.git 临时仓库
 *
 * 跨平台:
 *   使用 node:child_process + node:fs/promises，不依赖 PowerShell。
 *   Git SSH 配置通过环境变量 GIT_SSH_COMMAND 传递，避免污染全局 git config。
 */

import { execFile, spawn } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { info, success, warn, error, ui, blank, heading, fail, confirm, prompt } from './ui.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const DIST_DIR = path.join(PROJECT_ROOT, '.vitepress', 'dist')

/** 仓库与分支默认值：可通过 flag 覆盖 */
const DEFAULTS = {
  repo: 'git@github.com:dcyyd/dcyyd.github.io.git',
  branch: 'gh-pages',
  message: 'deploy: update site',
  buildCommand: 'npx',
  buildArgs: ['vitepress', 'build', '.']
}

/** 把 Windows 路径转换为 ssh 接受的格式（保持 C:/ 前缀、正斜杠） */
function sshPath(p) {
  if (!p) return p
  return String(p).replace(/\\/g, '/')
}

/** 解析 home 目录并转为 ssh 可识别的路径 */
function getHome() {
  return sshPath(process.env.HOME || process.env.USERPROFILE || os.homedir())
}

/** 部署用环境：HOME 设为 ssh 接受的格式 + GIT_SSH_COMMAND 指向 id_rsa */
function getDeployEnv() {
  const home = getHome()
  return {
    ...process.env,
    HOME: home,
    USERPROFILE: process.env.USERPROFILE || os.homedir(),
    GIT_SSH_COMMAND: `ssh -i ${home}/.ssh/id_rsa -o UserKnownHostsFile=${home}/.ssh/known_hosts -o StrictHostKeyChecking=accept-new`
  }
}

/**
 * 封装 execFile 走 Promise。shell:false 避免 DEP0190 警告与空格拆分。
 * Windows 上自动加 .exe 后缀，并注入 HOME + GIT_SSH_COMMAND 让 ssh 找到密钥。
 */
function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const bin = process.platform === 'win32' && !/\.(exe|cmd|bat)$/i.test(cmd) ? `${cmd}.exe` : cmd
    execFile(bin, args, {
      cwd: PROJECT_ROOT,
      shell: false,
      env: getDeployEnv(),
      ...options
    }, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout
        err.stderr = stderr
        reject(err)
        return
      }
      resolve({ stdout: String(stdout || ''), stderr: String(stderr || '') })
    })
  })
}

/**
 * 同步执行命令并把 stdout 实时透传给终端。
 * 用于 vitepress build —— 构建时希望看到完整进度。
 */
function runStream(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      shell: true,
      ...options
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else {
        const err = new Error(`${cmd} ${args.join(' ')} exited with code ${code}`)
        err.exitCode = code
        reject(err)
      }
    })
  })
}

/** 同步清理，确保即使异常退出也能恢复 dist 目录 */
function safeCleanup(distGitDir) {
  try {
    if (existsSync(distGitDir)) {
      rmSync(distGitDir, { recursive: true, force: true })
    }
  } catch (e) {
    warn(`清理临时 .git 失败: ${e.message}`)
  }
}

export async function runDeploy(_positional, flags) {
  heading(ui.bold(ui.magenta('🚀 一键部署到 GitHub Pages')))

  const options = {
    repo: flags.repo || process.env.DEPLOY_REPO || DEFAULTS.repo,
    branch: flags.branch || process.env.DEPLOY_BRANCH || DEFAULTS.branch,
    message: (typeof flags.message === 'string' && flags.message)
      || (typeof flags.m === 'string' && flags.m)
      || DEFAULTS.message,
    skipBuild: flags['skip-build'] === true || flags.skipBuild === true,
    skipPush: flags['skip-push'] === true || flags.skipPush === true,
    noCleanup: flags['no-cleanup'] === true || flags.noCleanup === true,
    yes: flags.yes === true || flags.y === true
  }

  blank()
  info(`${ui.bold('部署配置')}:`)
  info(`  仓库:   ${ui.cyan(options.repo)}`)
  info(`  分支:   ${ui.cyan(options.branch)}`)
  info(`  消息:   ${ui.dim(options.message)}`)
  info(`  跳过构建: ${options.skipBuild ? ui.yellow('是') : '否'}`)
  info(`  跳过推送: ${options.skipPush ? ui.yellow('是') : '否'}`)
  blank()

  // ── 1. 预检 ──
  await preflight(options)

  // ── 2. 构建 ──
  if (!options.skipBuild) {
    await stepBuild()
  } else {
    if (!existsSync(DIST_DIR)) {
      throw fail('跳过构建模式要求 .vitepress/dist 已存在。', {
        hint: '移除 --skip-build 标志或先运行 `pnpm build`。',
        exitCode: 2
      })
    }
    info('已跳过构建，复用现有 .vitepress/dist。')
  }

  if (options.skipPush) {
    success('构建已完成（如需推送可移除 --skip-push）。')
    return
  }

  // ── 3. 确认 ──
  if (!options.yes) {
    const ok = await confirm(`确认将 dist 强制推送到 ${options.branch} 分支？`, { defaultYes: false })
    if (!ok) {
      info('已取消部署。')
      return
    }
  }

  if (options.skipPush) {
    success('构建已完成（如需推送可移除 --skip-push）。')
    return
  }

  // ── 4. 推送（带清理兜底） ──
  const distGitDir = path.join(DIST_DIR, '.git')
  try {
    await stepPush(options, distGitDir)
  } catch (err) {
    if (!options.noCleanup) safeCleanup(distGitDir)
    throw err
  }

  if (!options.noCleanup) safeCleanup(distGitDir)

  blank()
  success(ui.bold('部署完成 ✨'))
  info(`网站将在 1-2 分钟内更新：${ui.cyan('https://dcyyd.github.io')}`)
}

/** 部署前健康检查 */
async function preflight(options) {
  heading(ui.bold('① 预检'))

  // 检查 dist 目录可写
  try {
    await run('git', ['--version'])
  } catch {
    throw fail('未找到 git 命令，请先安装 Git。', { exitCode: 127 })
  }
  success('git 可用')

  // 检查 SSH 连接（仅在标准 SSH 仓库时）。注意：ssh -T 会以非零状态返回
  // "successfully authenticated" 信息，因此只能基于输出文本判断，不能用退出码。
  if (options.repo.startsWith('git@')) {
    let out = ''
    try {
      const res = await run('ssh', [
        '-T',
        '-o', 'StrictHostKeyChecking=accept-new',
        '-o', 'ConnectTimeout=10',
        options.repo.split(':')[0]
      ], { timeout: 15000 })
      out = (res.stdout || '') + (res.stderr || '')
    } catch (err) {
      out = (err.stdout || '') + (err.stderr || '')
    }
    if (/successfully authenticated/i.test(out)) {
      success('GitHub SSH 已认证')
    } else {
      warn('SSH 预检未确认认证（首次连接可能需要主机指纹确认）')
      info('继续部署 —— 实际推送时仍会再次认证。')
    }
  } else {
    warn(`仓库使用非 SSH 协议：${options.repo}`)
  }

  // 检查源码工作区是否有未提交修改（可选警告）
  try {
    const { stdout } = await run('git', ['status', '--porcelain'])
    if (stdout.trim()) {
      warn('源码工作区有未提交修改，建议先 commit 再部署。')
      if (!options.yes) {
        const proceed = await confirm('仍然继续部署？', { defaultYes: false })
        if (!proceed) throw fail('已取消部署。', { exitCode: 1 })
      }
    } else {
      success('源码工作区干净')
    }
  } catch (err) {
    if (err.cliMessage) throw err
    warn(`无法读取 git status：${err.message}`)
  }
}

/** 步骤 1：构建 */
async function stepBuild() {
  heading(ui.bold('② 构建静态站点'))
  info(`执行: ${DEFAULTS.buildCommand} ${DEFAULTS.buildArgs.join(' ')}`)
  blank()
  try {
    await runStream(DEFAULTS.buildCommand, DEFAULTS.buildArgs)
  } catch (err) {
    throw fail(`构建失败（exit ${err.exitCode ?? '?'}）`, {
      hint: '尝试用 `npx vitepress build .` 单独运行查看详细错误。',
      exitCode: err.exitCode || 1
    })
  }
  if (!existsSync(DIST_DIR)) {
    throw fail('构建完成但未找到 .vitepress/dist 目录。', { exitCode: 1 })
  }
  success('构建完成')
}

/** 步骤 2：在 dist 内初始化临时仓库并推送 */
async function stepPush(options, distGitDir) {
  heading(ui.bold(`③ 推送到 ${options.branch} 分支`))

  // 清理旧临时仓库（如有）
  if (existsSync(distGitDir)) {
    info('清理旧的临时 .git ...')
    safeCleanup(distGitDir)
  }

  // 在 dist 子目录内执行 git 操作。使用 shell:false 让 args 作为数组原样传递，
  // 避免含空格的 message / branch 名被 shell 错误拆分。
  const cwd = DIST_DIR
  const gitBin = process.platform === 'win32' ? 'git.exe' : 'git'
  const runInDist = (args, { allowFail = false } = {}) => new Promise((resolve, reject) => {
    execFile(gitBin, args, { cwd, shell: false, env: getDeployEnv() }, (err, stdout, stderr) => {
      if (err && !allowFail) {
        err.stdout = stdout
        err.stderr = stderr
        return reject(err)
      }
      resolve({ stdout: String(stdout || ''), stderr: String(stderr || ''), code: err?.code ?? 0 })
    })
  })

  info('初始化临时仓库 ...')
  await runInDist(['init', '-q'])
  await runInDist(['checkout', '-q', '-b', options.branch])

  info('提交构建产物 ...')
  await runInDist(['add', '-A'])
  await runInDist([
    '-c', 'user.name=post-cli',
    '-c', 'user.email=post-cli@localhost',
    'commit', '-q', '-m', options.message
  ])

  info('配置远端 ...')
  // 移除已存在的 origin（init 后可能没有），避免多次部署累积
  try { await runInDist(['remote', 'remove', 'origin'], { allowFail: true }) } catch { /* 忽略 */ }
  await runInDist(['remote', 'add', 'origin', options.repo])

  info(`force-push 到 ${options.branch}（这一步会覆盖远端分支的全部内容）...`)
  try {
    await runInDist(['push', '-f', 'origin', options.branch])
  } catch (err) {
    const detail = (err.stderr || err.stdout || err.message || '').toString().trim()
    throw fail(`推送失败: ${detail}`, {
      hint: '检查 SSH 密钥、网络连接、远端仓库是否存在。',
      exitCode: 1
    })
  }
  success('推送成功')
}
