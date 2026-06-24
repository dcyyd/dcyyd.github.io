<script setup lang="ts">
import { Content, useData } from 'vitepress'
import HeaderNav from './HeaderNav.vue'
import SiteFooter from './SiteFooter.vue'
import NotFoundPage from './NotFoundPage.vue'

// 路由感知：内容页 / 文章页使用紧凑宽度
// Hero 页（首页 / blog）允许更宽
import { useRoute } from 'vitepress'
import { computed } from 'vue'

const route = useRoute()
const { page } = useData()

// 是否为 404 页面（VitePress 内部标记）
const isNotFound = computed(() => page.value.isNotFound === true)

const isWidePage = computed(() => {
  const p = route.path.replace(/\.html$/u, '')
  return p === '/' || p === '/index' || p === '/blog' || p === '/blog/' ||
         p === '/categories' || p === '/categories/' ||
         p === '/archives' || p === '/archives/' ||
         p === '/changelog' || p === '/changelog/' ||
         p === '/friends' || p === '/friends/' ||
         p === '/about' || p === '/about/'
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <HeaderNav />
    <main
      class="mx-auto w-full flex-1 px-4 py-8 sm:px-6 lg:px-8"
      :class="isWidePage ? 'max-w-[100rem]' : 'max-w-6xl'"
    >
      <!--
        关键：当 page.isNotFound === true 时（SPA 检测到 404），
        渲染自定义 NotFoundPage 组件，而不是默认的"Not Found"占位。
        404.md 仅为静态 404.html 服务，运行时 SPA 走这里。
      -->
      <NotFoundPage v-if="isNotFound" />
      <Content v-else />
    </main>
    <SiteFooter />
  </div>
</template>
