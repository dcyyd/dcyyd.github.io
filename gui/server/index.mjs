/**
 * FilePress Blog GUI · 本地 API 服务
 *
 * 提供:
 *   GET    /api/health             健康检查
 *   GET    /api/posts              列出全部文章
 *   GET    /api/posts/:slug        读取单篇
 *   POST   /api/posts              新建文章
 *   PUT    /api/posts/:slug        更新文章
 *   DELETE /api/posts/:slug        删除文章
 *   GET    /api/logs               列出 logs/ 下的文件
 *   GET    /api/logs/:name         读取日志
 *   GET    /api/cli/:cmd           SSE 流式执行 post-cli 子命令
 *   GET    /api/deploy             SSE 流式一键部署
 *   GET    /api/preview/start      SSE 启动 vite preview
 *   GET    /api/preview/stop       停止 vite preview
 *   GET    /api/preview/status     预览状态
 *
 * 设计: 零依赖纯 Node http
 */

import http from 'node:http'
import { promises as fs, createReadStream, statSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const POSTS_DIR = path.join(PROJECT_ROOT, 'content', 'posts')
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs')
const POST_CLI = path.join(PROJECT_ROOT, 'scripts', 'post-cli.mjs')

const PORT = Number(process.env.GUI_PORT ?? 5174)
const HOST = process.env.GUI_HOST ?? '127.0.0.1'

// ---------------------- 进程管理 ----------------------

/** 当前正在运行的子进程（deploy / preview） */
const runningProcesses = new Map()

/**
 * 杀进程树（不仅杀直接子进程，还杀子进程 fork 出的 vitepress / vite / 等）
 * - Windows: taskkill /pid X /T /F
 * - POSIX  : 先 SIGTERM 进程组，杀不掉再 SIGKILL（spawn 时需 detached: true）
 */
function killProcess(key) {
  const p = runningProcesses.get(key)
  if (!p) return false
  if (p.exitCode != null) { runningProcesses.delete(key); return false }
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
    } else {
      try { process.kill(-p.pid, 'SIGTERM') } catch { try { p.kill('SIGTERM') } catch { /* noop */ } }
      setTimeout(() => {
        if (p.exitCode == null) {
          try { process.kill(-p.pid, 'SIGKILL') } catch { try { p.kill('SIGKILL') } catch { /* noop */ } }
        }
      }, 1500)
    }
  } catch { /* noop */ }
  runningProcesses.delete(key)
  return true
}

function registerProcess(key, proc) {
  // 杀掉同 key 的旧进程
  killProcess(key)
  // POSIX: 让子进程进入新进程组，便于按组杀
  if (process.platform !== 'win32') {
    try { proc.spawnargs && (proc._handle && (proc._handle.setpgid = true)) } catch { /* noop */ }
  }
  runningProcesses.set(key, proc)
  proc.on('exit', () => {
    if (runningProcesses.get(key) === proc) runningProcesses.delete(key)
  })
}

// ---------------------- 工具 ----------------------

/** 去除 ANSI 转义码，避免浏览器日志面板出现乱码 */
function stripAnsi(s) {
  return s.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '')
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    ...headers
  })
  res.end(typeof body === 'string' ? body : JSON.stringify(body))
}

function sendStream(res, status, headers = {}) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Cache-Control': 'no-cache, no-store, no-transform',
    'X-Accel-Buffering': 'no',
    Connection: 'keep-alive',
    ...headers
  })
}

