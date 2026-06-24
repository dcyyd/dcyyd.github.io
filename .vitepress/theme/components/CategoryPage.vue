<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, FileSearch, Folder, FileText, Clock } from 'lucide-vue-next'
import { data as postsData } from '../data/posts.data'
import { data as categoriesData } from '../data/categories.data'
import type { CategoryInfo, PostDetail, PostMeta } from '../types/blog'
import { toPostMeta } from '../utils/postMeta'
import ArticleCard from './ArticleCard.vue'

const props = defineProps<{
  category: string
}>()

const posts = postsData as PostDetail[]
const categories = categoriesData as CategoryInfo[]

const categoryInfo = computed(() => categories.find((item) => item.slug === props.category))
const filteredPosts = computed<PostMeta[]>(() => {
  if (!categoryInfo.value) return []
  return posts
    .filter((post) => post.category === categoryInfo.value?.name)
    .map(toPostMeta)
})

const totalReadingTime = computed(() =>
  filteredPosts.value.reduce((sum, p) => sum + (p.readingTime || 0), 0)
)
</script>

<template>
  <article class="mx-auto max-w-[1240px] px-8">
    <!-- 面包屑 -->
    <div class="pt-8 pb-4">
      <a href="/categories"
        class="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-200 hover:text-[var(--accent)]"
        style="color: var(--text-tertiary);">
        <ArrowLeft class="h-3 w-3" aria-hidden="true" />
        返回分类
      </a>
    </div>

    <!-- ============== HERO · 期刊式头部 ============== -->
    <section class="animate-fade-up pb-16 sm:pb-20">
      <div class="eyebrow flex items-center gap-3 mb-10">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>Category</span>
      </div>

      <div class="grid gap-12 lg:grid-cols-[1.7fr_1fr] lg:items-end">
        <div>
          <!-- 图标 + 标题 -->
          <div class="flex items-start gap-4">
            <span class="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border"
              style="border-color: var(--ink-200); background: var(--muted);">
              <Folder class="h-7 w-7" style="color: var(--accent);" aria-hidden="true" />
            </span>
            <div>
              <h1 class="serif-title text-balance text-[2rem]"
                style="color: var(--text-primary);">
                {{ categoryInfo?.name ?? category }}
              </h1>
              <p class="mono-num mt-1 text-[13px]" style="color: var(--text-tertiary);">
                /categories/{{ categoryInfo?.slug ?? category }}
              </p>
            </div>
          </div>
        </div>

        <!-- 期刊式元数据侧栏 -->
        <aside class="space-y-4 pt-6 lg:max-w-[280px]">
          <dl class="grid grid-cols-[80px_1fr] gap-x-4 gap-y-3">
            <dt class="eyebrow self-center" style="font-size: 10px;">Articles</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(filteredPosts.length).padStart(2, '0') }} dispatches</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Reading</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(totalReadingTime).padStart(2, '0') }} min</dd>
          </dl>
        </aside>
      </div>
    </section>

    <!-- ============== 文章列表 ============== -->
    <section class="pb-20" aria-label="分类文章列表">
      <div v-if="filteredPosts.length > 0"
        class="grid gap-x-10 gap-y-8 md:grid-cols-2 animate-fade-up">
        <ArticleCard v-for="(post, idx) in filteredPosts" :key="post.slug"
          :post="post" :index="idx + 1" />
      </div>

      <div v-else
        class="flex flex-col items-center justify-center border border-dashed py-20"
        style="border-color: var(--ink-200); background: var(--muted);">
        <FileSearch class="mb-4 h-10 w-10" style="color: var(--text-tertiary);" aria-hidden="true" />
        <h2 class="serif-title text-[1.5rem]" style="color: var(--text-primary);">该分类暂无文章</h2>
        <p class="mt-3 text-[14px]" style="color: var(--text-secondary);">
          请确认分类 slug 与文章 frontmatter 中的 category 是否一致。
        </p>
      </div>
    </section>
  </article>
</template>
