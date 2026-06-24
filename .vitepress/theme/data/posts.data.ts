import type { PostDetail } from '../types/blog'
import { getAllPosts } from '../utils/posts'

export default {
  load(): PostDetail[] {
    return getAllPosts()
  }
}
