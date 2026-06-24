<script setup lang="ts">
import { useToastStore } from '../stores'

const toastStore = useToastStore()

const iconFor = (kind: string) => {
  if (kind === 'success') return '✓'
  if (kind === 'error') return '✕'
  if (kind === 'warning') return '!'
  return 'ⓘ'
}
</script>

<template>
  <div class="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
    <transition-group name="t" tag="div" class="flex flex-col gap-2">
      <div
        v-for="t in toastStore.items"
        :key="t.id"
        class="toast pointer-events-auto"
        :class="`toast-${t.type}`"
      >
        <span class="toast-icon mono-num">{{ iconFor(t.type) }}</span>
        <span class="toast-msg">{{ t.message }}</span>
        <button
          class="text-xs ml-1"
          style="color: var(--text-tertiary);"
          @click="toastStore.remove(t.id)"
        >×</button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.t-enter-active, .t-leave-active {
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.t-enter-from { opacity: 0; transform: translateX(20px); }
.t-leave-to   { opacity: 0; transform: translateX(20px); }
</style>
