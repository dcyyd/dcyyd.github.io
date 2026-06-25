<script setup lang="ts">
import { computed, ref } from 'vue'
import { X, Hash, ChevronDown, ChevronUp } from 'lucide-vue-next'
import type { TagInfo } from '../types/blog'

const props = defineProps<{
  tags: TagInfo[]
  selected: string[]
}>()

const emit = defineEmits<{
  change: [value: string[]]
  clear: []
}>()

const COLLAPSE_THRESHOLD = 12

const expanded = ref(false)

const visibleTags = computed(() => {
  if (expanded.value || props.tags.length <= COLLAPSE_THRESHOLD) {
    return props.tags
  }
  return props.tags.slice(0, COLLAPSE_THRESHOLD)
})

const hiddenCount = computed(() => {
  if (props.tags.length <= COLLAPSE_THRESHOLD) return 0
  return props.tags.length - COLLAPSE_THRESHOLD
})

function isSelected(tag: string): boolean {
  return props.selected.includes(tag)
}

function toggleTag(tag: string): void {
  const nextSelected = isSelected(tag)
    ? props.selected.filter((item) => item !== tag)
    : [...props.selected, tag]
  emit('change', nextSelected)
}
</script>

<template>
  <div class="tag-filter" aria-label="标签筛选">
    <div class="flex items-center justify-between mb-3">
      <span class="eyebrow" style="font-size: 10px;">Filter · 标签</span>
      <button v-if="selected.length > 0" type="button"
        class="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors hover:text-[var(--accent)]"
        style="color: var(--text-tertiary); background: none; border: 0; cursor: pointer;"
        @click="emit('clear')">
        <X class="h-2.5 w-2.5" aria-hidden="true" />
        Clear
      </button>
    </div>

    <ul class="flex flex-wrap gap-1.5">
      <li v-for="tag in visibleTags" :key="tag.slug">
        <button type="button"
          :class="['tag-chip', isSelected(tag.name) && 'is-active']"
          :aria-pressed="isSelected(tag.name)"
          @click="toggleTag(tag.name)">
          <Hash class="h-3 w-3" aria-hidden="true" />
          {{ tag.name }}
          <span class="tag-count" :aria-label="`${tag.count} 篇文章`">{{ tag.count }}</span>
        </button>
      </li>
    </ul>

    <!-- 展开/收起 -->
    <button
      v-if="tags.length > COLLAPSE_THRESHOLD"
      type="button"
      class="tag-expand-btn mt-2"
      @click="expanded = !expanded"
    >
      <component :is="expanded ? ChevronUp : ChevronDown" class="h-3 w-3" aria-hidden="true" />
      {{ expanded ? '收起标签' : `展开更多标签（${hiddenCount}）` }}
    </button>
  </div>
</template>

<style scoped>
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  background: var(--paper);
  color: var(--text-secondary);
  border: 1px solid var(--ink-200);
  cursor: pointer;
  border-radius: 9999px;
  transition: all 0.2s ease;
}

.tag-chip:hover {
  border-color: var(--ink-400);
  color: var(--text-primary);
}

.tag-chip.is-active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.tag-chip.is-active:hover {
  background: var(--accent);
  opacity: 0.9;
}

.tag-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  padding-left: 5px;
  margin-left: 1px;
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  opacity: 0.65;
  border-left: 1px solid currentColor;
}

.tag-chip.is-active .tag-count {
  opacity: 0.9;
}

.tag-expand-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
  background: none;
  border: 1px solid var(--ink-150);
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-expand-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
