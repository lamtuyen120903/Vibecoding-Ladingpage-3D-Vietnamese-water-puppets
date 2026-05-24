import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // Split heavy 3rd-party libs out of the main bundle so the initial
        // payload is small and the 3D code can be cached separately.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('three/examples')) return 'three-extras'
          if (id.includes('/three/') || id.endsWith('/three')) return 'three-core'
          if (id.includes('@react-three/postprocessing') || id.includes('/postprocessing/')) return 'three-post'
          if (id.includes('@react-three/')) return 'three-fiber'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
        },
      },
    },
  },
})
