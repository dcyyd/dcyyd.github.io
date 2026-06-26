<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostsStore } from '../stores'

const route = useRoute()
const router = useRouter()
const postsStore = usePostsStore()

interface NavItem { label: string; to: string; icon: string; eyebrow: string }
const items: NavItem[] = [
  { label: '工作台',   to: '/',          icon: '◈', eyebrow: 'OVERVIEW' },
  { label: '编辑器',   to: '/editor',    icon: '✎', eyebrow: 'WRITE' },
  { label: '文件管理', to: '/files',     icon: '▤', eyebrow: 'LIBRARY' },
  { label: '一键部署', to: '/deploy',    icon: '▲', eyebrow: 'SHIP' },
  { label: '使用指引', to: '/help',      icon: '?',  eyebrow: 'GUIDE' }
]

const active = computed(() => route.path)
function go(to: string) { router.push(to) }
</script>

<template>
  <aside class="w-60 flex-shrink-0 flex flex-col border-r" style="background: var(--card); border-color: var(--border);">
    <!-- Brand -->
    <div class="px-5 pt-6 pb-5">
      <div class="flex items-baseline gap-2">
        <span class="serif-title text-xl" style="color: var(--text);">FilePress</span>
        <span class="italic-serif text-sm">blog</span>
      </div>
      <div class="eyebrow mt-1.5">GUI · 管理工作台</div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-2 space-y-0.5">
      <div
        v-for="item in items"
        :key="item.to"
        class="nav-item"
        :class="{ active: active === item.to || (item.to !== '/' && active.startsWith(item.to)) }"
        @click="go(item.to)"
      >
        <span class="w-5 text-center text-base" style="color: inherit;">{{ item.icon }}</span>
        <span class="flex-1">{{ item.label }}</span>
        <span class="eyebrow text-[10px]" style="opacity: 0.5;">{{ item.eyebrow }}</span>
      </div>
    </nav>

    <!-- Footer -->
    <div class="px-5 py-4 border-t" style="border-color: var(--border);">
      <div class="flex items-center gap-2 text-xs" style="color: var(--text-muted);">
        <span class="dot" :class="postsStore.loading ? 'dot-yellow' : 'dot-green'"></span>
        <span class="mono-num">{{ postsStore.posts.length }}</span>
        <span>篇文章</span>
      </div>
      <div class="eyebrow mt-2" style="opacity: 0.6;">v0.5.0</div>
    </div>
  </aside>
</template>
