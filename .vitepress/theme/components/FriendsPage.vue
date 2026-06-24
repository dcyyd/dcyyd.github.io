<script setup lang="ts">
import { computed } from 'vue'
import { ExternalLink, Globe, Users, Mail, ArrowUpRight } from 'lucide-vue-next'

interface Friend {
  name: string
  host: string
  url: string
  avatar: string
  description: string
  meta: string
}

const friends: Friend[] = [
  {
    name: '个人主页 | DouCY',
    host: 'dcyyd.github.io',
    url: 'https://dcyyd.github.io',
    avatar: 'https://dcyyd.github.io/favicon.ico',
    description: 'ChangYou.Dou.的个人主页，展示专业技能和项目经验。',
    meta: '2025年4月16日'
  },
  {
    name: 'D.C.Y. Personal Hub',
    host: 'peakcloud.ink',
    url: 'https://peakcloud.ink',
    avatar: 'https://peakcloud.ink/favicon.ico',
    description: 'Professional cyber personal homepage built with Vue3, Vite, Naive UI, Pinia and vue-i18n. 用代码书写视觉语言。',
    meta: '2026年4月26日'
  }
]

const hasFriends = computed(() => friends.length > 0)
</script>

<template>
  <article class="mx-auto max-w-[1240px] px-8">
    <!-- ============== HERO · 期刊式头部 ============== -->
    <section class="animate-fade-up pt-12 pb-12 sm:pt-14 sm:pb-20">
      <div class="eyebrow flex items-center gap-3">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>Friends · 友情链接</span>
      </div>

      <div class="mt-10 grid gap-16 lg:grid-cols-[1.7fr_1fr] lg:items-end">
        <div>
          <h1 class="serif-title text-balance text-[2.75rem] leading-[1.04] sm:text-[3.75rem] lg:text-[5.25rem]"
            style="color: var(--text-primary);">
            <span class="italic-serif">Friends</span>
          </h1>

          <p class="mt-8 max-w-[560px] text-[17px] leading-[1.7]" style="color: var(--text-secondary);">
            精选常逛的个人技术站点与工具，欢迎
            <b class="font-medium text-[var(--text-primary)]">同好站点互换友链</b>。
            站点主题匹配前端工程、Markdown 工具链、VitePress 静态博客即可。
          </p>
        </div>

        <!-- 期刊式元数据侧栏 -->
        <aside class="space-y-4 pt-6 lg:max-w-[280px]">
          <dl class="grid grid-cols-[80px_1fr] gap-x-4 gap-y-3">
            <dt class="eyebrow self-center" style="font-size: 10px;">Links</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">{{ String(friends.length).padStart(2, '0') }} sites</dd>
            <dt class="eyebrow self-center" style="font-size: 10px;">Status</dt>
            <dd class="mono-num text-[13px]" style="color: var(--text-primary);">
              <span class="inline-flex items-center gap-1.5">
                <span class="inline-block h-2 w-2 rounded-full" style="background: var(--accent);" />
                Open
              </span>
            </dd>
          </dl>
        </aside>
      </div>
    </section>

    <!-- ============== 友链卡片列表 ============== -->
    <section class="pb-20" aria-label="友情链接列表">
      <div class="eyebrow flex items-center gap-3 mb-8">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>Index · 友链目录</span>
        <span class="mono-num ml-auto text-[11px]" style="color: var(--text-tertiary);">({{ friends.length }})</span>
      </div>

      <!-- 友链存在时 -->
      <ul v-if="hasFriends" class="grid gap-4 sm:grid-cols-2">
        <li v-for="(friend, idx) in friends" :key="friend.host"
          class="friend-card group border"
          :style="{ borderColor: 'var(--ink-200)', background: 'var(--paper)', animationDelay: `${idx * 80}ms` }">
          <a :href="friend.url" target="_blank" rel="noopener noreferrer"
            class="flex h-full flex-col gap-5 p-6"
            style="color: inherit;">
            <!-- 顶部：编号 + 域名 + 状态点 -->
            <div class="flex items-center justify-between gap-3">
              <span class="mono-num text-[10.5px] font-medium tracking-[0.16em]" style="color: var(--text-tertiary);">
                № {{ String(idx + 1).padStart(2, '0') }}
              </span>
              <div class="flex items-center gap-2 min-w-0">
                <span class="host-tag inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-medium rounded-sm truncate max-w-[140px] sm:max-w-[180px]"
                  style="border-color: var(--ink-200); color: var(--text-secondary);">
                  <Globe class="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                  {{ friend.host }}
                </span>
                <span class="status-dot inline-block h-1.5 w-1.5 rounded-full shrink-0" style="background: var(--accent);" title="在线" />
              </div>
            </div>

            <!-- 头像 + 站点名称 -->
            <div class="flex items-start gap-4">
              <span class="avatar-box inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2"
                style="border-color: var(--ink-200); background: var(--muted);">
                <img :src="friend.avatar" :alt="`${friend.name} 图标`"
                  class="h-8 w-8 object-contain"
                  loading="lazy" decoding="async"
                  @error="($event.target as HTMLImageElement).style.display = 'none'" />
              </span>
              <div class="min-w-0 pt-0.5">
                <h2 class="text-[16px] font-semibold leading-[1.35] truncate" style="color: var(--text-primary);">
                  {{ friend.name }}
                </h2>
              </div>
            </div>

            <!-- 站点简介 -->
            <p class="line-clamp-3 flex-1 text-[13.5px] leading-[1.7]" style="color: var(--text-secondary);">
              {{ friend.description }}
            </p>

            <!-- 底部分割线：收录时间 + 访问按钮 -->
            <div class="flex items-center justify-between border-t pt-3 text-[11.5px]"
              style="border-color: var(--ink-200);">
              <time :datetime="friend.meta" class="font-medium" style="color: var(--text-tertiary);">
                {{ friend.meta }}
              </time>
              <span class="visit-btn inline-flex items-center gap-1.5 font-medium uppercase tracking-[0.14em] text-[11px]">
                Visit
                <ExternalLink class="h-3 w-3" aria-hidden="true" />
              </span>
            </div>
          </a>
        </li>
      </ul>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center border border-dashed py-20"
        style="border-color: var(--ink-200); background: var(--muted);">
        <Users class="mb-4 h-10 w-10" style="color: var(--text-tertiary);" aria-hidden="true" />
        <p class="text-[14px]" style="color: var(--text-tertiary);">暂无友链，期待第一位伙伴</p>
      </div>
    </section>

    <!-- ============== 申请友链 ============== -->
    <section class="pb-20">
      <div class="eyebrow flex items-center gap-3 mb-8">
        <span class="inline-block h-px w-6 shrink-0" style="background: var(--accent);" />
        <span>Apply · 申请友链</span>
      </div>

      <div class="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
        <div>
          <h2 class="serif-title text-balance text-[1.75rem] leading-[1.15] sm:text-[2rem]"
            style="color: var(--text-primary);">
            <span class="italic-serif">Want to be</span> on the list?
          </h2>
          <p class="mt-4 text-[14.5px] leading-[1.8] max-w-[420px]" style="color: var(--text-secondary);">
            请邮件附上站点名称、简介与首页地址，收到后将尽快收录。
          </p>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3 border p-4"
            style="border-color: var(--ink-200); background: var(--muted);">
            <Mail class="h-5 w-5 shrink-0" style="color: var(--accent);" aria-hidden="true" />
            <a href="mailto:dcyyd_kcug@yeah.net"
              class="mono-num text-[13.5px] truncate hover:underline underline-offset-4 transition-colors"
              style="color: var(--text-primary);">
              dcyyd_kcug@yeah.net
            </a>
            <ArrowUpRight class="h-3.5 w-3.5 shrink-0 ml-auto" style="color: var(--text-tertiary);" aria-hidden="true" />
          </div>
          <p class="text-[12px] leading-[1.6]" style="color: var(--text-tertiary);">
            主题需与前端工程、Markdown 工具链或 VitePress 静态博客相关。
          </p>
        </div>
      </div>
    </section>
  </article>
</template>

<style scoped>
.friend-card {
  transition: transform 0.3s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  animation: card-rise 0.5s ease both;
}

.friend-card:hover {
  transform: translateY(-3px);
  border-color: var(--accent)/30;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.host-tag {
  transition: border-color 0.2s ease, color 0.2s ease;
}

.friend-card:hover .host-tag {
  border-color: var(--ink-400);
  color: var(--text-primary);
}

.visit-btn {
  color: var(--text-tertiary);
  transition: color 0.2s ease, gap 0.2s ease;
}

.friend-card:hover .visit-btn {
  color: var(--accent);
  gap: 0.5rem;
}

.avatar-box {
  transition: border-color 0.25s ease, transform 0.25s ease;
}

.friend-card:hover .avatar-box {
  border-color: var(--accent)/40;
  transform: scale(1.04);
}

.status-dot {
  transition: opacity 0.25s ease;
}

@keyframes card-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .friend-card {
    animation: none;
  }
}
</style>