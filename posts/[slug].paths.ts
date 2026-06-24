import { getAllPosts } from '../.vitepress/theme/utils/posts'

function escapeFrontmatter(value: string): string {
  return JSON.stringify(value)
}

export default {
  paths() {
    return getAllPosts().map((post) => ({
      params: { slug: post.slug },
      content: `---\ntitle: ${escapeFrontmatter(post.title)}\ndescription: ${escapeFrontmatter(post.description)}\n---\n\n<PostPage slug="${post.slug}" />\n`
    }))
  }
}
