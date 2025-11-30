import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    https: {
      key: './localhost-key.pem',
      cert: './localhost-cert.pem',
    },
    host: true,
    port: 5173,
    hmr: {
      port: 5172,
    },
    proxy: {
      // Proxy configuration object
      '/auth': {
        target: 'http://localhost:3002', // The address of your backend server
        changeOrigin: true, // Needed for virtual hosting
        rewrite: (path) => path.replace(/^\/auth/, '/auth'), // Optional: Rewrite the path
        secure: false, // Set to true if your target is HTTPS
      },
      '/api': {
        target: 'http://localhost:3002', // The address of your backend server
        changeOrigin: true, // Needed for virtual hosting
        secure: false, // Set to true if your target is HTTPS
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        login: path.resolve(__dirname, 'login.html')
      }
    }
  }
})
