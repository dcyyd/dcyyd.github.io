<script setup lang="ts">
import { Menu, X } from 'lucide-vue-next'
import { useRoute } from 'vitepress'
import { computed, ref, watch } from 'vue'
import ThemeToggle from './ThemeToggle.vue'

interface NavItem {
  label: string
  href: string
}

const route = useRoute()
const open = ref(false)
const navItems: NavItem[] = [
  { label: '首页', href: '/' },
  { label: '博客', href: '/blog' },
  { label: '分类', href: '/categories' },
  { label: '归档', href: '/archives' },
  { label: '友链', href: '/friends' },
  { label: '关于', href: '/about' },
  { label: '更新日志', href: '/changelog' },
]

const normalizedPath = computed(() => route.path.replace(/\.html$/u, ''))

function isActive(href: string): boolean {
  if (href === '/') return normalizedPath.value === '/' || normalizedPath.value === '/index'
  return normalizedPath.value.startsWith(href)
}

// 路由变化时关闭移动端菜单
watch(() => route.path, () => { open.value = false })
</script>

<template>
  <header class="sticky top-0 z-40 border-b backdrop-blur-sm"
    style="border-color: var(--ink-200); background: var(--paper);">
    <nav class="mx-auto flex h-14 sm:h-16 max-w-[1240px] items-center justify-between px-6 sm:px-8" aria-label="主导航">
      <!-- Brand -->
      <a href="/" class="group flex items-center gap-2.5 shrink-0" aria-label="返回首页">
        <span class="mono-num inline-flex h-8 w-8 items-center justify-center text-[13px] font-semibold rounded-sm"
          style="background: var(--ink-900); color: var(--paper);">
          F
        </span>
        <span class="flex flex-col leading-none hidden sm:flex">
          <span class="serif-title text-[15px] leading-none" style="color: var(--text-primary);">FilePress · Blog</span>
          <span class="eyebrow mt-0.5 leading-none" style="font-size: 8.5px;">Est. 2026</span>
        </span>
      </a>

      <!-- Desktop Nav -->
      <div class="hidden md:flex items-center gap-0.5">
        <a v-for="item in navItems" :key="item.href" :href="item.href"
          class="nav-link relative px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-200 rounded-sm"
          :class="isActive(item.href) ? 'is-active' : ''" :aria-current="isActive(item.href) ? 'page' : undefined"
          :style="{ color: isActive(item.href) ? 'var(--text-primary)' : 'var(--text-secondary)' }">
          {{ item.label }}
        </a>
        <span class="mx-1.5 inline-block h-4 w-px" style="background: var(--ink-200);" aria-hidden="true" />
        <ThemeToggle />
      </div>

      <!-- Mobile Toggle -->
      <button type="button" class="inline-flex items-center justify-center p-2 md:hidden rounded-sm -mr-2"
        style="color: var(--text-primary);" aria-label="切换菜单" :aria-expanded="open" @click="open = !open">
        <component :is="open ? X : Menu" class="h-5 w-5" aria-hidden="true" />
      </button>
    </nav>

    <!-- Mobile Drawer -->
    <Transition name="mobile-drawer">
      <div v-if="open" class="md:hidden border-t" style="border-color: var(--ink-200); background: var(--paper);">
        <div class="mx-auto max-w-[1240px] flex flex-col px-6 py-3">
          <a v-for="item in navItems" :key="item.href" :href="item.href"
            class="nav-link flex items-center justify-between py-2.5 text-[13.5px] font-medium"
            :class="isActive(item.href) ? 'is-active' : ''" :aria-current="isActive(item.href) ? 'page' : undefined"
            :style="{
              color: isActive(item.href) ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: '1px solid var(--ink-100)'
            }">
            <span>{{ item.label }}</span>
            <span v-if="isActive(item.href)" class="mono-num text-[9.5px] uppercase tracking-[0.2em]"
              style="color: var(--accent);" aria-hidden="true">active</span>
          </a>
          <div class="flex items-center justify-between pt-3 mt-1">
            <span class="eyebrow" style="font-size: 10px;">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.nav-link {
  transition: color 0.2s ease, background-color 0.15s ease;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--muted);
}

.nav-link.is-active {
  background: var(--muted);
}

/* 移动端抽屉过渡 */
.mobile-drawer-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mobile-drawer-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.mobile-drawer-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.mobile-drawer-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
