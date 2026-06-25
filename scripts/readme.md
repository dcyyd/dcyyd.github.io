# `post` CLI · FilePress Blog 内容管理工具

> 一套面向 **FilePress Blog (`filepress-blog` v2.5.0)** 项目的 Node.js 命令行工具，覆盖**文章创建、元数据更新、草稿发布、一键部署、查询、开发服务器启动与缓存清理**全流程。
> 与项目既有的 slug 规则、frontmatter 顺序、gray-matter 解析保持完全一致，写入即被 VitePress HMR 捕获，**无需重启 dev server**。
>
> 命令设计灵感来自 Hexo 常用指令体系，支持**短选项**（`-T` / `-t` / `-m` / `-y`）与**命令简写**（`n` / `u` / `p` / `d` / `l` / `r` / `s` / `c`）。
>
> **作者**：窦长友 &lt;dcyyd_kcug@yeah.net&gt;

---

## 1. 快速开始

```bash
# 总览
pnpm post help

# 创建新文章并用 VS Code 打开
pnpm post n my-post -T "标题" -t "vue3,ts" -o

# 创建草稿
pnpm post n draft-post --draft -t "WIP"

# 发布草稿
pnpm post p draft-post -y

# 列出全部文章（含字数统计）
pnpm post l

# 更新文章标签
pnpm post u my-post --append-tags "性能优化" -y

# 查看某篇文章的元数据
pnpm post r my-post

# 启动开发服务器
pnpm post s --open

# 🆕 一键部署到 GitHub Pages（v2.0 新增）
pnpm post d -y

# 清理构建缓存
pnpm post c
```

启动后默认进入交互模式（仅 Tty 终端），非 Tty 场景（如 CI、容器、subprocess）会使用占位默认值；可通过参数一次性传齐。

> **包脚本别名**：`pnpm pn` / `pnpm pu` / `pnpm pp` / **`pnpm pd`** / `pnpm pl` / `pnpm pr` / `pnpm ps` / `pnpm pc`

> **典型工作流**
>
> ```bash
> # 创建草稿并立即打开编辑
> pnpm post n ai-agent-design --draft -t "AI,Agent" -o
>
> # 编辑完成后发布
> pnpm post p ai-agent-design -y
>
> # 查看统计
> pnpm post l
>
> # 启动预览
> pnpm post s --open
>
> # 一键部署到 GitHub Pages
> pnpm post d -y
> ```

---

## 2. 命令总览

| 命令                         | 简写  | 说明                                             |
| ---------------------------- | ----- | ------------------------------------------------ |
| `pnpm post new <slug>`     | `n` | 在 `content/posts/` 创建新文章                 |
| `pnpm post update <slug>`  | `u` | 更新已有文章的 frontmatter                       |
| `pnpm post publish <slug>` | `p` | 发布草稿（移除 draft 标记，更新日期）            |
| **`pnpm post deploy`**     | **`d`** | **构建 + 推送 dist 到 `gh-pages` 分支（v2.0 一键部署）** |
| `pnpm post list`           | `l` | 列出所有文章（含字数统计、状态标识）             |
| `pnpm post read <slug>`    | `r` | 查看 frontmatter 与正文前 10 行                  |
| `pnpm post serve`          | `s` | 启动 VitePress 开发服务器                        |
| `pnpm post clean`          | `c` | 清理 `.vitepress/cache` 与 `.vitepress/dist` |
| `pnpm post help [cmd]`     | —    | 查看总览或指定命令的详细帮助                     |

### 2.1 短选项速查

| 短     | 长                | 适用命令               | 备注 |
| ------ | ----------------- | ---------------------- | --- |
| `-T` | `--title`       | new / update           | |
| `-d` | `--description` | new / update           | |
| `-D` | `--date`        | new / update / publish | |
| `-a` | `--author`      | new / update           | |
| `-c` | `--category`    | new / update           | |
| `-t` | `--tags`        | new / update           | |
| `-C` | `--cover`       | new / update           | |
| `-o` | `--open`        | new / serve            | |
| `-y` | `--yes`         | update / publish / deploy | |
| `-f` | `--force`       | new                    | |
| **`-m`** | **`--message`** | **deploy**         | 🆕 v2.0 |
| **`-p`** | **`--port`**    | **serve**            | 🆕 v2.0 |
| **`-h`** | **`--host`**    | **serve**            | 🆕 v2.0 |

---

## 3. `new` / `n` · 创建新文章

