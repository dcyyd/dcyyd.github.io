/**
 * 命令帮助系统
 */

import { blank, ui, VERSION } from './ui.mjs'

const LOGO = [
  '  ______          __    __      __ ',
  ' /_  __/__  _____/ /_  / /___  / /_',
  '  / / / _ \\/ ___/ __ \\/ / __ \\/ __/',
  ' / / /  __/ /  / /_/ / / /_/ / /_  ',
  '/_/  \\___/_/  /_.___/_/\\____/\\__/  '
]

function printLogo() {
  process.stdout.write(`${ui.cyan(LOGO[0])}\n`)
  process.stdout.write(`${ui.cyan(LOGO[1])}\n`)
  process.stdout.write(`${ui.cyan(LOGO[2])}\n`)
  process.stdout.write(`${ui.cyan(LOGO[3])}\n`)
  process.stdout.write(`${ui.cyan(LOGO[4])}  ${ui.dim(`v${VERSION}`)}\n`)
}

const COMMANDS = [
  { name: 'n, new <slug>', desc: '在 content/posts/ 创建新文章', cmd: 'new' },
  { name: 'u, update <slug>', desc: '更新已有文章的 frontmatter', cmd: 'update' },
  { name: 'p, publish <slug>', desc: '发布草稿（移除 draft 标记）', cmd: 'publish' },
  { name: 'd, deploy', desc: '构建 + 推送 dist 到 gh-pages 分支', cmd: 'deploy' },
  { name: 'l, list', desc: '列出所有文章（含 word count）', cmd: 'list' },
  { name: 'r, read <slug>', desc: '查看文章 frontmatter 与正文摘要', cmd: 'read' },
  { name: 's, serve', desc: '启动 VitePress 开发服务器', cmd: 'serve' },
  { name: 'c, clean', desc: '清理 .vitepress/cache 与 dist', cmd: 'clean' },
  { name: 'help [command]', desc: '查看总览或指定命令的详细帮助', cmd: 'help' }
]

