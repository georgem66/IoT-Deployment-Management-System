import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3001,
      proxy: {
        '/api': {
          target: isProduction ? 'http://backend:3000' : 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
})