import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { handleApiRequest } from './server/index.mjs'

/**
 * FilePress Blog GUI · Vite 配置
 *
 * - dev 端口 5173（与 VitePress dev 区分）
 * - API 通过本地中间件挂载，无需另开 5174 端口
 * - 共享根目录的 gray-matter 等依赖
 */

/**
 * 将本地 API 处理函数挂载到 Vite dev server 的中间件链。
 * 这样 `pnpm dev` 只需要启动一个进程就能同时提供 SPA 和 /api/* 接口。
 */
function filePressApiPlugin(): Plugin {
  return {
    name: 'filepress-api',
    apply: 'serve',
    configureServer(server) {
      // 任何 /api/* 请求都直接走我们的处理函数
      server.middlewares.use('/api', async (req, res) => {
        // Vite 的中间件会剥离 path 前缀，这里补回 /api
        const original = req.url ?? '/'
        req.url = '/api' + (original.startsWith('/') ? original : '/' + original)
        try {
          await handleApiRequest(req, res)
        } catch (e) {
          if (!res.writableEnded) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: false, error: e?.message ?? String(e) }))
          }
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [vue(), filePressApiPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true
  },
  preview: {
    port: 4174,
    host: '0.0.0.0',
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1200
  }
})
