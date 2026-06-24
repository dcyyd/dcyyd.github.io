<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const steps = [
  { n: '01', t: '打开工作台', d: '从左侧菜单进入「工作台」查看博客整体状态。' },
  { n: '02', t: '新建或编辑文章', d: '点击「编辑器」或「+ 新建」。填写标题、日期、标签，左侧写 Markdown，右侧实时预览。' },
  { n: '03', t: '保存到本地', d: '点击「保存」/「创建」按钮，文章立即写入 content/posts/，可随时在「文件管理」查看。' },
  { n: '04', t: '一键部署', d: '进入「一键部署」页面，点击「启动一键部署」即可推送至 gh-pages。' }
]

const faqs = [
  { q: '为什么要用 GUI 而不直接用终端？', a: 'CLI 适合批量与自动化，GUI 适合日常写作与小修改。本工具对每条命令都有 confirm 与可视化反馈，减少误操作。' },
  { q: 'GUI 操作会污染 content/posts/ 吗？', a: '不会。所有写入都使用 gray-matter 序列化，与 `pnpm post n/u` 完全等价。可随时 `git diff` 查看。' },
  { q: '部署失败如何排查？', a: '打开「一键部署」页面查看实时日志，常见原因：git 未配置 remote、gh-pages 权限不足、网络问题。' },
  { q: '本地预览端口被占用？', a: '修改 .vitepress/config.mts 的 vite.server.port，重启 VitePress dev 即可。' },
  { q: '为什么有些页面是英文？', a: '导航 eyebrow 使用英文营造印刷感（参考 VitePress 站点设计），所有核心按钮与说明都是中文。' },
  { q: '能加新功能吗？', a: '可以。修改 gui/src/views/ 对应文件即可，新增 API 时同步修改 gui/server/index.mjs。' }
]
</script>

<template>
  <div class="p-8 max-w-5xl mx-auto space-y-8">
    <!-- Hero -->
    <div>
      <div class="eyebrow">GUIDE · 使用指引</div>
      <h2 class="serif-title text-3xl mt-1" style="color: var(--text);">
        <span class="italic-serif">5</span> 步上手 FilePress GUI
      </h2>
      <p class="text-sm mt-2" style="color: var(--text-muted); max-width: 560px;">
        从零开始，到部署上线。无需打开终端，点点鼠标完成全部流程。
      </p>
    </div>

    <!-- 步骤 -->
    <ol class="space-y-3">
      <li v-for="s in steps" :key="s.n" class="card-static p-5 flex gap-5">
        <div class="serif-title text-3xl mono-num flex-shrink-0" style="color: var(--accent); width: 60px;">{{ s.n }}</div>
        <div>
          <div class="serif-title text-lg" style="color: var(--text);">{{ s.t }}</div>
          <div class="text-sm mt-1" style="color: var(--text-muted);">{{ s.d }}</div>
        </div>
      </li>
    </ol>

    <!-- 快捷入口 -->
    <div class="card-static p-6">
      <div class="eyebrow mb-3">QUICK ACTIONS</div>
      <div class="flex flex-wrap gap-2">
        <button class="btn btn-primary" @click="router.push('/editor')">✎ 开始写作</button>
        <button class="btn btn-ghost" @click="router.push('/files')">▤ 文件管理</button>
        <button class="btn btn-ghost" @click="router.push('/deploy')">▲ 部署</button>
      </div>
    </div>

    <!-- FAQ -->
    <div>
      <div class="eyebrow mb-3">FAQ · 常见问题</div>
      <div class="space-y-2">
        <details
          v-for="(f, i) in faqs"
          :key="i"
          class="card-static px-5 py-3"
        >
          <summary class="cursor-pointer font-semibold text-sm select-none" style="color: var(--text);">{{ f.q }}</summary>
          <p class="text-sm mt-2" style="color: var(--text-muted);">{{ f.a }}</p>
        </details>
      </div>
    </div>

    <!-- 命令对照 -->
    <div class="card-static p-6">
      <div class="eyebrow mb-3">CLI ↔ GUI · 命令对照</div>
      <table class="tbl">
        <thead>
          <tr><th>GUI 操作</th><th>等价命令</th></tr>
        </thead>
        <tbody>
          <tr><td>新建文章</td><td class="mono-num text-xs">pnpm post n &lt;slug&gt; -T &lt;title&gt; -t &lt;tags&gt;</td></tr>
          <tr><td>更新文章</td><td class="mono-num text-xs">pnpm post u &lt;slug&gt; --append-tags &lt;tags&gt;</td></tr>
          <tr><td>发布草稿</td><td class="mono-num text-xs">pnpm post p &lt;slug&gt;</td></tr>
          <tr><td>一键部署</td><td class="mono-num text-xs">pnpm post d -y</td></tr>
          <tr><td>启动 dev / 本地预览</td><td class="mono-num text-xs">pnpm post s --open</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
