import { defineConfig,splitVendorChunkPlugin } from 'vite'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  optimizeDeps: {
    // exclude: ['lodash-es']  // 在预构建中强制排除的依赖项。
  },
  plugins: [splitVendorChunkPlugin(),viteCompression(),visualizer()],
})