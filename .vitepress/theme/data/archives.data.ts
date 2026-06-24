import type { YearArchive } from '../types/blog'
import { getYearArchives } from '../utils/posts'

export default {
  load(): YearArchive[] {
    return getYearArchives()
  }
}