function safeSlug(slug) {
  if (typeof slug !== 'string') return ''
  return slug.replace(/[\\/:*?"<>|]/g, '').trim()
}

async function readPost(slug) {
  const safe = safeSlug(slug)
  if (!safe) return null
  const filePath = path.join(POSTS_DIR, `${safe}.md`)
  if (!existsSync(filePath)) return null
  
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    
    // 防止解析超大文件导致阻塞
    if (raw.length > 500000) {
      console.warn(`[readPost] File too large: ${safe}.md (${raw.length} chars)`)
    }
    
    const parsed = matter(raw)
    const stat = statSync(filePath)
    const fm = { ...(parsed.data ?? {}) }
    
    // 同步 description：description 优先，其次 summary（GUI 字段）
    if (!fm.description && typeof fm.summary === 'string') {
      fm.description = fm.summary
    }
    
    return {
      slug: safe,
      filePath: path.relative(PROJECT_ROOT, filePath),
      frontmatter: fm,
      body: parsed.content ?? '',
      size: stat.size,
      mtime: stat.mtimeMs
    }
  } catch (e) {
    console.error(`[readPost] Error reading ${safe}.md:`, e)
    throw e
  }
}

async function listPosts() {
  if (!existsSync(POSTS_DIR)) return []
  const names = await fs.readdir(POSTS_DIR)
  const items = []
  for (const name of names) {
    if (!name.endsWith('.md')) continue
    const slug = name.replace(/\.md$/, '')
    const post = await readPost(slug)
    if (post) items.push(post)
  }
  items.sort((a, b) => b.mtime - a.mtime)
  return items
}

function buildMarkdown(frontmatter, body) {
  const fm = frontmatter && Object.keys(frontmatter).length > 0 ? frontmatter : null
  if (!fm) return body ?? ''
  // 规整 frontmatter 中的字符串字段，避免被 YAML 序列化成 `>-` 折叠块
  for (const key of Object.keys(fm)) {
    const v = fm[key]
    if (typeof v === 'string') {
      if (key === 'description') {
        const oneLine = v.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
        fm[key] = oneLine.length > 200 ? oneLine.slice(0, 200).trim() : oneLine
      } else {
        fm[key] = v.replace(/\r?\n/g, ' ').trim()
      }
    }
  }
  return '---\n' + dumpFrontmatter(fm) + '---\n' + (body ?? '')
}

/**
 * 简易 YAML frontmatter 序列化（不走 gray-matter 的内部 js-yaml.dump，
 * 后者在字符串较长时默认折叠为 `>-` 块标量）。
 * 规则：
 *  - 字符串：含冒号/井号/YAML 控制字符 → 单引号包裹；否则裸字符串
 *  - 数组：YAML 列表（短）
 *  - 布尔 / 数字 / null：原样
 *  - 嵌套对象：JSON 表示
 */
function dumpFrontmatter(fm) {
  const lines = []
  for (const [key, value] of Object.entries(fm)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      lines.push(`${key}:`)
      for (const item of value) {
        lines.push(`  - ${formatScalar(item)}`)
      }
      continue
    }
    if (typeof value === 'object') {
      lines.push(`${key}: ${JSON.stringify(value)}`)
      continue
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      lines.push(`${key}: ${value}`)
      continue
    }
    if (typeof value === 'string') {
      lines.push(`${key}: ${formatScalar(value)}`)
    }
  }
  return lines.length > 0 ? lines.join('\n') + '\n' : ''
}

/**
 * 把 JS 标量格式化成 YAML 标量表示：
 *  - 字符串需包含 YAML 特殊字符（`: `、`# `、`&`、`*`、`!`、`|`、`>`、`%`、`` ` `` 等）时，用单引号包裹
 *  - 含换行 / 制表 / 起始空白 / 结束空白 → 单引号
 *  - 单引号内部以 `''` 转义
 *  - 否则裸字符串
 */
