<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight, Folder, FileText } from 'lucide-vue-next'
import { data as categoriesData } from '../data/categories.data'
import { data as postsData } from '../data/posts.data'
import type { CategoryInfo, PostDetail } from '../types/blog'

const categories = categoriesData as CategoryInfo[]
const posts = postsData as PostDetail[]

const totalPosts = computed(() => posts.length)
const categorizedPosts = computed(() => posts.filter((post) => post.category.length > 0 && post.category !== '未分类').length)
const uncategorizedPosts = computed(() => posts.filter((post) => post.category === '未分类' || !post.category).length)
</script>

<template>
  <article class="mx-auto max-w-[1240px] px-8">
    <!-- ============== HERO · 期刊式头部 ============== -->
    <section class="animate-fade-up pt-12 pb-12 sm:pt-14 sm:pb-20">
      <div class="eyebrow flex items-center gap-3">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>Categories · 所有分类</span>
      </div>

      <div class="mt-10 grid gap-16 lg:grid-cols-[1.7fr_1fr] lg:items-end">
        <div>
          <h1 class="serif-title text-balance text-[2.75rem] leading-[1.04] sm:text-[3.75rem] lg:text-[5.25rem]"
            style="color: var(--text-primary);">
            <span class="italic-serif">Categories</span>
          </h1>
          <p class="mt-8 max-w-[560px] text-[17px] leading-[1.7]" style="color: var(--text-secondary);">
            每个分类代表一个<b class="font-medium text-[var(--text-primary)]">主题方向</b>，
            一篇文章归属唯一分类，便于定向浏览。
          </p>
        </div>

        <aside class="space-y-4 pt-6 lg:max-w-[280px]">
          <dl class="grid grid-cols-[80px_1fr] gap-x-4 gap-y-3">
            <dt class="eyebrow self-center" style="font-size: 10px;">Topics</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(categories.length).padStart(2, '0') }} categories</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Categorized</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(categorizedPosts).padStart(2, '0') }} articles</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Total</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(totalPosts).padStart(2, '0') }} total</dd>
          </dl>
        </aside>
      </div>
    </section>

    <!-- ============== 分类卡片网格 ============== -->
    <section class="pb-20" aria-label="分类列表">
      <div class="eyebrow flex items-center gap-3 mb-8">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>Index · 分类目录</span>
        <span class="mono-num ml-auto text-[11px]" style="color: var(--text-tertiary);">({{ categories.length }})</span>
      </div>

      <div v-if="categories.length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a v-for="(category, idx) in categories" :key="category.slug"
          :href="`/categories/${category.slug}`"
          class="cat-card group border"
          :style="{ borderColor: 'var(--ink-200)', background: 'var(--paper)', animationDelay: `${idx * 80}ms` }">
          <!-- 图标 + 名称 -->
          <div class="flex items-start gap-3 mb-4">
            <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
              style="border-color: var(--ink-200); background: var(--muted);">
              <Folder class="h-5 w-5" style="color: var(--text-primary);" aria-hidden="true" />
            </span>
            <div class="min-w-0 pt-0.5">
              <h2 class="text-[16px] font-semibold leading-[1.35] truncate" style="color: var(--text-primary);">
                {{ category.name }}
              </h2>
              <p class="mono-num mt-0.5 text-[11px] truncate" style="color: var(--text-tertiary);">
                /categories/{{ category.slug }}
              </p>
            </div>
          </div>

          <!-- 底部：计数 + CTA -->
          <div class="flex items-center justify-between border-t pt-3 mt-auto" style="border-color: var(--ink-200);">
            <span class="inline-flex items-center gap-1.5 text-[11px]" style="color: var(--text-tertiary);">
              <FileText class="h-3 w-3" aria-hidden="true" />
              <span class="mono-num">{{ category.count }} 篇</span>
            </span>
            <span class="cat-open inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.14em]">
              Open
              <ArrowUpRight class="h-3 w-3" aria-hidden="true" />
            </span>
          </div>
        </a>
      </div>

      <div v-else class="flex flex-col items-center justify-center border border-dashed py-20"
        style="border-color: var(--ink-200); background: var(--muted);">
        <Folder class="mb-4 h-10 w-10" style="color: var(--text-tertiary);" aria-hidden="true" />
        <h2 class="serif-title text-[1.5rem]" style="color: var(--text-primary);">暂无分类</h2>
        <p class="mt-3 text-[14px]" style="color: var(--text-secondary);">
          请在文章的 frontmatter 中添加 category 字段以生成分类。
        </p>
      </div>
    </section>
  </article>
</template>

<style scoped>
.cat-card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  color: inherit;
  text-decoration: none;
  transition: transform 0.3s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  animation: card-rise 0.5s ease both;
}

.cat-card:hover {
  transform: translateY(-3px);
  border-color: var(--accent)/30;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.cat-open {
  color: var(--text-tertiary);
  transition: color 0.2s ease, gap 0.2s ease;
}

.cat-card:hover .cat-open {
  color: var(--accent);
  gap: 0.375rem;
}

@keyframes card-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cat-card {
    animation: none;
  }
}
</style>
