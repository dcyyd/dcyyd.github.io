const unsafeChars = /[^\p{L}\p{N}]+/gu
const duplicateDash = /-{2,}/g

export function slugify(value: string): string {
  const normalized = value
    .trim()
    .normalize('NFKD')
    .replace(unsafeChars, '-')
    .replace(duplicateDash, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  return normalized.length > 0 ? normalized : 'post'
}

export function filenameToSlug(filename: string): string {
  return slugify(filename.replace(/\.md$/u, ''))
}

export function tagToSlug(tag: string): string {
  return slugify(tag)
}

export function decodeTagSlug(tagSlug: string): string {
  return tagSlug
}
