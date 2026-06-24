import typography from '@tailwindcss/typography'

/**
 * Modern Editorial · 印刷级技术博客主题
 * 设计原则:
 *  - 95% 单色墨色 + 5% moss 苔藓深绿(单一克制强调色)
 *  - 禁用渐变、玻璃拟态、鼠标跟踪 spotlight 等"AI 味"动效
 *  - 保留 fade-up 入场,其他动画全部移除
 *  - 字体:Inter(主)+ 衬线 fallback(标题)+ JetBrains Mono(代码与编号)
 */
export default {
  darkMode: 'class',
  content: [
    './.vitepress/theme/**/*.{vue,ts}',
    './index.md',
    './about.md',
    './content/**/*.md'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['ui-serif', 'Iowan Old Style', 'Apple Garamond', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'monospace']
      },
      colors: {
        /* Ink · 墨色阶梯 */
        ink: {
          50:  '#f6f6f4',
          100: '#efefee',
          200: '#e5e5e5',
          300: '#c4c4c4',
          400: '#8a8a8a',
          500: '#6b6b6b',
          700: '#2a2a2a',
          900: '#0a0a0a'
        },
        /* Moss · 唯一强调色(苔藓深绿,印刷感) */
        moss: {
          500: '#266b51',
          600: '#1a4d3a',
          700: '#143a2c'
        }
      },
      boxShadow: {
        /* 弱化阴影,只保留悬停浮起时的极淡投影 */
        card: '0 1px 0 rgba(10, 10, 10, 0.04)',
        lift: '0 4px 12px -4px rgba(10, 10, 10, 0.08)'
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        'out-soft': 'cubic-bezier(0.16, 1, 0.3, 1)'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both'
      }
    }
  },
  plugins: [typography]
}
