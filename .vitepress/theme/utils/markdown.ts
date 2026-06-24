import type { Element, Nodes, Root, Text } from 'hast'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import type { SafeElementNode, SafeNode, SafePropertyValue, SafeRootNode } from '../types/blog'

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'math',
    'semantics',
    'mrow',
    'mi',
    'mn',
    'mo',
    'msup',
    'msub',
    'mfrac',
    'annotation'
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': [
      ...((defaultSchema.attributes?.['*'] as readonly unknown[] | undefined) ?? []),
      'className',
      'aria-hidden',
      'aria-label',
      'role'
    ],
    a: [
      ...((defaultSchema.attributes?.a as readonly unknown[] | undefined) ?? []),
      'href',
      'title',
      'target',
      'rel'
    ],
    code: [
      ...((defaultSchema.attributes?.code as readonly unknown[] | undefined) ?? []),
      ['className', /^language-/u, 'hljs']
    ],
    span: [
      ...((defaultSchema.attributes?.span as readonly unknown[] | undefined) ?? []),
      ['className', /^hljs-/u, /^katex/u, /^mord/u, /^mop/u, /^mrel/u, /^mopen/u, /^mclose/u, /^mspace/u, /^base/u, /^strut/u, /^vlist/u, /^pstrut/u, /^mfrac/u, /^mord/u]
    ],
    div: [
      ...((defaultSchema.attributes?.div as readonly unknown[] | undefined) ?? []),
      ['className', /^math/u, /^katex/u]
    ],
    math: ['xmlns'],
    annotation: ['encoding']
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto']
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeKatex)
  .use(rehypeHighlight, { detect: false, ignoreMissing: true })
  .use(rehypeSanitize, sanitizeSchema)

export function renderMarkdownToSafeAst(markdown: string): SafeRootNode {
  const mdast = processor.parse(markdown)
  const hast = processor.runSync(mdast) as Root
  return toSafeRoot(hast)
}

function toSafeRoot(root: Root): SafeRootNode {
  return {
    type: 'root',
    children: root.children.map(convertNode).filter(isSafeNode)
  }
}

function convertNode(node: Nodes): SafeNode | null {
  if (node.type === 'text') return convertTextNode(node)
  if (node.type === 'element') return convertElementNode(node)
  if ('children' in node) {
    return {
      type: 'root',
      children: node.children.map(convertNode).filter(isSafeNode)
    }
  }
  return null
}

function convertTextNode(node: Text): SafeNode {
  return {
    type: 'text',
    value: node.value
  }
}

function convertElementNode(node: Element): SafeElementNode {
  return {
    type: 'element',
    tagName: node.tagName,
    properties: normalizeProperties(node.properties),
    children: node.children.map(convertNode).filter(isSafeNode)
  }
}

function normalizeProperties(properties: Element['properties']): Record<string, SafePropertyValue> {
  const safeProperties: Record<string, SafePropertyValue> = {}

  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      safeProperties[key] = value
      continue
    }

    if (Array.isArray(value)) {
      const normalized = value
        .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
        .join(' ')
      if (normalized.length > 0) safeProperties[key] = normalized
    }
  }

  return safeProperties
}

function isSafeNode(node: SafeNode | null): node is SafeNode {
  return node !== null
}
