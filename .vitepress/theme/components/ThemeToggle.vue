<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'
import { useToggle } from '@vueuse/core'
import { useData } from 'vitepress'

const { isDark } = useData()
const toggleDark = useToggle(isDark)
</script>

<template>
  <button type="button"
    class="theme-toggle group inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.12em] rounded-sm transition-all duration-200"
    style="color: var(--text-tertiary); border-color: var(--ink-200);"
    :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
    :aria-pressed="isDark"
    @click="toggleDark()">
    <Transition name="theme-icon" mode="out-in">
      <Sun v-if="isDark" key="sun" class="h-3.5 w-3.5" aria-hidden="true" />
      <Moon v-else key="moon" class="h-3.5 w-3.5" aria-hidden="true" />
    </Transition>
    <span class="hidden sm:inline">{{ isDark ? 'Light' : 'Dark' }}</span>
  </button>
</template>

<style scoped>
.theme-toggle:hover {
  color: var(--text-primary);
  border-color: var(--ink-400);
}

.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.theme-icon-enter-from,
.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(-90deg) scale(0.7);
}
</style>
