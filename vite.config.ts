import react from '@vitejs/plugin-react'
import { promises as fs } from 'fs'
import { getLastCommit } from 'git-last-commit'
import jotaiDebugLabel from 'jotai/babel/plugin-debug-label'
import jotaiReactRefresh from 'jotai/babel/plugin-react-refresh'
import path from 'node:path'
import { visualizer } from 'rollup-plugin-visualizer'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vite'
import type { PluginOption } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const latestCommitHash = await new Promise<string>((resolve) => {
    return getLastCommit((err, commit) => (err ? 'unknown' : resolve(commit.shortHash)))
  })
  return {
    // ✅ 子路径部署，仓库名前后斜杠保留不动，正确
    base: '/qwerty-learner/',
    plugins: [
      react({ babel: { plugins: [jotaiDebugLabel, jotaiReactRefresh] } }),
      visualizer() as PluginOption,
      Icons({
        compiler: 'jsx',
        jsx: 'react',
        customCollections: {
          'my-icons': {
            xiaohongshu: () => fs.readFile('./src/assets/xiaohongshu.svg', 'utf-8'),
          },
        },
      }),
    ],
    build: {
      minify: true,
      // ========== 修改1：输出目录同步Action里的 ./dist ==========
      outDir: 'dist',
      sourcemap: false,
    },
    esbuild: {
      drop: mode === 'development' ? [] : ['console', 'debugger'],
    },
    define: {
      // ========== 修改2：VITE_DEPLOY_ENV=pages 替换为 VITE_DEPLOY_ENV ==========
      VITE_DEPLOY_ENV: JSON.stringify(process.env.VITE_DEPLOY_ENV),
      LATEST_COMMIT_HASH: JSON.stringify(latestCommitHash + (process.env.NODE_ENV === 'production' ? '' : ' (dev)')),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
  }
})