function formatScalar(v) {
  if (v === true) return 'true'
  if (v === false) return 'false'
  if (v === null) return 'null'
  if (typeof v === 'number') return String(v)
  const s = String(v)
  // 含换行 / 制表符 / 起始或结束空白 → 单引号
  if (/[\n\r\t]/.test(s) || /^\s|\s$/.test(s)) {
    return `'${s.replace(/'/g, "''")}'`
  }
  // YAML 保留字符或全角冒号不会触发；只在 `:` 后接空格、`# ` 等 ASCII 情况下用引号
  if (/(^|\s)[:#&*!|>%@`]|\s:\s|^\d/.test(s) && !/^[\u4e00-\u9fa5]/.test(s)) {
    return `'${s.replace(/'/g, "''")}'`
  }
  return s
}

async function writePostFile(slug, frontmatter, body) {
  const safe = safeSlug(slug)
  if (!safe) throw new Error('slug 不能为空')
  const filePath = path.join(POSTS_DIR, `${safe}.md`)
  const content = buildMarkdown(frontmatter, body)
  await fs.writeFile(filePath, content, 'utf-8')
  return readPost(safe)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// ---------------------- SSE 辅助 ----------------------

const sseClients = new Set()

function createSseSession(res, onClose = () => {}) {
  const client = { res, onClose }
  sseClients.add(client)
  res.on('close', () => {
    sseClients.delete(client)
    try { onClose() } catch { /* noop */ }
  })
  return client
}

function writeSse(client, event, data) {
  try {
    client.res.write(`event: ${event}\n`)
    client.res.write(`data: ${JSON.stringify(data)}\n\n`)
  } catch { /* noop */ }
}

function sseHandshake(res) {
  sendStream(res, 200, { 'Content-Type': 'text/event-stream; charset=utf-8' })
  res.write(':ok\n\n')  // 注释行让浏览器确认连接
}

// ---------------------- 路由 ----------------------

const routes = {
  'GET /api/health': async (_req, res) => {
    send(res, 200, {
      ok: true,
      version: '0.5.0',
      postsDir: POSTS_DIR,
      running: [...runningProcesses.keys()]
    })
  },

  'GET /api/posts': async (_req, res) => {
    try {
      const posts = await listPosts()
      send(res, 200, { ok: true, count: posts.length, posts })
    } catch (e) {
      send(res, 500, { ok: false, error: e?.message ?? String(e) })
    }
  },

  'GET /api/posts/:slug': async (req, res, params) => {
    try {
      const post = await readPost(params.slug)
      if (!post) return send(res, 404, { ok: false, error: '文章不存在' })
      send(res, 200, { ok: true, post })
    } catch (e) {
      send(res, 500, { ok: false, error: e?.message ?? String(e) })
    }
  },

  'POST /api/posts': async (req, res) => {
    try {
      const buf = await readBody(req)
      const { slug, frontmatter = {}, body = '' } = JSON.parse(buf.toString('utf-8'))
      if (!slug) return send(res, 400, { ok: false, error: 'slug 必填' })
      const filePath = path.join(POSTS_DIR, `${safeSlug(slug)}.md`)
      if (existsSync(filePath)) {
        return send(res, 409, { ok: false, error: `文章已存在: ${slug}` })
      }
      const post = await writePostFile(slug, frontmatter, body)
      send(res, 201, { ok: true, post })
    } catch (e) {
      send(res, 500, { ok: false, error: e?.message ?? String(e) })
    }
  },

  'PUT /api/posts/:slug': async (req, res, params) => {
    try {
      const buf = await readBody(req)
      const { frontmatter = {}, body = '' } = JSON.parse(buf.toString('utf-8'))
      const post = await writePostFile(params.slug, frontmatter, body)
      send(res, 200, { ok: true, post })
    } catch (e) {
      send(res, 500, { ok: false, error: e?.message ?? String(e) })
    }
  },

  'DELETE /api/posts/:slug': async (_req, res, params) => {
    try {
      const safe = safeSlug(params.slug)
      const filePath = path.join(POSTS_DIR, `${safe}.md`)
      if (!existsSync(filePath)) {
        return send(res, 404, { ok: false, error: '文章不存在' })
      }
      await fs.unlink(filePath)
      send(res, 200, { ok: true, deleted: safe })
    } catch (e) {
      send(res, 500, { ok: false, error: e?.message ?? String(e) })
    }
  },

  'GET /api/logs': async (_req, res) => {
    try {
      if (!existsSync(LOGS_DIR)) return send(res, 200, { ok: true, logs: [] })
      const names = await fs.readdir(LOGS_DIR)
      const logs = []
      for (const name of names) {
        const p = path.join(LOGS_DIR, name)
        const st = statSync(p)
        if (st.isFile()) logs.push({ name, size: st.size, mtime: st.mtimeMs })
      }
      logs.sort((a, b) => b.mtime - a.mtime)
      send(res, 200, { ok: true, logs })
    } catch (e) {
      send(res, 500, { ok: false, error: e?.message ?? String(e) })
    }
  },

  'GET /api/logs/:name': async (_req, res, params) => {
    try {
      const safe = path.basename(params.name)
      const p = path.join(LOGS_DIR, safe)
      if (!existsSync(p)) return send(res, 404, { ok: false, error: '日志不存在' })
      const stat = statSync(p)
      if (stat.size > 1024 * 1024) {
        return send(res, 413, { ok: false, error: '日志过大，请直接查看源文件' })
      }
      const content = await fs.readFile(p, 'utf-8')
      send(res, 200, { ok: true, name: safe, content, size: stat.size })
    } catch (e) {
      send(res, 500, { ok: false, error: e?.message ?? String(e) })
    }
  },

  'GET /api/cli/:cmd': async (req, res, params) => {
    const cmd = params.cmd
    const allowed = new Set(['list', 'help'])
    if (!allowed.has(cmd)) {
      return send(res, 400, { ok: false, error: `不允许的命令: ${cmd}` })
    }
    sseHandshake(res)

    const key = `cli:${cmd}`
    const child = spawn('node', [POST_CLI, cmd], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' }
    })
    registerProcess(key, child)

    const client = createSseSession(res)

    child.stdout.on('data', (d) => writeSse(client, 'stdout', { line: stripAnsi(d.toString()) }))
    child.stderr.on('data', (d) => writeSse(client, 'stderr', { line: stripAnsi(d.toString()) }))
    child.on('error', (e) => { writeSse(client, 'error', { line: e.message }); killProcess(key) })
    child.on('close', (code) => {
      writeSse(client, 'done', { line: `退出码 ${code ?? 0}`, code: code ?? 0 })
      killProcess(key)
      try { res.end() } catch { /* noop */ }
    })
  },

  /**
   * 一键部署：GET + SSE
   * EventSource 只能发 GET，这里必须 GET 化
   */
  'GET /api/deploy': async (req, res) => {
    sseHandshake(res)

    const key = 'deploy'
    const child = spawn('node', [POST_CLI, 'd', '-y'], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' }
    })
    registerProcess(key, child)

    const client = createSseSession(res, () => killProcess(key))

    writeSse(client, 'info', { line: '▶ 启动一键部署…' })

    child.stdout.on('data', (d) => writeSse(client, 'stdout', { line: stripAnsi(d.toString()) }))
    child.stderr.on('data', (d) => writeSse(client, 'stderr', { line: stripAnsi(d.toString()) }))
    child.on('error', (e) => {
      writeSse(client, 'error', { line: `进程错误: ${e.message}` })
      killProcess(key)
    })
    child.on('close', (code) => {
      const ok = code === 0
      writeSse(client, 'done', { line: ok ? '✅ 部署完成' : `❌ 部署失败 (exit=${code})`, code: code ?? 1, ok })
      killProcess(key)
      try { res.end() } catch { /* noop */ }
    })
  },

  /**
   * 本地预览：SSE 流式输出 pnpm post s --open 日志
   * 与用户终端中的 `pnpm post s --open` 等价：直接调起 VitePress dev
   */
  'GET /api/preview/start': async (req, res) => {
    // 5173 端口被外部进程占着 → 启动必失败，提前诊断
    sseHandshake(res)
    const client = createSseSession(res, () => killProcess('preview'))

    if (runningProcesses.has('preview')) {
      writeSse(client, 'info', { line: '⚠️ 预览进程已在运行中' })
      writeSse(client, 'done', { line: '已存在实例', code: 0, ok: true })
      return res.end()
    }

    // 探测 5173 端口是否被外部进程占用
    try {
      const { checkPort } = await import('./port-check.mjs')
      const c = await checkPort(5173)
      if (c.busy) {
        writeSse(client, 'error', { line: `❌ 端口 5173 已被外部进程占用（pid=${c.pid ?? '?'}）` })
        writeSse(client, 'error', { line: '请先关闭占用进程：`netstat -ano | findstr :5173` 然后 `Stop-Process -Id <pid>`' })
        writeSse(client, 'done', { line: '启动失败：端口冲突', code: 1, ok: false })
        return res.end()
      }
    } catch { /* 探测失败不阻塞启动 */ }

    writeSse(client, 'info', { line: '▶ 启动本地预览（pnpm post s --open）…' })
    writeSse(client, 'info', { line: '⏳ 端口 5173 · 等价于 `pnpm post s --open`' })

    // 等价于 `pnpm post s --open`  ->  node scripts/post-cli.mjs serve --open --host
    const child = spawn('node', [POST_CLI, 'serve', '--open', '--host', '--port', '5173'], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      // 让子进程在新的进程组/树中，便于按组杀干净 vitepress → vite 整条链
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe']
    })
    registerProcess('preview', child)

    child.stdout.on('data', (d) => {
      const text = stripAnsi(d.toString())
      writeSse(client, 'stdout', { line: text })
      if (/http:\/\/[^/]+:5173/.test(text)) {
        writeSse(client, 'info', { line: '🌐 预览服务已就绪，访问 http://localhost:5173' })
      }
    })
    child.stderr.on('data', (d) => writeSse(client, 'stderr', { line: stripAnsi(d.toString()) }))
    child.on('error', (e) => {
      writeSse(client, 'error', { line: `进程错误: ${e.message}` })
      killProcess('preview')
    })
    child.on('close', (code) => {
      writeSse(client, 'done', { line: `预览进程退出 (code=${code})`, code: code ?? 0 })
      killProcess('preview')
      try { res.end() } catch { /* noop */ }
    })
  },

  'GET /api/preview/stop': async (_req, res) => {
    const killed = killProcess('preview')
    send(res, 200, { ok: true, killed })
  },

  'GET /api/preview/status': async (_req, res) => {
    send(res, 200, {
      ok: true,
      running: runningProcesses.has('preview'),
      runningKeys: [...runningProcesses.keys()]
    })
  }
}

