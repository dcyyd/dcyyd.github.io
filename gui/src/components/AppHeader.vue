<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineProps<{ dark: boolean }>()
const emit = defineEmits<{ (e: 'toggleTheme'): void }>()

const route = useRoute()

const titles: Record<string, { title: string; eyebrow: string; sub: string }> = {
  '/':          { title: '工作台',   eyebrow: 'OVERVIEW',  sub: '总览当前博客状态' },
  '/editor':    { title: '编辑器',   eyebrow: 'WRITE',     sub: '创建或修改文章' },
  '/files':     { title: '文件管理', eyebrow: 'LIBRARY',   sub: '管理 content/posts/ 下的所有 Markdown' },
  '/deploy':    { title: '一键部署', eyebrow: 'SHIP',      sub: '推送 gh-pages · 实时日志' },
  '/logs':      { title: '日志中心', eyebrow: 'HISTORY',   sub: '浏览 logs/ 下的历史文档' },
  '/help':      { title: '使用指引', eyebrow: 'GUIDE',     sub: '5 步上手 + 常见问题' }
}

const current = computed(() => {
  const exact = titles[route.path]
  if (exact) return exact
  if (route.path.startsWith('/editor')) return { title: '编辑器', eyebrow: 'WRITE', sub: '编辑文章' }
  return titles['/']!
})
</script>

<template>
  <header class="px-8 py-5 border-b flex items-center justify-between gap-4 flex-shrink-0" style="background: var(--paper); border-color: var(--border);">
    <div class="min-w-0">
      <div class="eyebrow">{{ current.eyebrow }}</div>
      <h1 class="serif-title text-2xl mt-0.5 truncate" style="color: var(--text);">{{ current.title }}</h1>
      <div class="text-xs mt-0.5" style="color: var(--text-muted);">{{ current.sub }}</div>
    </div>
    <div class="flex items-center gap-2 flex-shrink-0">
      <button class="btn btn-ghost btn-sm" @click="emit('toggleTheme')" :title="dark ? '切换为浅色' : '切换为深色'">
        <span v-if="dark">☀ 浅色</span>
        <span v-else>☾ 深色</span>
      </button>
      <a class="btn btn-ghost btn-sm" href="https://github.com/dcyyd/dcyyd.github.io" target="_blank" rel="noreferrer">
        ↗ GitHub
      </a>
    </div>
  </header>
</template>
