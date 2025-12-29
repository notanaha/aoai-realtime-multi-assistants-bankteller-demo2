import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        customer: './customer.html'
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
})