### 3.1 用法

```bash
pnpm post n <slug> [options]
pnpm post new <slug> [options]
```

在 `content/posts/<slug>.md` 创建一个包含完整 frontmatter 占位的文章。已存在时**默认拒绝覆盖**（避免误操作），可通过 `-f` / `--force` 强制覆盖。

### 3.2 选项

| 参数                         | 说明                      | 默认值                           |
| ---------------------------- | ------------------------- | -------------------------------- |
| `-T, --title <text>`       | 文章标题                  | `未命名文章：<slug>`           |
| `-d, --description <text>` | 文章描述                  | 留空                             |
| `-D, --date <YYYY-MM-DD>`  | 发布日期                  | 当天（`today` / `now` 也可） |
| `-a, --author <name>`      | 作者                      | 留空                             |
| `-c, --category <name>`    | 分类                      | 留空                             |
| `-t, --tags "a, b, c"`     | 标签（逗号 / 空格分隔）   | 空                               |
| `-C, --cover <url>`        | 封面图链接                | 留空                             |
| `--draft`                  | 标记为草稿                | `false`                        |
| `-f, --force`              | 已存在时强制覆盖          | `false`                        |
| `-o, --open`               | 创建后用 VS Code 打开文件 | `false`                        |

### 3.3 示例

```bash
# 最小命令
pnpm post n vue3-reactivity

# 一次性传齐字段（使用短选项）
pnpm post n vue3-reactivity \
  -T "Vue3 响应式原理" \
  -d "深入理解 Proxy / effect / track / trigger" \
  -a "窦长友" \
  -c "前端" \
  -t "Vue3,源码,响应式" \
  -C "/assets/vue3-cover.png" \
  -D 2026-06-17

# 创建草稿并自动打开编辑器
pnpm post n draft-post --draft -t "草稿,WIP" -o

# 强制覆盖已存在的文件
pnpm post n my-post -T "新标题" -f
```

---

## 4. `update` / `u` · 更新元数据

### 4.1 用法

```bash
pnpm post u <slug> [options]
pnpm post update <slug> [options]
```

更新已有文章的 frontmatter，**缺省字段保持原值**。写入前会打印 diff 预览；非 `-y` / `--yes` 模式需要确认一次。**自动维护 `updated` 字段**（除非显式传 `--updated=false` 或指定日期）。

### 4.2 选项

| 参数                         | 说明                                        |
| ---------------------------- | ------------------------------------------- |
| `-T, --title <text>`       | 新标题                                      |
| `-d, --description <text>` | 新描述；空字符串 `""` 表示显式置空        |
| `-D, --date <YYYY-MM-DD>`  | 新发布日期                                  |
| `-a, --author <name>`      | 新作者                                      |
| `-c, --category <name>`    | 新分类                                      |
| `-t, --tags "a, b"`        | **替换**为指定标签列表                |
| `--append-tags "x, y"`     | 追加标签（保留原有，去重）                  |
| `--remove-tag <name>`      | 移除指定标签                                |
| `-C, --cover <url>`        | 新封面                                      |
| `--draft` / `--no-draft` | 切换草稿状态                                |
| `--updated <date\|false>`   | 自定义 `updated` 字段；`false` 表示清除 |
| `-y, --yes`                | 跳过确认（适合 CI / 自动化）                |

### 4.3 实际会话示例

```bash
$ pnpm post u cli-demo-post -T "CLI 工具演示（已更新）" --append-tags "自动化" --remove-tag "演示" -y

✎ 更新文章元数据

ℹ 当前元数据:
ℹ   title: CLI 工具演示
ℹ   description: 通过命令行创建的文章
ℹ   date: 2026-06-17
ℹ   author: 窦长友
ℹ   category: 工具
ℹ   tags: CLI, 演示, 工程化

ℹ 将要应用:
ℹ   title: CLI 工具演示（已更新）
ℹ   tags: CLI, 工程化, 自动化

✔ 已更新: content\posts\cli-demo-post.md
```

---

## 5. `publish` / `p` · 发布草稿

### 5.1 用法

```bash
pnpm post p <slug> [options]
pnpm post publish <slug> [options]
```

将草稿（`draft: true`）转为正式发布。执行以下操作：

- 移除 `draft` 标记
- 将 `date` 设为今天（或 `-D` / `--date` 指定）
- 自动设置 `updated` 字段

已是非草稿的文章会给出提示，不执行任何写入。

### 5.2 选项

