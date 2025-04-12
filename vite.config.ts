import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/flag_simu2/', // GitHubリポジトリ名を設定
  server: {
    host: '0.0.0.0', // コンテナ内部からのアクセスを許可
    port: 5173,
    watch: {
      usePolling: true, // Dockerでのホットリロードのため
    }
  }
})