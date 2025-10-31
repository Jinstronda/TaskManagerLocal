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
  // Assets served from root - Express handles both / and /resources/app/ paths
  base: '/',
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
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react'
          }
          // Router
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router'
          }
          // Charts - split into separate chunk
          if (id.includes('node_modules/recharts')) {
            return 'charts'
          }
          // Icons - lazy loaded with pages
          if (id.includes('node_modules/lucide-react')) {
            return 'icons'
          }
          // State management
          if (id.includes('node_modules/zustand')) {
            return 'vendor-state'
          }
          // Utilities
          if (id.includes('node_modules/dayjs') || id.includes('node_modules/clsx')) {
            return 'utils'
          }
          // All other node_modules
          if (id.includes('node_modules')) {
            return 'vendor-misc'
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 600,
    assetsInlineLimit: 4096
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'dayjs', 'react-router-dom'],
    exclude: ['recharts']
  }
})