| 参数                        | 说明         | 默认值    |
| --------------------------- | ------------ | --------- |
| `-D, --date <YYYY-MM-DD>` | 指定发布日期 | 当天      |
| `-y, --yes`               | 跳过确认     | `false` |

### 5.3 示例

```bash
# 默认发布（会提示确认）
pnpm post p draft-post

# 指定发布日期 + 跳过确认
pnpm post p draft-post -D 2026-06-01 -y
```

---

## 5.5. `deploy` / `d` · 一键部署到 GitHub Pages 🆕

> v2.0 新增命令。源码：[`scripts/post-cli/deploy.mjs`](post-cli/deploy.mjs)

### 5.5.1 用法

```bash
pnpm post d                  # 完整流程：预检 → 构建 → 推送
pnpm post d -y               # 跳过确认
pnpm post d --skip-build     # 复用现有 dist
pnpm post d --branch main    # 推送到指定分支
pnpm post d -m "fix: typo"   # 自定义 commit 信息
pnpm post d --skip-push      # 只构建不推送
pnpm post pd -y              # 同样可用（package.json 脚本别名）
```

### 5.5.2 内部步骤

| 阶段 | 行为 |
|------|------|
| ① 预检 | 检查 git 可用、SSH 可达（仅 SSH 协议）、源码工作区状态 |
| ② 构建 | 执行 `npx vitepress build .`，实时透传进度 |
| ③ 推送 | 在 `.vitepress/dist` 内初始化临时仓库 → commit → force-push 到 `gh-pages` |
| ④ 清理 | 移除 `.vitepress/dist/.git` 临时仓库 |

### 5.5.3 选项

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--repo <url>`         | 目标仓库          | `git@github.com:dcyyd/dcyyd.github.io.git` |
| `--branch <name>`      | 目标分支          | `gh-pages` |
| `-m, --message <text>` | commit 信息       | `deploy: update site` |
| `--skip-build`         | 跳过构建，复用现有 dist | `false` |
| `--skip-push`          | 只构建不推送       | `false` |
| `--no-cleanup`         | 保留 dist/.git（调试） | `false` |
| `-y, --yes`            | 跳过确认步骤       | `false` |

### 5.5.4 环境变量

| 变量 | 作用 | 等价 flag |
|------|------|-----------|
| `DEPLOY_REPO`    | 覆盖默认仓库     | `--repo` |
| `DEPLOY_BRANCH`  | 覆盖默认分支     | `--branch` |

### 5.5.5 典型工作流

```bash
# 1. 创建并写好文章
pnpm post n my-new-article -t "主题" -o

# 2. 本地预览
pnpm post s

# 3. 一键部署（自动构建 + 推送 gh-pages）
pnpm post d -y

# 4. 1-2 分钟后访问 https://dcyyd.github.io
```

### 5.5.6 实现要点

- **跨平台执行**：完全基于 `node:child_process` + `node:fs/promises`，不再依赖 PowerShell。
- **参数安全**：`execFile(..., { shell: false })`，args 作为数组原样传递，避免含空格的 message 被 shell 错误拆分。
- **Windows SSH**：自动注入 `HOME=C:/Users/...` 与 `GIT_SSH_COMMAND`，确保 OpenSSH 找到 `~/.ssh/id_rsa`。
- **软预检**：SSH 连接失败时给出警告而非硬中断，可由 `DEPLOY_REPO` 切换为 HTTPS。
- **失败清理**：异常退出时同步清理 `.vitepress/dist/.git` 临时仓库。

### 5.5.7 已知 BUG 与修复（v2.0）

| ID | 现象 | 根因 | 修复 |
| --- | --- | --- | --- |
| B001 | `error: pathspec 'update' did not match` | `shell: true` 拆分含空格的 message | 改 `shell: false` |
| B002 | `消息: true` | `-m` 未注册为短选项 | `SHORT_FLAGS` 新增 `m: 'message'` |
| B003 | `Could not create directory '/home/root/.ssh'` | Windows 节点进程无 `HOME` | 注入 `HOME` + `GIT_SSH_COMMAND` |
| B005 | SSH 预检误报 | `BatchMode=yes` + 仅看退出码 | 解析 `successfully authenticated` 文本 |
| B006 | `DEP0190` 警告 | `execFile` + `shell: true` | 改 `shell: false` + Windows `.exe` 自动追加 |

> **前置条件**：
> - 仓库远端使用 SSH 协议（默认配置即可）
> - 本机 `~/.ssh/id_rsa` 已添加到 GitHub Settings → SSH keys
> - GitHub Pages Source 选 **"Deploy from a branch"**，分支 `gh-pages`，目录 `/`
>
> **与 GitHub Actions 的关系**：本命令是手动部署的便捷封装。如已配置 `.github/workflows/deploy.yml` 自动部署，则推 `main` 分支即可，无需执行 `pnpm post d`。详见 [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)。

---

## 6. `list` / `l` · 列出文章

### 6.1 用法

```bash
pnpm post l [options]
pnpm post list [options]
```

### 6.2 选项

| 参数             | 说明                         |
| ---------------- | ---------------------------- |
| `--tag <name>` | 只显示包含指定 tag 的文章    |
| `--draft`      | 包含草稿（默认隐藏）         |
| `--json`       | 以 JSON 输出（适合管道处理） |

### 6.3 表格输出

```bash
$ pnpm post l

