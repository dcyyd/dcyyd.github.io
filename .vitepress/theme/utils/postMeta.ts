import type { PostDetail, PostMeta } from '../types/blog'

export function toPostMeta(post: PostDetail): PostMeta {
  const { markdown: _markdown, content: _content, ...meta } = post
  return meta
}
