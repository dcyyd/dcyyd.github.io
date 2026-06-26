<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, Home } from 'lucide-vue-next'
import { useRoute } from 'vitepress'

interface BreadcrumbItem {
  label: string
  href: string
}

const route = useRoute()

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const path = route.path.replace(/\.html$/u, '')
  const parts = path.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []

  if (path === '' || path === '/') {
    return [{ label: '首页', href: '/' }]
  }

  items.push({ label: '首页', href: '/' })

  const routeMap: Record<string, string> = {
    'blog': '博客',
    'categories': '分类',
    'tags': '标签',
    'archives': '归档',
    'about': '关于',
    'friends': '友链',
    'changelog': '更新日志',
    'posts': '文章'
  }

  let currentPath = ''
  parts.forEach((part, index) => {
    currentPath += `/${part}`
    const isLast = index === parts.length - 1
    
    let label = routeMap[part] || part
    
    if (isLast && parts.length >= 2 && parts[0] === 'posts') {
      try {
        const decoded = decodeURIComponent(part)
        label = decoded
      } catch {
        label = part
      }
    } else if (isLast && parts[0] === 'tags') {
      try {
        const decoded = decodeURIComponent(part)
        label = decoded
      } catch {
        label = part
      }
    } else if (isLast && parts[0] === 'categories') {
      try {
        const decoded = decodeURIComponent(part)
        label = decoded
      } catch {
        label = part
      }
    }

    items.push({ label, href: currentPath })
  })

  return items
})
</script>

<template>
  <nav class="breadcrumbs" aria-label="面包屑导航">
    <ol class="breadcrumbs-list flex items-center gap-1">
      <li v-for="(item, index) in breadcrumbs" :key="item.href" class="breadcrumbs-item">
        <template v-if="index === 0">
          <a :href="item.href" class="breadcrumbs-link" :aria-label="'返回首页'">
            <Home class="h-3 w-3" aria-hidden="true" />
            <span class="sr-only">{{ item.label }}</span>
          </a>
        </template>
        <template v-else-if="index === breadcrumbs.length - 1">
          <span class="breadcrumbs-current" aria-current="page">{{ item.label }}</span>
        </template>
        <template v-else>
          <a :href="item.href" class="breadcrumbs-link">{{ item.label }}</a>
        </template>
        <ChevronRight 
          v-if="index < breadcrumbs.length - 1" 
          class="breadcrumbs-separator h-3 w-3" 
          aria-hidden="true" 
        />
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumbs {
  padding: 0.5rem 0;
}

.breadcrumbs-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.breadcrumbs-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.breadcrumbs-link {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumbs-link:hover {
  color: var(--accent);
}

.breadcrumbs-current {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.breadcrumbs-separator {
  color: var(--text-tertiary);
  flex-shrink: 0;
}
</style>