import type { CategoryInfo } from '../types/blog'
import { getAllCategories } from '../utils/posts'

export default {
  load(): CategoryInfo[] {
    return getAllCategories()
  }
}
