<script setup lang="ts">
import { computed } from 'vue'
import { Clock, ArrowUpRight, CalendarDays, Layers } from 'lucide-vue-next'
import { data as archivesData } from '../data/archives.data'
import type { PostMeta, YearArchive } from '../types/blog'

const archives = archivesData as YearArchive[]

const totalCount = computed(() => archives.reduce((sum, item) => sum + item.count, 0))
const yearsCount = computed(() => archives.length)
const lastYear = computed(() => archives[0]?.year ?? '—')
const firstYear = computed(() => archives[archives.length - 1]?.year ?? '—')
</script>

<template>
  <article class="mx-auto max-w-[1240px] px-8">
    <!-- ============== HERO · 期刊式头部 ============== -->
    <section class="animate-fade-up pt-12 pb-12 sm:pt-14 sm:pb-20">
      <div class="eyebrow flex items-center gap-3">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>Archives · 按年份归档</span>
      </div>

      <div class="mt-10 grid gap-16 lg:grid-cols-[1.7fr_1fr] lg:items-end">
        <div>
          <h1 class="serif-title text-balance text-[2.75rem] leading-[1.04] sm:text-[3.75rem] lg:text-[5.25rem]"
            style="color: var(--text-primary);">
            <span class="italic-serif">Archives</span>
          </h1>
          <p class="mt-8 max-w-[560px] text-[17px] leading-[1.7]" style="color: var(--text-secondary);">
            所有文章按<b class="font-medium text-[var(--text-primary)]">发布年份倒序</b>排列，
            便于追溯与回顾。
          </p>
        </div>

        <!-- 期刊式元数据侧栏 -->
        <aside class="space-y-4 pt-6 lg:max-w-[280px]">
          <dl class="grid grid-cols-[80px_1fr] gap-x-4 gap-y-3">
            <dt class="eyebrow self-center" style="font-size: 10px;">Years</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(yearsCount).padStart(2, '0') }} spans</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Total</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(totalCount).padStart(2, '0') }} articles</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Range</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ firstYear }} → {{ lastYear }}</dd>
          </dl>
        </aside>
      </div>
    </section>

    <!-- ============== 归档时间轴 ============== -->
    <section class="pb-20" aria-label="归档">
      <div class="eyebrow flex items-center gap-3 mb-10">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>Timeline</span>
      </div>

      <!-- 有数据 -->
      <div v-if="archives.length > 0" class="space-y-0">
        <article v-for="(group, gIdx) in archives" :key="group.year"
          class="archive-year-group"
          :style="{ animationDelay: `${gIdx * 120}ms` }">
          <!-- 年份标题行 -->
          <div class="year-header flex items-center gap-4 pb-4 border-b" style="border-color: var(--ink-200);">
            <span class="serif-title text-[3rem] sm:text-[4rem] leading-none tracking-tight"
              style="color: var(--text-primary);">
              {{ group.year }}
            </span>
            <span class="mono-num text-[11px] mt-2" style="color: var(--text-tertiary);">
              {{ group.count }} 篇
            </span>
          </div>

          <!-- 文章列表 -->
          <ol>
            <li v-for="(post, pIdx) in group.posts" :key="post.slug"
              class="archive-row group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-b py-3.5 transition-colors duration-200"
              style="border-color: var(--ink-200);"
              :style="{ animationDelay: `${gIdx * 120 + pIdx * 40}ms` }">
              <!-- 日期 -->
              <time :datetime="post.isoDate"
                class="mono-num inline-flex shrink-0 items-center gap-1.5 text-[11.5px] font-medium"
                style="color: var(--text-tertiary);">
                <CalendarDays class="h-3 w-3 shrink-0" aria-hidden="true" />
                {{ post.date }}
              </time>

              <!-- 标题 -->
              <a :href="post.url"
                class="flex-1 min-w-0 text-[14.5px] font-medium leading-[1.5] truncate transition-colors duration-200"
                style="color: var(--text-primary);">
                {{ post.title }}
              </a>

              <!-- 右侧元数据 -->
              <div class="flex items-center gap-3 shrink-0 text-[11.5px]" style="color: var(--text-tertiary);">
                <span v-if="post.category"
                  class="hidden shrink-0 border px-2 py-0.5 text-[10px] font-medium sm:inline-flex"
                  style="border-color: var(--ink-200); color: var(--text-secondary);">
                  {{ post.category }}
                </span>
                <span class="hidden shrink-0 items-center gap-1 sm:inline-flex">
                  <Clock class="h-3 w-3" aria-hidden="true" />
                  <span class="mono-num">{{ post.readingTime }} min</span>
                </span>
                <ArrowUpRight
                  class="h-3.5 w-3.5 shrink-0 transition-all duration-200 group-hover:text-[var(--accent)]"
                  aria-hidden="true"
                />
              </div>
            </li>
          </ol>
        </article>
      </div>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center border border-dashed py-20"
        style="border-color: var(--ink-200); background: var(--muted);">
        <Layers class="mb-4 h-10 w-10" style="color: var(--text-tertiary);" aria-hidden="true" />
        <h2 class="serif-title text-[1.5rem]" style="color: var(--text-primary);">暂无归档</h2>
        <p class="mt-3 text-[14px]" style="color: var(--text-secondary);">
          请确认 content/posts/ 下存在已发布的 Markdown 文章。
        </p>
      </div>
    </section>
  </article>
</template>

<style scoped>
/* 年份分组入场 */
.archive-year-group {
  animation: year-rise 0.5s ease both;
  margin-bottom: 48px;
}

.archive-year-group:last-child {
  margin-bottom: 0;
}

/* 文章行 hover */
.archive-row:hover {
  background: var(--muted);
}

.archive-row:hover a {
  color: var(--accent);
}

/* 入场动画 */
@keyframes year-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .archive-year-group {
    animation: none;
  }
}

@media (max-width: 640px) {
  .archive-year-group {
    margin-bottom: 36px;
  }
}
</style>
