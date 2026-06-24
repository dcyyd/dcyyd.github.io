<script setup lang="ts">
import type { PropType, VNodeChild } from 'vue'
import { defineComponent, h, ref } from 'vue'
import type { SafeElementNode, SafeNode, SafeRootNode } from '../types/blog'
import CodeBlock from './CodeBlock.vue'
import MermaidChart from './MermaidChart.vue'

const props = defineProps<{
  root: SafeRootNode
}>()

// ====== 图片灯箱 ======
const lightboxOpen = ref(false)
const lightboxSrc = ref('')
const lightboxAlt = ref('')

function openLightbox(src: string, alt: string): void {
  lightboxSrc.value = src
  lightboxAlt.value = alt
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeLightbox(): void {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

// ====== 安全属性 ======
const allowedAttributes = new Set([
  'id',
  'className',
  'href',
  'title',
  'target',
  'rel',
  'src',
  'alt',
  'width',
  'height',
  'loading',
  'aria-hidden',
  'aria-label',
  'role',
  'checked',
  'disabled',
  'type',
  'colspan',
  'rowspan',
  'scope'
])

const SafeNodeRenderer = defineComponent({
  name: 'SafeNodeRenderer',
  props: {
    node: {
      type: Object as PropType<SafeNode>,
      required: true
    }
  },
  setup(componentProps) {
    return () => renderNode(componentProps.node)
  }
})

function renderNode(node: SafeNode): VNodeChild {
  if (node.type === 'text') return node.value
  if (node.type === 'root') return node.children.map((child) => h(SafeNodeRenderer, { node: child }))

  // 代码块 → CodeBlock 组件
  const codeBlock = getCodeBlock(node)
  if (codeBlock) {
    // Mermaid 代码块 → 走图表渲染器
    if (codeBlock.language.toLowerCase() === 'mermaid') {
      return h(MermaidChart, { code: codeBlock.code, id: `b${(node as any).position?.start?.line ?? Math.random().toString(36).slice(2, 7)}` })
    }
    return h(CodeBlock, {
      code: codeBlock.code,
      language: codeBlock.language,
      nodes: codeBlock.nodes
    })
  }

  // 图片 → 可点击灯箱
  if (node.tagName === 'img') {
    const src = (typeof node.properties.src === 'string' ? node.properties.src : '') || ''
    const alt = (typeof node.properties.alt === 'string' ? node.properties.alt : '') || ''
    return h('div', { class: 'img-wrapper' }, [
      h('img', {
        ...createSafeProps(node),
        loading: 'lazy',
        class: 'blog-img',
        onClick: () => openLightbox(src, alt)
      })
    ])
  }

  // 表格 → 横向滚动容器
  if (node.tagName === 'table') {
    return h('div', { class: 'table-wrapper' }, [
      h('table', createSafeProps(node), node.children.map((child) => h(SafeNodeRenderer, { node: child })))
    ])
  }

  // 默认渲染
  return h(
    node.tagName,
    createSafeProps(node),
    node.children.map((child) => h(SafeNodeRenderer, { node: child }))
  )
}

function createSafeProps(node: SafeElementNode): Record<string, string | number | boolean> {
  const safeProps: Record<string, string | number | boolean> = {}

  for (const [key, value] of Object.entries(node.properties)) {
    if (!allowedAttributes.has(key)) continue
    safeProps[key === 'className' ? 'class' : key] = value
  }

  if (node.tagName === 'a') {
    const href = typeof node.properties.href === 'string' ? node.properties.href : ''
    if (href.startsWith('http')) {
      safeProps.target = '_blank'
      safeProps.rel = 'noreferrer noopener'
    }
  }

  return safeProps
}

function getCodeBlock(node: SafeElementNode): { code: string; language: string; nodes: SafeNode[] } | null {
  if (node.tagName !== 'pre') return null
  const codeNode = node.children.find(
    (child): child is SafeElementNode => child.type === 'element' && child.tagName === 'code'
  )
  if (!codeNode) return null

  const className = typeof codeNode.properties.className === 'string' ? codeNode.properties.className : ''
  const language = className
    .split(' ')
    .find((item) => item.startsWith('language-'))
    ?.replace('language-', '') ?? 'text'

  return {
    code: collectText(codeNode),
    language,
    nodes: codeNode.children
  }
}

function collectText(node: SafeNode): string {
  if (node.type === 'text') return node.value
  return node.children.map(collectText).join('')
}
</script>

<template>
  <div>
    <SafeNodeRenderer v-for="(node, index) in props.root.children" :key="index" :node="node" />
  </div>

  <!-- ====== 图片灯箱遮罩 ====== -->
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="lightboxOpen"
        class="lightbox-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="图片预览"
        @click.self="closeLightbox"
        @keydown.escape="closeLightbox"
      >
        <button class="lightbox-close" @click="closeLightbox" aria-label="关闭预览">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <img :src="lightboxSrc" :alt="lightboxAlt" class="lightbox-img" />
        <p v-if="lightboxAlt" class="lightbox-caption">{{ lightboxAlt }}</p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ====== 图片 ====== */
:deep(.img-wrapper) {
  margin: 2rem 0;
}

:deep(.blog-img) {
  max-width: 100%;
  display: block;
  border-radius: 8px;
  cursor: zoom-in;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

:deep(.blog-img:hover) {
  transform: scale(1.01);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

/* ====== 表格 ====== */
:deep(.table-wrapper) {
  margin: 2rem 0;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--ink-200);
}

:deep(.table-wrapper table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
  margin: 0;
}

:deep(.table-wrapper thead) {
  border-bottom: 1.5px solid var(--ink-900);
}

:deep(.table-wrapper th),
:deep(.table-wrapper td) {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid var(--ink-100);
  color: var(--text-secondary);
  white-space: nowrap;
}

:deep(.table-wrapper th) {
  color: var(--text-primary);
  font-weight: 600;
  background: var(--muted);
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
}

:deep(.table-wrapper tr:last-child td) {
  border-bottom: none;
}

:deep(.table-wrapper tbody tr:hover) {
  background: var(--muted);
}

/* ====== 灯箱 ====== */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  padding: 2rem;
  cursor: zoom-out;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  cursor: default;
}

.lightbox-caption {
  margin-top: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  text-align: center;
  max-width: 70ch;
}

.lightbox-close {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* 灯箱过渡 */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.25s ease;
}

.lightbox-enter-active .lightbox-img,
.lightbox-leave-active .lightbox-img {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

.lightbox-enter-from .lightbox-img {
  transform: scale(0.9);
}

.lightbox-leave-to .lightbox-img {
  transform: scale(0.95);
}
</style>
