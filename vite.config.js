import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: '0.0.0.0' },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const path = id.replaceAll('\\', '/')
          if (!path.includes('/node_modules/')) return undefined
          if (path.includes('/@firebase/') || path.includes('/firebase/') || path.includes('/@grpc/')) return 'firebase-sdk'
          if (path.includes('/@tiptap/pm/')) return 'prosemirror'
          if (path.includes('/@tiptap/')) return 'tiptap-editor'
          if (path.includes('/@hocuspocus/') || path.includes('/y-prosemirror/') || path.includes('/y-protocols/') || path.includes('/yjs/')) return 'collaboration-core'
          return undefined
        },
      },
    },
  },
})