// ---------------------- Dispatcher ----------------------

function matchRoute(method, pathname) {
  for (const key of Object.keys(routes)) {
    const [m, p] = key.split(' ')
    if (m !== method) continue
    const paramNames = []
    const pattern = new RegExp('^' + p.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, n) => {
      paramNames.push(n)
      return '([^/]+)'
    }) + '$')
    const match = pathname.match(pattern)
    if (match) {
      const params = {}
      paramNames.forEach((n, i) => { params[n] = decodeURIComponent(match[i + 1] ?? '') })
      return { handler: routes[key], params }
    }
  }
  return null
}

/**
 * 处理单个 HTTP 请求（用于 Vite 插件直接挂载到 dev server）
 */
export async function handleApiRequest(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, '')
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const route = matchRoute(req.method ?? 'GET', url.pathname)
  if (!route) {
    return send(res, 404, { ok: false, error: `路由不存在: ${req.method} ${url.pathname}` })
  }
  try {
    await route.handler(req, res, route.params)
  } catch (e) {
    if (!res.writableEnded) send(res, 500, { ok: false, error: e?.message ?? String(e) })
  }
}

/**
 * 创建独立的 http.Server（用于 `pnpm dev:api` / 生产部署）
 */
export function createApiServer() {
  return http.createServer(handleApiRequest)
}

// 进程退出时清理所有子进程
function shutdown() {
  for (const [k, p] of runningProcesses) {
    try { p.kill() } catch { /* noop */ }
  }
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

const isMain = (() => {
  try {
    if (typeof import.meta.url !== 'string' || !process.argv[1]) return false
    const argvPath = path.resolve(process.argv[1])
    return fileURLToPath(import.meta.url) === argvPath
  } catch { return false }
})()

if (isMain) {
  const server = createApiServer()
  server.listen(PORT, HOST, () => {
    console.log(`[gui-api] listening on http://${HOST}:${PORT}`)
    console.log(`[gui-api] project root: ${PROJECT_ROOT}`)
    console.log(`[gui-api] posts dir:    ${POSTS_DIR}`)
  })
}