const COMMAND_DETAILS = {
  new: `
  ${ui.bold('用法')} ${ui.cyan('pnpm post n[ew] <slug> [options]')}

  ${ui.bold('说明')}
    在 content/posts/<slug>.md 创建一个包含完整 frontmatter 占位的文章。
    缺省字段会进入交互式提示（Tty 下）；非 Tty 下使用占位默认值。
    文件名已存在会报错，避免误覆盖，使用 update 或 --force 覆盖。

  ${ui.bold('选项')}
    -T, --title <text>       文章标题（默认 "未命名文章：<slug>"）
    -d, --description <text> 文章描述
    -D, --date <YYYY-MM-DD>  发布日期（默认 today）
    -a, --author <name>      作者
    -c, --category <name>    分类
    -t, --tags "a, b, c"     标签（逗号或空格分隔）
    -C, --cover <url>        封面图链接
    --draft                  标记为草稿
    -f, --force              已存在时强制覆盖
    -o, --open               创建后用 VS Code 打开

  ${ui.bold('示例')}
    pnpm post n vue3-reactivity
    pnpm post new my-post -T "我的文章" -t "vue3,ts"
    pnpm post n draft-post --draft -t "草稿" -o
`,

  update: `
  ${ui.bold('用法')} ${ui.cyan('pnpm post u[pdate] <slug> [options]')}

  ${ui.bold('说明')}
    更新已有文章的 frontmatter；缺省字段保持原值。
    写入前会打印 diff 预览；非 --yes 模式需要确认一次。
    自动维护 updated 字段（除非显式 --updated=false 或 --updated=YYYY-MM-DD）。

  ${ui.bold('选项')}
    -T, --title <text>       新标题
    -d, --description <text> 新描述；空字符串表示置空
    -D, --date <YYYY-MM-DD>  新发布日期
    -a, --author <name>      新作者
    -c, --category <name>    新分类
    -t, --tags "a, b"        替换为指定标签列表
    --append-tags "x, y"     追加标签（保留原有）
    --remove-tag <name>      移除指定标签
    -C, --cover <url>        新封面
    --draft / --no-draft     切换草稿状态
    --updated <date|false>   自定义 updated 字段
    -y, --yes                跳过确认

  ${ui.bold('示例')}
    pnpm post u vue3-reactivity -T "新标题"
    pnpm post update vue3-reactivity --append-tags "性能优化"
    pnpm post u vue3-reactivity --remove-tag "deprecated" -y
`,

  publish: `
  ${ui.bold('用法')} ${ui.cyan('pnpm post p[ublish] <slug> [options]')}

  ${ui.bold('说明')}
    将草稿（draft: true）转为正式发布。会移除 draft 标记、
    将 date 设为今天（或 --date 指定），并自动设置 updated。

  ${ui.bold('选项')}
    -D, --date <YYYY-MM-DD>  指定发布日期（默认 today）
    -y, --yes                跳过确认

  ${ui.bold('示例')}
    pnpm post p draft-post
    pnpm post publish my-post -D 2026-06-01 -y
`,

  list: `
  ${ui.bold('用法')} ${ui.cyan('pnpm post l[ist] [options]')}

  ${ui.bold('选项')}
    --tag <name>   只显示包含指定 tag 的文章
    --draft        包含草稿（默认隐藏）
    --json         以 JSON 输出（适合管道处理）

  ${ui.bold('示例')}
    pnpm post l
    pnpm post list --tag Vue3
    pnpm post l --draft
    pnpm post l --json | jq '.[].slug'
`,

  deploy: `
  ${ui.bold('用法')} ${ui.cyan('pnpm post d[eploy] [options]')}

  ${ui.bold('说明')}
    一键部署：执行 \`npx vitepress build .\` → 在 .vitepress/dist 内
    初始化临时 Git 仓库 → force-push 到 gh-pages 分支 → 清理临时 .git。
    适用于 Pages Source 选 "Deploy from a branch" 的场景。

    如使用 GitHub Actions 自动部署，可忽略本命令；本命令是手动
    部署的便捷封装，等价于 docs/DEPLOYMENT.md 「方案二」的脚本。

  ${ui.bold('前置条件')}
    • 仓库远端使用 SSH（默认 git@github.com:dcyyd/dcyyd.github.io.git）
    • 本机 ~/.ssh/id_rsa 已添加到 GitHub Settings → SSH keys
    • Pages Source 设置为 "Deploy from a branch" / 分支: gh-pages

  ${ui.bold('选项')}
    --repo <url>          目标仓库（默认 ${ui.dim('git@github.com:dcyyd/dcyyd.github.io.git')}）
    --branch <name>       目标分支（默认 ${ui.dim('gh-pages')}）
    -m, --message <text>  提交信息（默认 "deploy: update site"）
    --skip-build          复用现有 .vitepress/dist 跳过构建
    --skip-push           只构建不推送（用于本地预览产物）
    --no-cleanup          保留 .vitepress/dist/.git（调试用）
    -y, --yes             跳过确认步骤

  ${ui.bold('环境变量（可选，覆盖默认值）')}
    DEPLOY_REPO=<url>     同 --repo
    DEPLOY_BRANCH=<name>  同 --branch

  ${ui.bold('示例')}
    pnpm post d                       # 标准部署
    pnpm post d -y                    # 跳过确认
    pnpm post d --skip-build          # 修复推送失败后重新推送
    pnpm post d --branch main         # 推送到 main 而非 gh-pages
    pnpm post d -m "fix: broken link" # 自定义提交信息
    pnpm post d --skip-push           # 仅构建，不推送
`,

  read: `
  ${ui.bold('用法')} ${ui.cyan('pnpm post r[ead] <slug> [options]')}

  ${ui.bold('说明')}
    打印指定文章的 frontmatter 与正文前 10 行。

  ${ui.bold('示例')}
    pnpm post r vitepress-performance
`,

  serve: `
  ${ui.bold('用法')} ${ui.cyan('pnpm post s[erve] [options]')}

  ${ui.bold('说明')}
    启动 VitePress 开发服务器。默认 localhost:5173。
    支持自定义端口、打开浏览器、预生成RSS。

  ${ui.bold('选项')}
    -p, --port <num>  指定端口（默认 5173）
    -h, --host        允许局域网访问
    -o, --open        自动打开浏览器
    --rss             启动前生成 RSS

  ${ui.bold('示例')}
    pnpm post s
    pnpm post serve --port 8080
    pnpm post s --host --open --rss
`,

  clean: `
  ${ui.bold('用法')} ${ui.cyan('pnpm post c[lean]')}

  ${ui.bold('说明')}
    清理 .vitepress/cache 和 .vitepress/dist 目录。
    相当于 Hexo 的 "hexo clean"。

  ${ui.bold('示例')}
    pnpm post c
    pnpm post c && pnpm post s
`,

  help: `
  ${ui.bold('用法')} ${ui.cyan('pnpm post help [command]')}
`
}

export function printHelp() {
  blank()
  printLogo()
  blank()
  process.stdout.write(`${ui.bold('文件驱动博客 · 内容管理 CLI')}\n\n`)
  process.stdout.write(`${ui.bold('用法')} ${ui.cyan('pnpm post <command> [args]')}\n\n`)
  process.stdout.write(`${ui.bold('快速上手')}\n`)
  process.stdout.write(`  ${ui.dim('pnpm post n my-post -t "vue3,ts" -o  # 创建文章并用 VS Code 打开')}\n`)
  process.stdout.write(`  ${ui.dim('pnpm post l                          # 列出所有文章')}\n`)
  process.stdout.write(`  ${ui.dim('pnpm post u my-post -T "新标题" -y     # 更新元数据')}\n`)
  process.stdout.write(`  ${ui.dim('pnpm post s                          # 启动开发服务器')}\n`)
  process.stdout.write(`  ${ui.dim('pnpm post p draft-post               # 发布草稿')}\n`)
  process.stdout.write(`  ${ui.dim('pnpm post d                          # 一键部署到 GitHub Pages')}\n\n`)
  process.stdout.write(`${ui.bold('命令')}\n`)
  for (const c of COMMANDS) {
    process.stdout.write(`  ${ui.cyan(c.name.padEnd(24))} ${c.desc}\n`)
  }
  blank()
  process.stdout.write(`${ui.dim('提示：所有写入操作落盘后，VitePress HMR 会自动捕获，无需重启 dev server。')}\n`)
  process.stdout.write(`${ui.dim('简写：n=new / u=update / p=publish / d=deploy / l=list / r=read / s=serve / c=clean')}\n`)
  blank()
}

export function printCommandHelp(target) {
  if (!(target in COMMAND_DETAILS)) {
    process.stdout.write(`${ui.yellow(`未知命令: ${target}`)}\n\n`)
    printHelp()
    return
  }
  process.stdout.write(COMMAND_DETAILS[target] + '\n')
}
