/**
 * 极简 Markdown 渲染器（前端预览）
 *
 * 仅做最常见语法的安全转义与渲染：标题、粗体、斜体、代码块、行内代码、列表、链接、引用、表格、分割线
 * 严格不引入第三方依赖，避免 bundle 膨胀
 */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

/** 超过此阈值跳过渲染，避免极端场景下主线程长时间阻塞 */
const MAX_PREVIEW_CHARS = 150_000

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPE_MAP[c] ?? c)
}

interface Block { type: string; content: string; items?: string[]; lang?: string; rows?: string[][]; header?: string[]; rawCode?: string }

function parse(md: string): Block[] {
  const lines = md.split(/\r?\n/)
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''

    // 代码块
    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      const lang = fence[1] ?? ''
      const codeLines: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i] ?? '')) {
        codeLines.push(lines[i] ?? '')
        i++
      }
      i++
      if (lang.toLowerCase() === 'mermaid') {
        // 输出占位 div，EditorView 中的 mermaid 客户端会扫描并替换
        const id = `mmd-${Math.random().toString(36).slice(2, 9)}`
        blocks.push({ type: 'mermaid', content: codeLines.join('\n'), lang: 'mermaid' })
      } else {
        blocks.push({ type: 'code', lang, content: codeLines.join('\n') })
      }
      continue
    }

    // 标题
    const h = line.match(/^(#{1,6})\s+(.+)$/)
    if (h) {
      blocks.push({ type: 'h', content: h[2] ?? '' })
      i++
      continue
    }

    // 引用
    if (/^>\s?/.test(line)) {
      const q: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i] ?? '')) {
        q.push((lines[i] ?? '').replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ type: 'quote', content: q.join('\n') })
      continue
    }

    // 表格
    if (/^\|.+\|$/.test(line) && i + 1 < lines.length && /^\|[\s\-:|]+\|$/.test(lines[i + 1] ?? '')) {
      const header = (line).split('|').slice(1, -1).map((c) => c.trim())
      i += 2
      const rows: string[][] = []
      while (i < lines.length && /^\|.+\|$/.test(lines[i] ?? '')) {
        const row = (lines[i] ?? '').split('|').slice(1, -1).map((c) => c.trim())
        rows.push(row)
        i++
      }
      blocks.push({ type: 'table', content: '', header, rows })
      continue
    }

    // 列表
    if (/^(\s*)[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && (/^(\s*)[-*+]\s+/.test(lines[i] ?? '') || /^\s*\d+\.\s+/.test(lines[i] ?? ''))) {
        items.push((lines[i] ?? '').replace(/^(\s*)([-*+]|\d+\.)\s+/, ''))
        i++
      }
      blocks.push({ type: 'list', content: '', items })
      continue
    }

    // 分割线
    if (/^[-*_]{3,}$/.test(line.trim())) {
      blocks.push({ type: 'hr', content: '' })
      i++
      continue
    }

    // 空行
    if (line.trim() === '') {
      i++
      continue
    }

    // 段落
    const p: string[] = []
    while (i < lines.length && lines[i]?.trim() !== '' && !/^(#{1,6}\s|```|>\s?|\||[-*+]\s|\d+\.\s|[-*_]{3,}$)/.test(lines[i] ?? '')) {
      p.push(lines[i] ?? '')
      i++
    }
    // 防御：若 p 为空，说明当前行触发了「看起来像块元素」但并非任何已识别块。
    // 将此行当作单行段落处理，避免死循环（例如 \`\`\`\`markdown 等四反引号行）
    if (p.length === 0) {
      p.push(lines[i] ?? '')
      i++
    }
    blocks.push({ type: 'p', content: p.join('\n') })
  }
  return blocks
}

function inline(s: string): string {
  let out = escapeHtml(s)
  // 行内代码
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  // 粗体
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  // 斜体
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  out = out.replace(/_([^_]+)_/g, '<em>$1</em>')
  // 链接
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  // 图片
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
  return out
}

function renderHtml(md: string): string {
  const blocks = parse(md)
  const parts: string[] = []
  for (const b of blocks) {
    switch (b.type) {
      case 'h': {
        const level = Math.min(6, Math.max(1, ((b.content.match(/^#+/) ?? ['#'])[0]?.length) ?? 1))
        const text = b.content.replace(/^#+\s*/, '')
        parts.push(`<h${level}>${inline(text)}</h${level}>`)
        break
      }
      case 'p':
        parts.push(`<p>${inline(b.content).replace(/\n/g, '<br/>')}</p>`)
        break
      case 'code':
        parts.push(`<pre><code class="language-${b.lang}">${escapeHtml(b.content)}</code></pre>`)
        break
      case 'mermaid': {
        const id = `mmd-${Math.random().toString(36).slice(2, 9)}`
        // 客户端 mermaid 扫描器会读取 data-mermaid-source 并替换为 <svg>
        parts.push(`<div class="mermaid-block"><div class="mermaid-container" data-mermaid-id="${id}" data-mermaid-source="${encodeURIComponent(b.content)}"><div class="mermaid-loading">⏳ 渲染 Mermaid 图表中…</div></div></div>`)
        break
      }
      case 'quote':
        parts.push(`<blockquote>${inline(b.content).replace(/\n/g, '<br/>')}</blockquote>`)
        break
      case 'list':
        parts.push(`<ul>${(b.items ?? []).map((it) => `<li>${inline(it)}</li>`).join('')}</ul>`)
        break
      case 'hr':
        parts.push('<hr/>')
        break
      case 'table': {
        const head = `<tr>${(b.header ?? []).map((h) => `<th>${inline(h)}</th>`).join('')}</tr>`
        const body = (b.rows ?? []).map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')
        parts.push(`<table>${head}${body}</table>`)
        break
      }
    }
  }
  return parts.join('\n')
}

export function renderMarkdown(md: string): string {
  const text = md ?? ''
  if (text.length > MAX_PREVIEW_CHARS) {
    return `<div style="padding:16px;color:var(--text-muted,oklch(0.55_0.01_260));border:1px dashed var(--border,oklch(0.88_0_260));border-radius:6px;font-size:13px;">⚠️ 内容过长（${text.length.toLocaleString()} 字符），已暂停实时预览以保持编辑器流畅。保存后仍可正常发布。</div>`
  }
  return renderHtml(text)
}
