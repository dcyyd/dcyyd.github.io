import { getAllTags } from '../.vitepress/theme/utils/posts'

function escapeFrontmatter(value: string): string {
  return JSON.stringify(value)
}

export default {
  paths() {
    return getAllTags().map((tag) => ({
      params: { tag: tag.slug },
      content: `---\ntitle: ${escapeFrontmatter(`标签：${tag.name}`)}\ndescription: ${escapeFrontmatter(`标签 ${tag.name} 下的文章列表，共 ${tag.count} 篇。`)}\n---\n\n<TagPage tag="${tag.slug}" />\n`
    }))
  }
}
