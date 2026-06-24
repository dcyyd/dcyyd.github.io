<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    src: string
    alt: string
    width: number
    height: number
    priority?: boolean
    placeholder?: string
  }>(),
  {
    priority: false,
    placeholder: ''
  }
)

const webpSrc = computed(() => {
  if (/\.svg$/u.test(props.src)) return ''
  return props.src.replace(/\.(png|jpe?g)$/iu, '.webp')
})
</script>

<template>
  <picture class="block overflow-hidden rounded-2xl" :style="placeholder ? { backgroundImage: `url(${placeholder})`, backgroundSize: 'cover' } : undefined">
    <source v-if="webpSrc" :srcset="webpSrc" type="image/webp" />
    <img
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="priority ? 'eager' : 'lazy'"
      decoding="async"
      class="h-auto w-full object-cover"
    />
  </picture>
</template>
