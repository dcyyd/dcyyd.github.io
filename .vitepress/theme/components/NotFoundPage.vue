<script setup lang="ts">
import { useRoute, useRouter } from 'vitepress'
import { computed } from 'vue'
import {
  FileQuestion, Home, ArrowLeft, Search, Mail, Rss, Compass
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

/** 用户访问的路径，方便定位 404 来源 */
const requestPath = computed(() => route.path || '/')

function goBack() {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    window.history.back()
  } else {
    router.go('/')
  }
}
</script>

<template>
  <article class="notfound-page">
    <!-- ============== HERO ============== -->
    <section class="hero">
      <div class="eyebrow">
        <span class="eyebrow-line" />
        <span>Error 404 · Not Found</span>
      </div>

          <h1 class="serif-title text-balance text-[3rem] leading-[1.04] sm:text-[4rem] md:text-[4.5rem] lg:text-[5rem]"
            style="color: var(--text-primary); font-size: 8rem; font-weight: 700; line-height: 1.04; margin-bottom: 2rem;">
            <span class="italic-serif">404</span>
          </h1>

      <p class="lead">
        你访问的页面 <code class="path-hint">{{ requestPath }}</code> 不存在或已被移动。
      </p>

      <p class="sub">
        可能是因为链接拼写错误、文章已删除，或者我们刚刚完成了重构。
        你可以通过下方入口继续浏览站点。
      </p>

      <div class="actions">
        <button class="btn btn-primary" @click="goBack">
          <ArrowLeft class="btn-icon" :size="16" aria-hidden="true" />
          返回上一页
        </button>
        <a class="btn btn-ghost" href="/">
          <Home class="btn-icon" :size="16" aria-hidden="true" />
          回到首页
        </a>
      </div>
    </section>

    <!-- ============== 反馈信息 ============== -->
    <section class="help">
      <div class="help-card">
        <p class="help-title">确认这是一个 BUG？</p>
        <p class="help-desc">
          如果你认为这个 404 是站点问题（链接错误、SEO 不一致等），欢迎通过下方渠道反馈。
        </p>
        <div class="help-links">
          <a class="help-link" href="mailto:dcyyd_kcug@yeah.net">
            <Mail :size="14" aria-hidden="true" />
            dcyyd_kcug@yeah.net
          </a>
          <a class="help-link" href="/feed.xml">
            <Rss :size="14" aria-hidden="true" />
            RSS
          </a>
        </div>
      </div>
    </section>
  </article>
</template>

<style scoped>
/* ============== 容器 ============== */
.notfound-page {
  max-width: 880px;
  margin: 0 auto;
  padding: 4rem 1.5rem 6rem;
  color: var(--text-primary, #1f2937);
}

/* ============== 顶部小标识 ============== */
.eyebrow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-tertiary, #6b7280);
  margin-bottom: 1.5rem;
}

.eyebrow-line {
  display: inline-block;
  width: 1.5rem;
  height: 1px;
  background: var(--accent, #10b981);
}

/* ============== 巨大 404 数字 ============== */
.bigcode {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.25rem;
  font-family: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
  font-size: clamp(6rem, 18vw, 11rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  margin: 0 0 1.5rem;
  user-select: none;
}

.code-digit {
  background: linear-gradient(135deg, var(--accent, #10b981) 0%, #14b8a6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 4px 16px rgba(16, 185, 129, 0.15));
}

.code-zero {
  transform: rotate(-8deg);
  display: inline-block;
}

/* ============== 文案 ============== */
.lead {
  font-size: 1.05rem;
  line-height: 1.7;
  margin: 0 0 0.75rem;
  color: var(--text-primary, #1f2937);
}

.sub {
  font-size: 0.95rem;
  line-height: 1.7;
  margin: 0 0 2.5rem;
  color: var(--text-secondary, #4b5563);
  max-width: 60ch;
}

.path-hint {
  font-family: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.92em;
  padding: 0.15em 0.5em;
  border: 1px solid var(--ink-200, #e5e7eb);
  background: var(--muted, #f3f4f6);
  border-radius: 4px;
  color: var(--accent, #10b981);
  word-break: break-all;
}

/* ============== 行动按钮 ============== */
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 4rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  font-size: 0.92rem;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;
  font-family: inherit;
}

.btn-primary {
  background: var(--accent, #10b981);
  color: #fff;
  box-shadow: 0 1px 2px rgba(16, 185, 129, 0.2);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.25);
}

.btn-ghost {
  background: transparent;
  color: var(--text-primary, #1f2937);
  border-color: var(--ink-200, #e5e7eb);
}

.btn-ghost:hover {
  background: var(--muted, #f3f4f6);
  transform: translateY(-1px);
}

.btn-icon {
  flex-shrink: 0;
}

/* ============== 建议入口网格 ============== */
.suggestions {
  margin-bottom: 3.5rem;
}

.suggestion-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.suggestion-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--ink-200, #e5e7eb);
  border-radius: 8px;
  background: var(--paper, #ffffff);
  color: var(--text-primary, #1f2937);
  text-decoration: none;
  font-size: 0.92rem;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.suggestion-card:hover {
  border-color: var(--accent, #10b981);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.08);
}

.suggestion-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(16, 185, 129, 0.08);
  color: var(--accent, #10b981);
  flex-shrink: 0;
}

.suggestion-label {
  flex: 1;
  font-weight: 500;
}

.suggestion-arrow {
  color: var(--text-tertiary, #6b7280);
  transition: transform 0.2s ease, color 0.2s ease;
}

.suggestion-card:hover .suggestion-arrow {
  color: var(--accent, #10b981);
  transform: translateX(3px);
}

/* ============== 反馈卡片 ============== */
.help-card {
  padding: 1.5rem;
  border: 1px dashed var(--ink-200, #e5e7eb);
  border-radius: 10px;
  background: var(--muted, #fafafa);
}

.help-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.4rem;
  color: var(--text-primary, #1f2937);
}

.help-desc {
  font-size: 0.88rem;
  line-height: 1.65;
  margin: 0 0 0.9rem;
  color: var(--text-secondary, #4b5563);
}

.help-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.help-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  border-radius: 999px;
  background: var(--paper, #ffffff);
  border: 1px solid var(--ink-200, #e5e7eb);
  color: var(--text-secondary, #4b5563);
  text-decoration: none;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.help-link:hover {
  color: var(--accent, #10b981);
  border-color: var(--accent, #10b981);
}

/* ============== 深色模式 ============== */
@media (prefers-color-scheme: dark) {
  .notfound-page {
    color: #e5e7eb;
  }
}

/* ============== 移动端适配 ============== */
@media (max-width: 640px) {
  .notfound-page {
    padding: 2.5rem 1rem 4rem;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    justify-content: center;
  }

  .bigcode {
    font-size: 5rem;
  }
}

/* ============== 入场动画 ============== */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero {
  animation: fadeUp 0.5s ease both;
}

.suggestions {
  animation: fadeUp 0.6s ease both;
  animation-delay: 0.1s;
}

.help {
  animation: fadeUp 0.7s ease both;
  animation-delay: 0.2s;
}

@media (prefers-reduced-motion: reduce) {

  .hero,
  .suggestions,
  .help {
    animation: none;
  }

  .btn,
  .suggestion-card {
    transition: none;
  }
}
</style>
