import type { TagInfo } from '../types/blog'
import { getAllTags } from '../utils/posts'

export default {
  load(): TagInfo[] {
    return getAllTags()
  }
}