☰  文章列表
STATUS  SLUG                        DATE          WORDS  TITLE
--------------------------------------------------------------------------------------------------------------
 ✓   engineer-time-management    2026-06-20     476 2m  工程师的时间管理：三件套方法论
 ✓   llm-architecture-evolution  2026-06-16     409 2m  大语言模型架构演进史
 ✓   production-rag-system-d...  2026-06-18     450 2m  生产级 RAG 系统设计笔记
 ✓   typescript-advanced-types   2026-06-14     339 2m  TypeScript 高级类型体操指北
 ✓   vitepress-performance-guide 2026-06-10     387 2m  VitePress 站点性能优化实战
 ✓   vue3-reactivity-deep-dive   2026-06-12     376 2m  深入理解 Vue 3 响应式系统

共 6 篇文章  ·  2437 字  ·  约 9 min 阅读
```

### 6.4 包含草稿

```bash
pnpm post l --draft
```

### 6.5 按标签过滤

```bash
pnpm post l --tag Vue3
```

### 6.6 JSON 输出

```bash
$ pnpm post l --json
[
  {
    "slug": "vue3-reactivity-deep-dive",
    "title": "深入理解 Vue 3 响应式系统",
    "date": "2026-06-12",
    "tags": ["Vue3", "源码"],
    "draft": false,
    "words": 376,
    "readingTime": 2
  }
]
```

---

## 7. `read` / `r` · 查看文章详情

### 7.1 用法

```bash
pnpm post r <slug>
pnpm post read <slug>
```

### 7.2 示例

```bash
$ pnpm post r vitepress-performance

📖  文章详情
文件: content\posts\vitepress-performance.md
slug: vitepress-performance

Frontmatter
----------------------------------------
title: VitePress 文件驱动博客的构建期数据管线
description: ...
date: 2026-06-10
author: 窦长友
tags: VitePress, 性能优化, Markdown

Body 前 10 行
----------------------------------------
# VitePress 文件驱动博客的构建期数据管线
...
```

---

## 8. `serve` / `s` · 启动开发服务器

### 8.1 用法

```bash
pnpm post s [options]
pnpm post serve [options]
```

启动 VitePress 开发服务器。默认 `localhost:5173`。

### 8.2 选项

| 参数                 | 说明                                 |
| -------------------- | ------------------------------------ |
| `-p, --port <num>` | 指定端口（默认 5173）                |
| `-h, --host`       | 允许局域网 / 外部访问（`0.0.0.0`） |
| `-o, --open`       | 自动打开浏览器                       |
| `--rss`            | 启动前生成 RSS                       |

### 8.3 示例

```bash
# 默认启动
pnpm post s

# 指定端口 + 全局访问 + 打开浏览器
pnpm post s --port 8080 --host --open

# 启动前生成 RSS
pnpm post s --rss
```

---

## 9. `clean` / `c` · 清理构建缓存

### 9.1 用法

```bash
pnpm post c
pnpm post clean
```

清理 `.vitepress/cache` 和 `.vitepress/dist` 目录。相当于 Hexo 的 `hexo clean`。

### 9.2 示例

```bash
$ pnpm post c
ℹ 已清理: .vitepress/cache
ℹ 已清理: .vitepress/dist
✔ 清理完成。
```

常见组合：

```bash
# 清缓存后启动
pnpm post c && pnpm post s

