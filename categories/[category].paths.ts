import { getAllCategories } from '../.vitepress/theme/utils/posts'

function escapeFrontmatter(value: string): string {
  return JSON.stringify(value)
}

export default {
  paths() {
    return getAllCategories().map((category) => ({
      params: { category: category.slug },
      content: `---\ntitle: ${escapeFrontmatter(`分类：${category.name}`)}\ndescription: ${escapeFrontmatter(`分类 ${category.name} 下的文章列表，共 ${category.count} 篇。`)}\n---\n\n<CategoryPage category="${category.slug}" />\n`
    }))
  }
}
