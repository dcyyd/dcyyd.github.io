<script setup lang="ts">
import { computed } from 'vue'
import { Clock, ArrowUpRight, CalendarDays, Hash } from 'lucide-vue-next'
import type { PostMeta } from '../types/blog'
import { tagToSlug } from '../utils/slug'
import { formatWordCount } from '../utils/viewCount'

const props = defineProps<{
  post: PostMeta
  index?: number
}>()

const articleNo = computed(() => {
  const n = props.index ?? 0
  return String(n).padStart(2, '0')
})

// 格式化日期为"2026 · 06 · 22"风格
const formattedDate = computed(() => {
  const d = props.post.date
  if (!d) return ''
  const parts = d.split('-')
  if (parts.length === 3) {
    return `${parts[0]} · ${parts[1]} · ${parts[2]}`
  }
  return d
})
</script>

<template>
  <article class="article-card group border" style="border-color: var(--ink-200); background: var(--paper);">
    <!-- 封面图 -->
    <div v-if="post.cover" class="article-cover overflow-hidden">
      <img
        :src="post.cover"
        :alt="`${post.title} 封面图`"
        class="article-cover-img"
        loading="lazy"
        decoding="async"
      />
    </div>

    <div class="article-card-body">
      <!-- Meta: 编号 + 分类 -->
      <div class="article-meta">
        <span class="mono-num text-[10.5px] font-medium tracking-[0.16em]" style="color: var(--text-tertiary);">
          № {{ articleNo }}
        </span>
        <span v-if="post.category"
          class="inline-flex items-center border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]"
          style="border-color: var(--ink-200); color: var(--text-secondary);">
          {{ post.category }}
        </span>
      </div>

      <!-- Title -->
      <h2 class="article-title mt-3">
        <a :href="post.url" class="article-title-link">{{ post.title }}</a>
      </h2>

      <!-- Description -->
      <p v-if="post.description" class="article-desc mt-3 text-[14px] leading-[1.7]" style="color: var(--text-secondary);">
        {{ post.description }}
      </p>

      <!-- Tags -->
      <div v-if="post.tags && post.tags.length > 0" class="article-tags mt-3">
        <a v-for="tag in post.tags" :key="tag" :href="`/tags/${tagToSlug(tag)}`"
          class="article-tag" @click.stop>#{{ tag }}</a>
      </div>

      <!-- Footer -->
      <div class="article-footer flex items-center justify-between gap-3 pt-4 mt-auto border-t" style="border-color: var(--ink-200);">
        <div class="flex flex-wrap items-center gap-3 text-[11.5px]" style="color: var(--text-tertiary);">
          <time :datetime="post.isoDate" class="inline-flex items-center gap-1.5 font-medium">
            <CalendarDays class="h-3 w-3" aria-hidden="true" />
            {{ formattedDate }}
          </time>
          <span class="inline-flex items-center gap-1">
            <Clock class="h-3 w-3" aria-hidden="true" />
            <span class="mono-num">{{ post.readingTime }} min</span>
          </span>
          <span class="inline-flex items-center gap-1">
            <Hash class="h-3 w-3" aria-hidden="true" />
            <span class="mono-num">{{ formatWordCount(post.wordCount) }} 字</span>
          </span>
        </div>
        <a :href="post.url" class="article-read" aria-label="阅读全文">
          <span class="text-[10.5px] font-medium uppercase tracking-[0.16em]">Read</span>
          <ArrowUpRight class="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  </article>
</template>

<style scoped>
.article-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: transform 0.3s ease, border-color 0.25s ease, box-shadow 0.3s ease;
}

.article-card:hover {
  transform: translateY(-3px);
  border-color: var(--accent)/30;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.06);
}

.article-cover {
  aspect-ratio: 16 / 9;
  border-bottom: 1px solid var(--ink-200);
}

.article-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.article-card:hover .article-cover-img {
  transform: scale(1.03);
}

.article-card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1.25rem 1.25rem 1.25rem;
}

/* 无封面时增加顶部间距 */
.article-card:not(:has(.article-cover)) .article-card-body {
  padding-top: 1.5rem;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.article-title {
  font-family: ui-serif, 'Iowan Old Style', Georgia, serif;
  font-size: 20px;
  font-weight: 650;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.article-title-link {
  background-image: linear-gradient(currentColor, currentColor);
  background-size: 0% 1px;
  background-repeat: no-repeat;
  background-position: 0 100%;
  transition: background-size 0.3s ease, color 0.2s ease;
}

.article-title-link:hover {
  color: var(--accent);
  background-size: 100% 1px;
}

.article-desc {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.article-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border: 1px solid var(--ink-200);
  background: var(--muted);
  font-size: 10px;
  font-weight: 500;
  line-height: 1.5;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.article-tag:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.article-read {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-tertiary);
  transition: color 0.2s ease, gap 0.2s ease;
  flex-shrink: 0;
}

.article-read:hover {
  color: var(--accent);
  gap: 0.5rem;
}
</style>