# 清缓存后构建
pnpm post c && pnpm build
```

---

## 9.5 `sitemap` · 生成站点地图 🆕

> v2.0 新增脚本。源码：[`scripts/generate-sitemap.mjs`](generate-sitemap.mjs)

### 9.5.1 用途

扫描 `content/posts/**/*.md` 自动生成标准 `sitemap.xml`，方便搜索引擎与站长平台收录：

- 静态页面（首页 / 博客 / 分类 / 归档 / 更新日志 / 友链 / 关于）
- 每篇文章（取 `date` 作为 `lastmod`）
- 每个分类与标签
- RSS feed 入口

### 9.5.2 用法

```bash
pnpm sitemap                       # 生成 public/sitemap.xml
SITE_URL=https://dcyyd.github.io pnpm sitemap   # 指定站点 URL
SITE_BASE=project/ pnpm sitemap    # 项目页部署场景：根路径不为 /
```

### 9.5.3 已集成到 `pnpm build` / `pnpm dev`

```bash
# 构建流水线：typecheck → rss → sitemap → vitepress build
pnpm build

# 开发服务器：rss → sitemap → vitepress dev
pnpm dev
```

无需手动执行，构建时自动串联。

### 9.5.4 输出示例

```text
[sitemap] 正在生成 sitemap.xml ...
[sitemap] ✔ 已写入 public/sitemap.xml
[sitemap]   · 文章：8
[sitemap]   · 分类：5
[sitemap]   · 标签：12
[sitemap]   · 站点 URL：https://dcyyd.github.io
[sitemap]   · 合计 URL：33
```

### 9.5.5 注意事项

- **草稿不入索引**：`draft: true` 的文章会被跳过。
- **BASE 适配**：项目页部署时通过 `SITE_BASE=project/` 指定子路径，URL 自动拼接。
- **优先级与频率**：文章默认 `priority=0.7 / monthly`，静态页 `priority=1.0 / daily`，可按需在脚本中调整。

---

## 10. 错误码表

CLI 使用语义化退出码，方便脚本与 CI 调用。

| 退出码 | 含义       | 触发场景                                                |
| ------ | ---------- | ------------------------------------------------------- |
| `0`  | 成功       | —                                                      |
| `1`  | 一般错误   | 参数解析失败 / 未传可更新字段 / 部署失败等              |
| `2`  | 缺必填参数 | `new` / `update` / `publish` 没传 slug            |
| `3`  | 文件不存在 | `update` / `read` / `publish` 指定了不存在的 slug |
| `4`  | 权限拒绝   | 目录或文件无读 / 写权限（`EACCES`）                   |
| `5`  | 文件已存在 | `new` 目标已存在，且未加 `-f` / `--force`         |
| `6`  | 磁盘满     | 写入时 `ENOSPC`                                       |
| `7`  | 目录不可写 | `content/posts` 不可写且无法创建                      |

所有错误均带有 `hint` 提示下一步操作建议。

---

## 11. 与 VitePress HMR 的协作

CLI 落盘后，VitePress dev server 会通过 `chokidar` 自动重新加载该 `.md` 文件：

- 文章卡片 / 列表页即时刷新
- 文章详情页（`<Content/>`）自动热更新
- frontmatter 变更（标签、日期、分类）触发侧边栏与索引页重建

---

## 12. v2.0–v2.5 累计更新摘要

| 版本 | 类别 | 内容 |
| --- | --- | --- |
| **v2.5** | 搜索 + SEO | 全局全文搜索（Cmd+K）、Open Graph / Twitter Card 全站 meta 标签、`SearchModal.vue` 新组件 |
| **v2.4** | 浏览量 + 版权 | 全局实时计数（countapi.xyz）、CC BY-NC-ND 4.0 版权声明、Blog 分页、TagFilter 折叠 |
| **v2.3** | BUG 修复 + 优化 | B011-B013 修复（解析器死循环/中文 slug/编辑器阻塞）、GUI 浏览量轮询、SiteFooter 总访问量 |
| **v2.2** | GUI 后台 | 完整 Web SPA 管理后台（5 大模块）、MermaidChart.vue、viewCount.ts、migrate 工具 |
| **v2.1** | 评论 + 404 + sitemap | Giscus 评论、NotFoundPage、sitemap.xml 自动生成、B007-B010 修复 |
| **v2.0** | CLI + 部署 | `deploy`/`clean` 命令、`-m`/`-p`/`-h` 短选项、B001-B006 修复、跨平台、UI 优化 |

---

**FilePress Blog** · v2.5.0 · 作者 [窦长友](mailto:dcyyd_kcug@yeah.net)
