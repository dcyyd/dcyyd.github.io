# 常见问题（FAQ）

> **FilePress Blog** (`filepress-blog` v2.5.0) · 作者：窦长友 &lt;dcyyd_kcug@yeah.net&gt;
>
> 本文档收录开发、构建、部署、内容管理、CLI 工具的常见问题与排错步骤。
>
> **最近更新**：2026-06-26 发布 v2.5.0，全局全文搜索（Cmd+K）、SEO Open Graph / Twitter Card 全站 meta 标签。

---

## 目录

- [开发相关](#开发相关)
- [构建相关](#构建相关)
- [部署相关](#部署相关)
- [文章管理](#文章管理)
- [post-cli 常见错误](#post-cli-常见错误)
- [BUG 修复记录（v2.0）](#bug-修复记录v20)
- [自定义](#自定义)
- [安全与凭据](#安全与凭据)

---

## 开发相关

### 启动后页面报 404

确认是否先执行过 `pnpm rss` 生成 `public/feed.xml`。`pnpm dev` 会自动执行，直接 `vitepress dev` 则不会。

### 修改文章后热更新不生效

VitePress HMR 监听 `content/posts/` 目录变化，确认：

1. 文件名符合 slug 规则（小写字母 + 数字 + `-`）。
2. 未被 `.gitignore` 排除。
3. 未运行在 `pnpm build` 产物预览模式（`pnpm preview` 不含 HMR）。

### TypeScript 类型检查报错

```bash
# 单独运行类型检查查看详情
pnpm typecheck

# 构建时跳过类型检查（不推荐）
npx vitepress build .
```

已知的 TS strict 问题（`exactOptionalPropertyTypes` 与 Vue 类型系统的边界摩擦）不影响构建产物。

### 中文分类 / 标签页 404（v2.0 已修复）

**问题 URL**：`https://dcyyd.github.io/categories/ai-%E4%B8%8E%E5%A4%A7%E6%A8%A1%E5%9E%8B`

**根因**：`tagToSlug()` 使用 `encodeURIComponent` 对中文 slug 二次编码，导致 URL 出现 `ai-%E4%B8%8E...` 而非预期的 `ai-与大模型` 形态。

**修复**：v2.0 起直接使用中文字符作为 URL 片段，移除多余的 `encodeURIComponent` 包装。

```ts
// .vitepress/theme/utils/slug.ts (v2.0)
export function tagToSlug(name: string): string {
  return name.trim()           // 不再二次 encode
}
```

---

## 构建相关

### `pnpm build` 失败

| 现象 | 根因 | 修复 |
| --- | --- | --- |
| `vue-tsc` 报错 | TypeScript strict 失败 | 先 `pnpm typecheck` 单独看 |
| RSS 生成失败 | `content/posts/` 无有效 Markdown | 添加至少一篇文章 |
| `EACCES` 写入失败 | `.vitepress/` 权限不足 | `pnpm post c` 清理后重试 |
| Node 版本过低 | 需要 Node ≥ 20 | 升级 Node |

### 构建产物过大

首屏加载优化策略：

- `katex` 和 `lucide-vue-next` 已做手动 chunk 拆分。
- 图片使用 `pnpm images` 转为 WebP + LQIP。
- 静态资源文件名含 hash，可配置 CDN 长期缓存。

### 构建时 `vue-tsc` 报 `exactOptionalPropertyTypes` 错误

项目刻意开启 `exactOptionalPropertyTypes: true`，所有可选属性必须显式标 `?:`，不能传 `undefined`。修复方式：

```ts
// 错误
const meta: PostMeta = { title: 'x', updated: undefined }

// 正确
const meta: PostMeta = { title: 'x' }                  // 省略字段
const meta: PostMeta = { title: 'x', updated: '2026-06-22' }  // 显式赋值
```

---

## 部署相关

### 部署后页面白屏 / 资源 404

**最常见原因：`BASE` 路径不正确。**

- **User Page** (`<user>.github.io`)：`BASE=/`
- **Project Page** (`<user>/<repo>`)：`BASE=/<repo>/`

检查 `.github/workflows/deploy.yml` 中的 `BASE` 环境变量。

### GitHub Actions 权限不足

进入仓库 **Settings → Actions → General → Workflow permissions**，选择 **"Read and write permissions"**。

### 如何手动触发部署

Actions 面板 → **"Deploy to GitHub Pages"** → **Run workflow** → 选择分支 → 运行。

### SSH 推送失败（`pnpm post d`）

```bash
# 1. 验证 SSH 连接
ssh -T git@github.com

# 2. 确认公钥已添加
#    GitHub Settings → SSH and GPG keys → New SSH key

# 3. 确认 ~/.ssh/config 正确（可选）
# Host github.com
#   HostName github.com
#   User git
#   IdentityFile ~/.ssh/id_rsa

# 4. 确认 HOME 指向含 .ssh 的目录
#    Windows 节点进程通常无 HOME；deploy.mjs 已自动注入。
echo $HOME
```

### 推送后 1-2 分钟仍 404

- GitHub Pages CDN 通常 30 秒 ~ 2 分钟生效。
- **Settings → Pages** 查看最新一次部署状态。
- 强制刷新（`Ctrl + Shift + R`）绕过本地缓存。

### 切换为 HTTPS 部署

```bash
# 临时切换
DEPLOY_REPO=https://github.com/dcyyd/dcyyd.github.io.git pnpm post d -y

# 或修改 scripts/post-cli/deploy.mjs 的 DEFAULTS.repo
```

---

## 文章管理

### 无 frontmatter 的文章会怎样？

系统自动降级处理：

| 字段 | 降级策略 |
| --- | --- |
| `title` | 取正文第一个 `#` 标题 |
| `date` | 取文件最后修改时间 |
| `description` | 取正文前 200 字符 |
| `category` | `"未分类"` |
| `tags` | `[]` |

### slug 命名规则

- 仅允许：小写字母 `a-z`、数字 `0-9`、连字符 `-`。
- 中文字符**不能**作为 slug 出现在文件名中（仅标签/分类可用中文 slug）。
- 工具：`scripts/post-cli/slug.mjs`。

### 如何创建草稿？

```bash
pnpm post new draft-post --draft -t "WIP"
```

草稿文章构建时不会出现在列表中，`draft: true` 字段会被过滤。

### 如何追加 / 删除标签？

```bash
# 追加标签
pnpm post u my-post --append-tags "性能优化" -y

# 移除标签
pnpm post u my-post --remove-tag "演示" -y

# 替换为指定列表
pnpm post u my-post --tags "Vue3,源码" -y
```

---

## post-cli 常见错误

### 错误码表

| 退出码 | 含义 | 触发场景 |
| --- | --- | --- |
| `0` | 成功 | — |
| `1` | 一般错误 | 参数解析失败 / 部署失败 |
| `2` | 缺必填参数 | `new` / `update` / `publish` 没传 slug |
| `3` | 文件不存在 | `update` / `read` / `publish` 指定了不存在的 slug |
| `4` | 权限拒绝 | 目录或文件无读/写权限（`EACCES`） |
| `5` | 文件已存在 | `new` 目标已存在，且未加 `-f` / `--force` |
| `6` | 磁盘满 | 写入时 `ENOSPC` |
| `7` | 目录不可写 | `content/posts` 不可写且无法创建 |

### `消息: true` 误解析（v2.0 已修复）

```bash
# 旧版可能输出：
ℹ   消息: true

# 修复后：
ℹ   消息: fix: typo
```

**根因**：`-m` 短选项未注册，被 fallback 为 boolean flag。
**修复**：`SHORT_FLAGS` 注册 `m: 'message'` + 解析时检查类型。

### `error: pathspec 'update' did not match`（v2.0 已修复）

**根因**：`execFile` 使用 `shell: true`，含空格的 commit message 被拆分。
**修复**：`shell: false` + args 数组透传。

### `Could not create directory '/home/root/.ssh'`（v2.0 已修复）

**根因**：Windows 节点进程未设置 `HOME`，Git for Windows ssh 找不到 `~/.ssh`。
**修复**：`getDeployEnv()` 注入 `HOME=C:/Users/...` + `GIT_SSH_COMMAND`。

### `DEP0190 DeprecationWarning` 大量出现（v2.0 已修复）

**根因**：`execFile` 使用 `shell: true`，Node.js 视为不安全。
**修复**：统一改为 `shell: false` + Windows `.exe` 后缀自动追加。

### SSH 预检误报失败（v2.0 已修复）

**根因**：启用 `BatchMode=yes` + 仅看退出码，但 `ssh -T` 认证成功时也以非零退出。
**修复**：改为解析 `successfully authenticated` 文本；并改为软警告而非硬失败。

### 中文 slug 二次编码 404（v2.0 已修复）

参见 [中文分类 / 标签页 404](#中文分类--标签页-404v20-已修复)。

---

## BUG 修复记录

### v2.3 修复

| ID | 现象 | 根因 | 修复 | 文件 |
| --- | --- | --- | --- | --- |
| **B011** | Markdown 解析器死循环 OOM | 4 反引号代码块触发空段落 + 未递增 i | 段落检测排除 4 反引号，新增加空 p 防御 | `gui/src/utils/markdown.ts` |
| **B012** | 中文 slug 文章 API 加载卡住 | `getPost`/`updatePost` 错误使用 `decodeURIComponent` | 移除冗余解码 | `gui/src/api/index.ts` |
| **B013** | 编辑器加载大文章界面卡死 | `fromPost()` 同步调用 `updatePreviewSync()` 阻塞 | 改为 `schedulePreviewUpdate()` 防抖 | `gui/src/views/EditorView.vue` |

### v2.1 修复

| ID | 现象 | 根因 | 修复 | 文件 |
| --- | --- | --- | --- | --- |
| **B007** | CI 部署后 Giscus 报 `repo=undefined` | `.env` 被 `.gitignore`，CI 拿不到变量 | CI Build env 注入 `VITE_GISCUS_*` | `.github/workflows/deploy.yml` |
| **B008** | 本地 dev 时 Giscus 配置丢失 | VitePress 不自动加载 `.env` | `config.mts` 增加轻量级 .env 解析器 | `.vitepress/config.mts` |
| **B009** | 404 页面未生效 | `404.md` 设置 `layout: page` 覆盖内置布局 | 移除冲突配置 | `404.md` |
| **B010** | sitemap URL 默认值为 `https://example.com` | 硬编码示例域名 | 改为 `https://dcyyd.github.io` + `SITE_URL` 覆盖 | `scripts/generate-sitemap.mjs` |

### v2.0 修复

| ID | 现象 | 根因 | 修复 | 文件 |
| --- | --- | --- | --- | --- |
| **B001** | `error: pathspec 'update' did not match` | `shell: true` 拆分含空格的 message | 改 `shell: false` | `scripts/post-cli/deploy.mjs` |
| **B002** | `消息: true` 误解析 | `-m` 未注册为短选项 | `SHORT_FLAGS` 新增 `m: 'message'` + 类型防御 | `scripts/post-cli.mjs` |
| **B003** | `Could not create directory '/home/root/.ssh'` | Windows 节点进程无 `HOME` | 注入 `HOME` + `GIT_SSH_COMMAND` | `scripts/post-cli/deploy.mjs` |
| **B004** | 中文分类 / 标签页 404 | `tagToSlug()` 二次 `encodeURIComponent` | 改用中文原字符作为 slug | `.vitepress/theme/utils/slug.ts` |
| **B005** | SSH 预检误报失败 | `BatchMode=yes` + 仅看退出码 | 解析 `successfully authenticated` 文本 | `scripts/post-cli/deploy.mjs` |
| **B006** | `DEP0190` 警告 | `execFile` + `shell: true` | 改 `shell: false` + Windows `.exe` 自动追加 | `scripts/post-cli/deploy.mjs` |

---

## 自定义

### 添加自定义字体

1. 将 `.woff2` 文件放入 `public/fonts/`。
2. 在 `.vitepress/theme/styles/fonts.css` 中添加 `@font-face`。
3. 在 `tailwind.config.js` 中扩展字体族：

```js
fontFamily: {
  sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'monospace']
}
```

### 修改配色方案

编辑 `tailwind.config.js` 中的 `brand` 色板：

```js
colors: {
  brand: {
    50: '#f0fdf4',
    // ... 完整的 green-emerald 色阶
    950: '#052e16',
  },
}
```

### 添加新的导航项

编辑 `.vitepress/theme/components/HeaderNav.vue` 中的 `navItems` 数组。

### 自定义首页

编辑 `.vitepress/theme/components/HomePage.vue`，该组件完全替代 VitePress 默认首页。

### 添加新的页面路由

1. 创建 `my-page.md`（顶层）。
2. 在 `.vitepress/config.mts` 的 `themeConfig.nav` 中注册。
3. 在 `AppLayout.vue` / `index.ts` 中按需挂载组件。

---

## 搜索与 SEO（🆕 v2.5）

### 如何打开全局搜索？

- **快捷键**：`Cmd+K`（macOS）/ `Ctrl+K`（Windows/Linux）
- **桌面导航栏**：点击导航栏中 Search 图标按钮
- **移动端**：打开汉堡菜单，点击搜索行

### 搜索索引如何构建？

搜索索引在客户端直接从 VitePress 的 `posts.data` 构建，**无需 pagefind 等第三方工具**。索引包含标题、描述、正文和标签字段，加权评分排序：

| 字段 | 权重 |
| --- | --- |
| 标题 | 150 |
| 标签 | 60 |
| 描述 | 40 |
| 正文 | 20 |

### 搜索支持哪些操作？

- 输入即搜（150ms 防抖）
- 键盘导航：`↑` / `↓` 选择结果，`Enter` 打开，`Esc` 关闭
- 关键词高亮匹配 + 正文 snippet 展示
- 最多显示 15 条结果

### SEO meta 标签有哪些？

- **静态标签**（所有页面）：`og:type`、`og:site_name`、`og:locale`、`twitter:card`、`twitter:site`
- **动态标签**（每页独立）：`og:title`、`og:description`、`og:url`、`og:image` 及对应的 Twitter 镜像标签
- 数据源：`config.mts` 的 `transformHead` 钩子从 `context.title` / `context.description` / `context.page` 动态生成

---

## 安全与凭据

### SSH 私钥放哪？

`~/.ssh/id_rsa`，由 `deploy.mjs` 的 `GIT_SSH_COMMAND` 显式指定路径，**不会**写入项目目录或 git 历史。

### 凭据会被打印到日志吗？

**不会**。`deploy.mjs` 仅在调试信息中输出 `repo` / `branch` / `message`，**不输出私钥内容或路径中的明文密钥**。

### 如何撤销已部署的 SSH 凭据？

1. 删除 GitHub Settings → SSH and GPG keys 中的对应公钥。
2. 删除本地 `~/.ssh/id_rsa`。
3. 重新生成新密钥并上传。

### 部署目标仓库写错了怎么办？

`pnpm post d` 的所有目标仓库/分支都通过 `--repo` / `--branch` 显式传入：

```bash
pnpm post d --repo git@github.com:OWNER/REPO.git --branch main -y
```

或通过环境变量：

```bash
DEPLOY_REPO=git@github.com:OWNER/REPO.git DEPLOY_BRANCH=main pnpm post d -y
```

---

**FilePress Blog** · v2.5.0 · 作者 [窦长友](mailto:dcyyd_kcug@yeah.net)
