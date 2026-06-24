export interface PostFrontmatter {
  title?: string | undefined
  description?: string | undefined
  date?: string | undefined
  tags?: string[] | undefined
  category?: string | undefined
  draft?: boolean | undefined
  cover?: string | undefined
}

export interface PostLink {
  title: string
  slug: string
  url: string
  date: string
}

export interface TagInfo {
  name: string
  slug: string
  count: number
}

export interface CategoryInfo {
  name: string
  slug: string
  count: number
}

export interface YearArchive {
  year: number
  count: number
  posts: PostMeta[]
}

export interface PostMeta {
  title: string
  description: string
  date: string
  isoDate: string
  slug: string
  url: string
  tags: string[]
  category: string
  readingTime: number
  wordCount: number
  excerpt: string
  hasFrontmatter: boolean
  cover?: string | undefined
  previous?: PostLink | undefined
  next?: PostLink | undefined
}

export type SafePropertyValue = string | number | boolean

export interface SafeElementNode {
  type: 'element'
  tagName: string
  properties: Record<string, SafePropertyValue>
  children: SafeNode[]
}

export interface SafeTextNode {
  type: 'text'
  value: string
}

export interface SafeRootNode {
  type: 'root'
  children: SafeNode[]
}

export type SafeNode = SafeElementNode | SafeTextNode | SafeRootNode

export interface PostDetail extends PostMeta {
  markdown: string
  content: SafeRootNode
}
