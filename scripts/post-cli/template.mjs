/**
 * 文章正文模板（frontmatter 之外的 Markdown 内容）
 * 提供良好的开篇骨架，便于作者直接填充。
 */

export function buildBody({ title, slug, tags }) {
  const tagList = (tags || []).map((t) => `#${t}`).join(' ')
  const tagLine = tagList ? `> **标签**：${tagList}\n> **创建时间**：{{TODAY}}\n> **最后更新**：{{TODAY}}\n\n` : ''

  return `# ${title}

${tagLine}## 一、概述

> 用 1-2 句话说明本文要解决的问题、面向读者与核心结论。

## 二、背景

> 介绍相关概念、前置知识与本文的切入点。

## 三、实践

> 核心内容：示例代码、架构图、表格等。

\`\`\`ts
// 示例代码
export function hello(name: string): string {
  return \`Hello, \${name}\`
}
\`\`\`

## 四、总结

> 复盘要点，给出可执行的行动建议或延伸阅读。

---

**文章 slug**: \`${slug}\`
**最后更新**: \`{{TODAY}}\`
`
}
