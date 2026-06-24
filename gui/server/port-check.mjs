/**
 * 端口占用探测（无需外部依赖）。
 * - Windows: netstat -ano | findstr :<port>
 * - POSIX  : lsof -i :<port> -t
 * 返回 { busy, pid? }
 */
import { spawn } from 'node:child_process'

function run(cmd, args) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true })
    let out = ''
    p.stdout.on('data', (d) => (out += d.toString()))
    p.on('error', () => resolve(''))
    p.on('close', () => resolve(out))
  })
}

export async function checkPort(port) {
  if (process.platform === 'win32') {
    const out = await run('netstat', ['-ano', '-p', 'TCP'])
    // 形如: TCP    0.0.0.0:5173    0.0.0.0:0    LISTENING    12345
    const re = new RegExp(`TCP\\s+[\\d.]+:${port}\\s+[\\d.]+:\\d+\\s+LISTENING\\s+(\\d+)`, 'm')
    const m = out.match(re)
    if (!m) return { busy: false }
    return { busy: true, pid: Number(m[1]) }
  } else {
    const out = await run('lsof', ['-i', `:${port}`, '-t'])
    const pid = out.trim().split(/\s+/)[0]
    if (!pid) return { busy: false }
    return { busy: true, pid: Number(pid) }
  }
}
