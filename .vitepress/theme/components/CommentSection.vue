<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vitepress'
import { MessagesSquare } from 'lucide-vue-next'

/**
 * Giscus 评论组件
 * 配置见 docs/COMMENTS.md，注入由 config.mts 的 vite.define 完成
 */

const route = useRoute()

const env = (import.meta.env ?? {}) as Record<string, string | undefined>
const repo = env.VITE_GISCUS_REPO ?? ''
const repoId = env.VITE_GISCUS_REPO_ID ?? ''
const category = env.VITE_GISCUS_CATEGORY ?? 'General'
const categoryId = env.VITE_GISCUS_CATEGORY_ID ?? ''
const lang = env.VITE_GISCUS_LANG ?? 'zh-CN'

const ready = Boolean(repo && repoId && categoryId)
const containerRef = ref<HTMLDivElement | null>(null)

function mount(): void {
  if (!ready || !containerRef.value) return
  // 重建容器，避免重复挂载
  containerRef.value.replaceChildren()
  const s = document.createElement('script')
  s.src = 'https://giscus.app/client.js'
  s.async = true
  s.crossOrigin = 'anonymous'
  s.setAttribute('data-repo', repo)
  s.setAttribute('data-repo-id', repoId)
  s.setAttribute('data-category', category)
  s.setAttribute('data-category-id', categoryId)
  s.setAttribute('data-mapping', 'specific')
  s.setAttribute('data-term', route.path)
  s.setAttribute('data-strict', '1')
  s.setAttribute('data-reactions-enabled', '1')
  s.setAttribute('data-emit-metadata', '0')
  s.setAttribute('data-input-position', 'top')
  // Giscus 原生支持跟随系统主题；VitePress 切换 dark 类时 iframe 内部也跟随
  s.setAttribute('data-theme', 'preferred_color_scheme')
  s.setAttribute('data-lang', lang)
  s.setAttribute('data-loading', 'lazy')
  containerRef.value.appendChild(s)
}

onMounted(mount)
onBeforeUnmount(() => containerRef.value?.replaceChildren())
watch(() => route.path, mount)
</script>

<template>
  <section v-if="ready" class="comments" aria-label="评论区">
    <header class="comments__header">
      <MessagesSquare class="h-5 w-5" style="color: var(--accent);" aria-hidden="true" />
      <h2 class="comments__title">评论</h2>
      <span class="comments__hint">由 GitHub Discussions 驱动</span>
    </header>
    <div ref="containerRef" class="comments__giscus" />
  </section>
</template>

<style scoped>
.comments {
  margin: 2.5rem 0 1.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--ink-200);
}

.comments__header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1.5rem;
}

.comments__title {
  font-family: 'Noto Serif SC', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.01em;
}

.comments__hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
  padding-left: 0.5rem;
  border-left: 1px solid var(--ink-200);
  margin-left: 0.25rem;
  line-height: 1.4;
}

.comments__giscus {
  width: 100%;
  min-height: 200px;
  border-radius: 0.5rem;
}

.comments__giscus :deep(iframe.giscus-frame) {
  width: 100%;
  border: none;
  color-scheme: light;
}

:global(.dark) .comments__giscus :deep(iframe.giscus-frame) {
  color-scheme: dark;
}
</style>
