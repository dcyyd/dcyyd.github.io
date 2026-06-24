<script setup lang="ts">
import { Check, Clipboard } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps<{
  value: string
}>()

const copied = ref(false)

async function copy(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  await navigator.clipboard.writeText(props.value)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1800)
}
</script>

<template>
  <button
    type="button"
    class="copy-btn group relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200"
    :aria-label="copied ? '已复制代码' : '复制代码'"
    @click="copy"
  >
    <!-- 悬停背景层 -->
    <span
      class="absolute inset-0 rounded-md opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      :style="{ background: copied ? 'rgba(16,185,129,0.1)' : 'var(--muted)' }"
    />
    <!-- 图标与文字 -->
    <span class="relative z-10 flex items-center gap-1.5">
      <Transition name="copy-icon" mode="out-in">
        <Check v-if="copied" key="check" class="h-3.5 w-3.5" :style="{ color: '#10b981' }" aria-hidden="true" />
        <Clipboard v-else key="clipboard" class="h-3.5 w-3.5" style="color: var(--text-tertiary);" aria-hidden="true" />
      </Transition>
      <span
        class="mono-num text-[11px] font-medium uppercase tracking-[0.08em]"
        :style="{ color: copied ? '#10b981' : 'var(--text-tertiary)' }"
      >
        {{ copied ? 'Copied' : 'Copy' }}
      </span>
    </span>
  </button>
</template>

<style scoped>
.copy-btn {
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

.copy-icon-enter-active,
.copy-icon-leave-active {
  transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.copy-icon-enter-from,
.copy-icon-leave-to {
  opacity: 0;
  transform: scale(0.7) rotate(-15deg);
}
</style>
