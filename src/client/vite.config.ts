import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Dynamic backend port detection
function getBackendPort(): number {
  try {
    const portConfigPath = path.resolve(__dirname, '../../port-config.json');
    if (fs.existsSync(portConfigPath)) {
      const config = JSON.parse(fs.readFileSync(portConfigPath, 'utf8'));
      return config.port || 8765;
    }
  } catch (e) {
    console.warn('Could not read port config, using default port 8765');
  }
  return 8765;
}

const backendPort = getBackendPort();
console.log(`Vite proxy configured for backend port: ${backendPort}`);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('API proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying API request:', req.method, req.url, `-> http://localhost:${backendPort}${req.url}`);
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          icons: ['lucide-react'],
          utils: ['dayjs', 'clsx']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'dayjs']
  }
})