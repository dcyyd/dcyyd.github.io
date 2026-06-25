# 评论系统（Giscus）配置指南

> 本项目使用 [Giscus](https://giscus.app/zh-CN) 作为评论系统，基于 **GitHub Discussions**，**零后端、零数据库、零成本**，与项目"纯文件驱动"理念完全契合。
>
> **FilePress Blog** v2.5.0 · v2.1 新增

---

## 为什么选 Giscus？

| 维度 | Giscus | 自建后端 | Utterances |
|------|--------|----------|------------|
| 数据存储 | GitHub Discussions | 自建 DB | GitHub Issues |
| 嵌套回复 | ✅ | ✅ | ❌ |
| Markdown / 代码高亮 | ✅ | ✅ | ✅ |
| 反垃圾 | GitHub 登录态 | 自建 | GitHub 登录态 |
| 评论通知 | GitHub 通知 + 邮箱 | 自建 | GitHub 通知 |
| 维护成本 | **0** | 高 | 0 |
| 用户登录门槛 | 需要 GitHub 账号 | 自定义 | 需要 GitHub 账号 |

---

## 一次性配置（5 步）

### 第 1 步：开启 GitHub Discussions

进入你的 GitHub 仓库 → **Settings** → **General** → 勾选 **Discussions**。

### 第 2 步：安装 Giscus GitHub App

访问 [github.com/apps/giscus](https://github.com/apps/giscus) → **Install** → 选择你的仓库。

### 第 3 步：创建 Discussion 分类

在仓库的 **Discussions** 标签页新建一个分类（推荐命名 `General` 或 `Comments`），所有评论会归类到这里。

### 第 4 步：获取配置参数

访问 [giscus.app/zh-CN](https://giscus.app/zh-CN)，按提示填写：
- 仓库：`你的用户名/你的仓库`
- Discussion 分类：选刚才创建的
- 其他保持默认

页面下方会生成一段 script，其中包含：
- `data-repo-id`（`R_xxxxxxxx`）
- `data-category-id`（`DIC_xxxxxxxx`）

### 第 5 步：写入项目环境变量

复制 `.env.example` 为 `.env`，填入：

```bash
VITE_GISCUS_REPO=dcyyd/dcyyd.github.io
VITE_GISCUS_REPO_ID=R_xxxxxxxx
VITE_GISCUS_CATEGORY=General
VITE_GISCUS_CATEGORY_ID=DIC_xxxxxxxx
VITE_GISCUS_LANG=zh-CN
```

> ⚠️ **必须以 `VITE_` 前缀**，否则 VitePress 不会注入到客户端 bundle。

### 第 6 步：CI 中配置

如果走 GitHub Actions 自动部署，在 `.github/workflows/deploy.yml` 的 build step 添加：

```yaml
- name: Build
  run: pnpm build
  env:
    BASE: /
    SITE_URL: https://dcyyd.github.io
    VITE_GISCUS_REPO: dcyyd/dcyyd.github.io
    VITE_GISCUS_REPO_ID: ${{ secrets.GISCUS_REPO_ID }}
    VITE_GISCUS_CATEGORY: General
    VITE_GISCUS_CATEGORY_ID: ${{ secrets.GISCUS_CATEGORY_ID }}
    VITE_GISCUS_LANG: zh-CN
```

并把 `GISCUS_REPO_ID` / `GISCUS_CATEGORY_ID` 配置到 **Settings → Secrets and variables → Actions**。

---

## 组件说明

文件：[`theme/components/CommentSection.vue`](../.vitepress/theme/components/CommentSection.vue)

### 核心特性

- **懒加载**：`data-loading="lazy"`，Giscus script 仅在视口可见时加载
- **主题自动跟随**：通过 Giscus 原生 `data-theme="preferred_color_scheme"` 自动跟随系统主题；VitePress 切换 `html.dark` 时 iframe 内部也跟随
- **SPA 路由感知**：`watch(route.path)` 路由切换时重载，让每篇文章对应一个独立 Discussion
- **零配置降级**：`v-if="ready"` — 未配置 Giscus 时整段评论区不渲染
- **极简实现**：v2.1 重写后从 272 行精简到 112 行（-59%），无响应式状态机、无轮询逻辑

### 用法

在 `PostPage.vue` 中已自动引入，无须手动添加。也可在任意 Vue 组件中：

```vue
<CommentSection />
```

### 自定义 Giscus 参数

修改 [CommentSection.vue](../.vitepress/theme/components/CommentSection.vue) 中的 `setAttribute` 调用即可：
- `data-mapping`：`pathname` | `url` | `title` | `og:title` | `specific` | `number`
- `data-reactions-enabled`：是否显示表情
- `data-input-position`：`top` | `bottom`
- `data-theme`：可改为 `noborder_light` / `dark_dimmed` / `dark_high_contrast` 等 Giscus 主题

### 关键实现

```typescript
function mount(): void {
  if (!ready || !containerRef.value) return
  containerRef.value.replaceChildren()  // 路由切换时清空旧实例
  const s = document.createElement('script')
  s.src = 'https://giscus.app/client.js'
  s.async = true
  s.crossOrigin = 'anonymous'
  s.setAttribute('data-repo', repo)
  s.setAttribute('data-repo-id', repoId)
  s.setAttribute('data-category', category)
  s.setAttribute('data-category-id', categoryId)
  s.setAttribute('data-mapping', 'specific')
  s.setAttribute('data-term', route.path)
  s.setAttribute('data-strict', '1')
  s.setAttribute('data-reactions-enabled', '1')
  s.setAttribute('data-emit-metadata', '0')
  s.setAttribute('data-input-position', 'top')
  s.setAttribute('data-theme', 'preferred_color_scheme')
  s.setAttribute('data-lang', lang)
  s.setAttribute('data-loading', 'lazy')
  containerRef.value.appendChild(s)
}
```

---

## 常见问题

### Q1：评论显示"评论区缺失"（v-if 隐藏）

说明 `VITE_GISCUS_*` 环境变量未注入。检查：
- `.env` 文件是否存在且字段以 `VITE_` 前缀开头
- CI 变量是否正确设置（GitHub Secrets）
- 重新执行 `pnpm dev` / `pnpm build` 后是否生效

### Q2：评论加载失败 / 超时 / 403

- 网络环境是否可访问 `giscus.app`
- 仓库是否已安装 giscus App 并授权
- Discussion 分类 ID 是否正确
- 在 Network 面板检查 `https://giscus.app/api/discussions?repo=...` 请求的 `repo` 参数是否为 `undefined`

### Q3：CI 部署后 `repo=undefined`

最常见的根因：`.env` 在 `.gitignore` 中，**不会提交到 GitHub**。必须在 `.github/workflows/deploy.yml` 的 Build env 中显式注入 `VITE_GISCUS_*` 变量，敏感 ID 走 GitHub Secrets。

### Q4：能否替换为其他评论系统？

可以。修改 [CommentSection.vue](../.vitepress/theme/components/CommentSection.vue) 的 `mount()` 函数即可，例如替换为：
- **Twikoo**：自部署在 Vercel / Netlify
- **Waline**：自部署后端
- **Gitalk**：基于 GitHub Issues（注意：无法嵌套回复）

### Q5：评论数据迁移

Giscus 数据存于 GitHub Discussions，可随时：
- **导出**：Discussions API 拉取 JSON
- **迁移**：复制到其他仓库的 Discussions
- **删除**：直接关闭 Discussion 即可

### Q6：如何禁用单篇文章评论？

目前通过 `v-if="ready"` 全局控制（无配置则全站无评论）。如需单篇控制，可在 `PostPage.vue` 的 `frontmatter` 增加 `comments: false` 字段并传递给 `CommentSection`。
