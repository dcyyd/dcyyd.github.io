/**
 * 共享 UI 工具：颜色输出、Logo、错误封装
 * 仅使用 ANSI 转义码，不依赖任何 npm 包
 */

export const VERSION = '1.5.0'

const isTty = process.stdout.isTTY
const noColor = process.env.NO_COLOR === '1' || process.env.POST_CLI_NO_COLOR === '1'

function wrap(open, close) {
  return (text) => (noColor ? text : `\u001B[${open}m${text}\u001B[${close}m`)
}

const c = {
  reset: '\u001B[0m',
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39)
}

const paint = (color, text) => (noColor ? text : `\u001B[${color}m${text}\u001B[39m`)
const paintBold = (color, text) => (noColor ? text : `\u001B[1;\u001B[${color}m${text}\u001B[22;\u001B[39m`)

export const ui = {
  brand: (t) => c.bold(c.cyan(t)),
  brandGradient: (t) =>
    noColor
      ? t
      : `\u001B[1m\u001B[38;2;99;102;241m${t}\u001B[22m\u001B[38;2;124;58;237m\u001B[0m\u001B[0m`.replaceAll(
          '\u001B[0m\u001B[0m',
          '\u001B[0m'
        ),
  success: (t) => c.green('✓ ') + t,
  warn: (t) => c.yellow('! ') + t,
  error: (t) => c.red('✗ ') + t,
  info: (t) => c.blue('ℹ ') + t,
  dim: (t) => c.gray(t),
  bold: c.bold,
  cyan: c.cyan,
  yellow: c.yellow,
  green: c.green,
  magenta: c.magenta,
  blue: c.blue
}

export function info(text) {
  process.stdout.write(`${ui.info(text)}\n`)
}

export function success(text) {
  process.stdout.write(`${ui.success(text)}\n`)
}

export function warn(text) {
  process.stdout.write(`${ui.warn(text)}\n`)
}

export function error(text) {
  process.stderr.write(`${ui.error(text)}\n`)
}

export function dim(text) {
  process.stdout.write(`${ui.dim(text)}\n`)
}

export function blank() {
  process.stdout.write('\n')
}

export function heading(text) {
  blank()
  process.stdout.write(`${c.bold(text)}\n`)
}

/**
 * 抛出一个 CLI 友好错误。调用方外层 try/catch 会捕获并打印。
 */
export function fail(message, { hint, exitCode = 1 } = {}) {
  const err = new Error(message)
  err.cliMessage = message
  err.hint = hint
  err.exitCode = exitCode
  return err
}

/**
 * 简易行输入器（用于交互式补全缺失参数）。非 TTY 时返回 null 让调用方走非交互分支。
 */
export async function prompt(question, { defaultValue } = {}) {
  if (!isTty) return defaultValue ?? null
  const { createInterface } = await import('node:readline/promises')
  const { stdin, stdout } = process
  const rl = createInterface({ input: stdin, output: stdout })
  const suffix = defaultValue ? ` ${c.gray(`(${defaultValue})`)}` : ''
  try {
    const answer = (await rl.question(`${c.cyan('?')} ${question}${suffix}: `)).trim()
    return answer.length > 0 ? answer : defaultValue ?? null
  } finally {
    rl.close()
  }
}

/**
 * 简易确认（y/N）
 */
export async function confirm(question, { defaultYes = false } = {}) {
  if (!isTty) return defaultYes
  const { createInterface } = await import('node:readline/promises')
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const suffix = defaultYes ? `${c.gray('(Y/n)')}` : `${c.gray('(y/N)')}`
  try {
    const answer = (await rl.question(`${c.cyan('?')} ${question} ${suffix}: `)).trim().toLowerCase()
    if (!answer) return defaultYes
    return answer === 'y' || answer === 'yes'
  } finally {
    rl.close()
  }
}

/**
 * 计算 Markdown 文本的近似中文字数（排除代码块和 frontmatter）
 */
export function wordCount(md) {
  if (!md) return 0
  let text = md
    .replace(/^---[\s\S]*?---/u, '')       // 去 frontmatter
    .replace(/```[\s\S]*?```/gu, '')       // 去代码块
    .replace(/`[^`]*`/g, '')               // 去行内代码
    .replace(/[#*>\-|\[\]()!~]/g, ' ')     // 去 markdown 标记
    .replace(/\s+/g, ' ')
    .trim()
  // Unicode aware: 中文字符 + 英文单词
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length
  const words = (text.match(/[a-zA-Z0-9]+/g) || []).length
  return cjk + words
}

/**
 * 中文阅读时间估算（约 300 字/分钟）
 */
export function readingTime(count) {
  if (!count || count <= 0) return '<1'
  const min = Math.max(1, Math.ceil(count / 300))
  return String(min)
}
