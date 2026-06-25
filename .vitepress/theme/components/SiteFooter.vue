<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ArrowUp, Heart, Clock, Eye } from 'lucide-vue-next'
import { fetchGlobalViewCount, hitGlobalViewCount, formatViewCount, getTotalViewCount } from '../utils/viewCount'

const visible = ref(false)
const now = ref('')
const totalViews = ref(0)

function handleScroll() {
  visible.value = window.scrollY > 320
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function updateTime() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  now.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 刷新全局实时访问量 */
async function refreshViews() {
  // 优先使用全局实时计数器；API 不可用时降级为 localStorage 本地值
  const global = await fetchGlobalViewCount()
  totalViews.value = global > 0 ? global : getTotalViewCount()
}

let timer: ReturnType<typeof setInterval> | null = null
let viewTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  updateTime()
  timer = setInterval(updateTime, 60_000)

  // 初始化：hit 全局计数器（首次访问），然后定时刷新显示
  const hitResult = await hitGlobalViewCount()
  totalViews.value = hitResult > 0 ? hitResult : getTotalViewCount()
  viewTimer = setInterval(refreshViews, 30_000)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  if (timer) clearInterval(timer)
  if (viewTimer) clearInterval(viewTimer)
})

const footerLinks = [
  { label: 'GitHub', href: 'https://github.com/dcyyd/dcyyd.github.io' },
  { label: 'Email', href: 'mailto:dcyyd_kcug@yeah.net' },
  { label: 'RSS', href: '/feed.xml' }
]
</script>

<template>
  <footer class="mt-12 border-t" :style="{ borderColor: 'var(--ink-200)', background: 'var(--paper)' }">
    <div class="mx-auto max-w-[1240px] px-6 sm:px-8">
      <!-- 主行 -->
      <div class="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-y-3 gap-x-8 py-5 text-[11.5px]">
        <!-- 左侧 -->
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-center sm:text-left"
          style="color: var(--text-tertiary);">
          <span style="color: var(--text-primary); font-weight: 500;">&copy; 2026 FilePress &middot; Blog</span>
          <span aria-hidden="true">—</span>
          <span class="inline-flex items-center gap-1">
            <Heart class="h-3 w-3" aria-hidden="true" />
            <span>Powered by <a href="https://vitepress.dev" class="text-[var(--accent)]">VitePress</a></span>
          </span>
        </div>

        <!-- 右侧 -->
        <div class="flex items-center gap-4">
          <!-- 快捷导航 -->
          <a v-for="link in footerLinks" :key="link.href" :href="link.href"
            class="footer-link hidden sm:inline text-[11px] transition-colors duration-200 hover:text-[var(--accent)]"
            style="color: var(--text-tertiary);">
            {{ link.label }}
          </a>

          <!-- 时钟 -->
          <span v-if="now" class="mono-num inline-flex items-center gap-1"
            style="color: var(--text-tertiary);">
            <Clock class="h-3 w-3" aria-hidden="true" />
            {{ now }}
          </span>

          <!-- 站点总访问量（全局实时） -->
          <span class="mono-num inline-flex items-center gap-1"
            style="color: var(--text-tertiary);">
            <Eye class="h-3 w-3" aria-hidden="true" />
            {{ formatViewCount(totalViews) }} 次访问
          </span>

          <!-- 回到顶部 -->
          <button v-show="visible" type="button"
            class="footer-top-btn" aria-label="回到顶部" @click="scrollToTop">
            <ArrowUp class="h-3 w-3" aria-hidden="true" />
            <span>TOP</span>
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-top-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border-radius: 9999px;
  border: 1px solid var(--ink-200);
  padding: 3px 10px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-tertiary);
  background: var(--paper);
  transition: all 0.25s ease;
}

.footer-top-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.footer-link {
  text-decoration: none;
}

@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.75; transform: scale(1.08); }
}

.animate-pulse-slow {
  animation: pulse-slow 2.4s ease-in-out infinite;
}
</style>
