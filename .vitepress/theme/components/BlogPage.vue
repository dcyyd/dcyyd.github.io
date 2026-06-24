<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, X, Layers, FileSearch } from 'lucide-vue-next'
import { data as postsData } from '../data/posts.data'
import { data as tagsData } from '../data/tags.data'
import type { PostDetail, PostMeta, TagInfo } from '../types/blog'
import { toPostMeta } from '../utils/postMeta'
import ArticleCard from './ArticleCard.vue'
import TagFilter from './TagFilter.vue'

const posts = postsData as PostDetail[]
const tags = tagsData as TagInfo[]

const postMetas = computed<PostMeta[]>(() => posts.map(toPostMeta))

const selectedTags = ref<string[]>([])
const query = ref('')

function updateSelectedTags(value: string[]): void {
  selectedTags.value = value
}

const filtered = computed<PostMeta[]>(() => {
  let result = postMetas.value
  if (selectedTags.value.length > 0) {
    result = result.filter((post) =>
      selectedTags.value.every((tag) => post.tags.includes(tag))
    )
  }
  const q = query.value.trim().toLowerCase()
  if (q.length > 0) {
    result = result.filter(
      (post) =>
        post.title.toLowerCase().includes(q) ||
        (post.description || '').toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
    )
  }
  return result
})

const totalCount = computed(() => postMetas.value.length)

function clearFilters() {
  selectedTags.value = []
  query.value = ''
}
</script>

<template>
  <article class="mx-auto max-w-[1240px] px-8">
    <!-- ============== HERO · 期刊式头部 ============== -->
    <section class="animate-fade-up pt-12 pb-12 sm:pt-14 sm:pb-20">
      <div class="eyebrow flex items-center gap-3">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>Index · 全部文章</span>
      </div>

      <div class="mt-10 grid gap-16 lg:grid-cols-[1.7fr_1fr] lg:items-end">
        <div>
          <h1 class="serif-title text-balance text-[2.75rem] leading-[1.04] sm:text-[3.75rem] lg:text-[5.25rem]"
            style="color: var(--text-primary);">
            <span class="italic-serif">Blog</span>
          </h1>
          <p class="mt-8 max-w-[560px] text-[17px] leading-[1.7]" style="color: var(--text-secondary);">
            共 <b class="font-medium text-[var(--text-primary)]">{{ totalCount }}</b> 篇文章。
            支持标题、描述、标签的全文搜索与多标签组合筛选。
          </p>
        </div>

        <aside class="space-y-4 pt-6 lg:max-w-[280px]">
          <dl class="grid grid-cols-[80px_1fr] gap-x-4 gap-y-3">
            <dt class="eyebrow self-center" style="font-size: 10px;">Total</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(totalCount).padStart(2, '0') }} articles</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Tags</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(tags.length).padStart(2, '0') }} subjects</dd>
          </dl>
        </aside>
      </div>
    </section>

    <!-- ============== 搜索 + 筛选 ============== -->
    <section class="pb-8">
      <div class="grid gap-6 lg:grid-cols-[260px_1fr]">
        <!-- 搜索框 -->
        <div>
          <label class="eyebrow mb-3 block" style="font-size: 10px;" for="article-search">Search</label>
          <label class="flex items-center gap-2 border px-3 py-2 transition-colors focus-within:border-[var(--accent)]/40"
            style="border-color: var(--ink-200); background: var(--paper);">
            <Search class="h-3.5 w-3.5 shrink-0" style="color: var(--text-tertiary);" aria-hidden="true" />
            <input id="article-search" v-model="query" type="search" placeholder="搜索标题、描述、标签..."
              class="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[var(--text-tertiary)]"
              style="color: var(--text-primary);" />
            <button v-if="query" type="button"
              class="rounded p-0.5 transition-colors hover:text-[var(--accent)]"
              style="color: var(--text-tertiary);" aria-label="清空搜索" @click="query = ''">
              <X class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </label>
        </div>

        <!-- 标签筛选 -->
        <div>
          <TagFilter :tags="tags" :selected="selectedTags" @change="updateSelectedTags" @clear="selectedTags = []" />
        </div>
      </div>
    </section>

    <!-- ============== 文章列表 ============== -->
    <section class="pb-20" aria-label="文章列表">
      <div v-if="filtered.length > 0"
        class="grid gap-x-10 gap-y-8 md:grid-cols-2 animate-fade-up">
        <ArticleCard v-for="(post, idx) in filtered" :key="post.slug"
          :post="post" :index="idx + 1" />
      </div>

      <div v-else
        class="flex flex-col items-center justify-center border border-dashed py-20"
        style="border-color: var(--ink-200); background: var(--muted);">
        <FileSearch class="mb-4 h-10 w-10" style="color: var(--text-tertiary);" aria-hidden="true" />
        <h2 class="serif-title text-[1.5rem]" style="color: var(--text-primary);">没有匹配文章</h2>
        <p class="mt-3 text-[14px]" style="color: var(--text-secondary);">
          请清空筛选条件或选择其它标签组合。
        </p>
        <button type="button"
          class="mt-6 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors hover:text-[var(--accent)]"
          style="color: var(--text-tertiary);" @click="clearFilters">
          <X class="h-3.5 w-3.5" aria-hidden="true" />
          Reset filters
        </button>
      </div>
    </section>
  </article>
</template>
