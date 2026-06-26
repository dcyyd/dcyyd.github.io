import { fileURLToPath, URL } from 'node:url'
import { readFileSync, existsSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { defineConfig } from 'vitepress'

// ============== 轻量 .env 加载器 ==============
// VitePress 不会自动加载 .env 文件，因此手动解析并注入到 process.env，
// 这样 vite.define 才能把 process.env.VITE_GISCUS_* 替换到客户端 bundle。
// 仅识别 KEY=VALUE 形式，跳过空行与 # 注释。
function loadEnvFile(envPath: string): void {
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf-8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i)
    if (!m) continue
    const key = m[1]
    let value = m[2].trim()
    // 去除包裹的引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}
loadEnvFile(resolvePath(fileURLToPath(new URL('../.env', import.meta.url))))

// GitHub Pages 部署路径：本地为 '/'，CI 中为环境变量 BASE
// 例：部署到 https://<user>.github.io/vitepress-file-blog/ 则 BASE='/vitepress-file-blog/'
const base = process.env.BASE || '/'

export default defineConfig({
  base,
  lang: 'zh-CN',
  title: 'FilePress Blog - 极致文件驱动技术博客 | VuePress/VitePress 静态博客搭建指南',
  description: '基于 VitePress 1.4 构建的纯文件驱动技术博客，零数据库、零 CMS，支持 GitHub Pages 免费部署、Markdown 写作、全文搜索、评论系统集成。提供 VuePress/VitePress 静态博客搭建教程、前端工程实践、AI 大模型应用等技术文章。',
  cleanUrls: true,
  srcExclude: ['content/**/*.md'],
  appearance: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  metaChunk: true,
  head: [
    ['meta', { name: 'theme-color', content: '#1a4d3a' }],
    ['meta', { name: 'color-scheme', content: 'light dark' }],
    ['link', { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' }],
    ['link', { rel: 'alternate', type: 'application/rss+xml', title: 'RSS Feed', href: `${base}feed.xml` }],
    ['link', { rel: 'sitemap', type: 'application/xml', href: `${base}sitemap.xml` }],
    ['meta', { name: 'keywords', content: 'VitePress, VuePress, 静态博客, GitHub Pages, Markdown, 文件驱动, 前端工程, AI大模型, 技术博客, 个人网站' }],
    ['meta', { property: 'article:author', content: 'dcyyd' }],
    ['meta', { property: 'article:publisher', content: 'https://dcyyd.github.io' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'FilePress Blog' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:site', content: '@dcyyd' }],
    ['script', { src: '//cdn.busuanzi.cc/busuanzi/3.6.9/busuanzi.abbr.min.js', async: '' }],
    ['meta', { name: 'twitter:creator', content: '@dcyyd' }],
  ],
  transformHead(context) {
    const siteTitle = 'FilePress Blog'
    const defaultTitle = 'FilePress Blog - 极致文件驱动技术博客 | VuePress/VitePress 静态博客搭建指南'
    const defaultDescription = '基于 VitePress 1.4 构建的纯文件驱动技术博客，零数据库、零 CMS，支持 GitHub Pages 免费部署、Markdown 写作、全文搜索、评论系统集成。提供 VuePress/VitePress 静态博客搭建教程、前端工程实践、AI 大模型应用等技术文章。'
    
    let title = context.title || defaultTitle
    if (title !== siteTitle && !title.includes(siteTitle)) {
      title = `${title} - ${siteTitle}`
    }
    
    const description = context.description || defaultDescription
    const url = `https://dcyyd.github.io/${context.page.replace(/^\//, '')}`
    const ogImage = `${base}og-image.png`
    
    const schemaOrg = {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      'name': siteTitle,
      'description': defaultDescription,
      'url': url,
      'publisher': {
        '@type': 'Organization',
        'name': siteTitle,
        'url': 'https://dcyyd.github.io'
      }
    }
    
    return [
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:image', content: ogImage }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { property: 'og:image:alt', content: title }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['meta', { name: 'twitter:image', content: ogImage }],
      ['meta', { name: 'twitter:image:alt', content: title }],
      ['script', { type: 'application/ld+json' }, JSON.stringify(schemaOrg)],
    ]
  },
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },
  vite: {
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true
    },
    preview: {
      port: 4173,
      host: '0.0.0.0',
      strictPort: true
    },
    define: {
      // 仅暴露 Giscus 相关环境变量到客户端
      ...(process.env.VITE_GISCUS_REPO      ? { 'import.meta.env.VITE_GISCUS_REPO': JSON.stringify(process.env.VITE_GISCUS_REPO) } : {}),
      ...(process.env.VITE_GISCUS_REPO_ID   ? { 'import.meta.env.VITE_GISCUS_REPO_ID': JSON.stringify(process.env.VITE_GISCUS_REPO_ID) } : {}),
      ...(process.env.VITE_GISCUS_CATEGORY  ? { 'import.meta.env.VITE_GISCUS_CATEGORY': JSON.stringify(process.env.VITE_GISCUS_CATEGORY) } : {}),
      ...(process.env.VITE_GISCUS_CATEGORY_ID ? { 'import.meta.env.VITE_GISCUS_CATEGORY_ID': JSON.stringify(process.env.VITE_GISCUS_CATEGORY_ID) } : {}),
      ...(process.env.VITE_GISCUS_LANG      ? { 'import.meta.env.VITE_GISCUS_LANG': JSON.stringify(process.env.VITE_GISCUS_LANG) } : {})
    },
    resolve: {
      alias: {
        '@theme': fileURLToPath(new URL('./theme', import.meta.url)),
        '@components': fileURLToPath(new URL('./theme/components', import.meta.url)),
        '@utils': fileURLToPath(new URL('./theme/utils', import.meta.url)),
        '@types': fileURLToPath(new URL('./theme/types', import.meta.url))
      }
    },
    build: {
      cssMinify: true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id: string): string | undefined {
            if (id.includes('node_modules/katex')) return 'math'
            if (id.includes('node_modules/lucide-vue-next')) return 'icons'
            return undefined
          }
        }
      }
    }
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/blog' },
      { text: '分类', link: '/categories' },
      { text: '归档', link: '/archives' },
      { text: '更新日志', link: '/changelog' },
      { text: '友链', link: '/friends' },
      { text: '关于', link: '/about' }
    ],
    outline: {
      level: [2, 3],
      label: '文章目录'
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/' }]
  }
})
