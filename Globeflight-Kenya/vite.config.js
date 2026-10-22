import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import * as path from 'path';

const adminRoot = path.resolve(__dirname, 'public/admin');

function adminDashboard() {
  return {
    name: 'admin-dashboard',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = (req.url || '').split('?')[0];
        if (!raw.startsWith('/admin') || raw.startsWith('/admin/api')) return next();

        let relative = raw.replace(/^\/admin\/?/, '');
        try {
          relative = decodeURIComponent(relative);
        } catch {
          return next();
        }
        const filePath = path.resolve(adminRoot, relative);
        const rootPrefix = adminRoot.endsWith(path.sep) ? adminRoot : `${adminRoot}${path.sep}`;
        if (
          relative &&
          filePath.startsWith(rootPrefix) &&
          fs.existsSync(filePath) &&
          fs.statSync(filePath).isFile()
        ) {
          return next();
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(fs.readFileSync(path.join(adminRoot, 'index.html')));
      });
    },
  };
}

export default defineConfig({
  plugins: [adminDashboard(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // Correct alias path for '@'
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'utils': ['axios', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    proxy: {
      '/admin/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  }
});

