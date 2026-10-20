import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

const LIVE_ORIGIN = 'https://globeflight.co.ke';
const LIVE_API = `${LIVE_ORIGIN}/admin/api`;

function localAdminProxy() {
  return {
    name: 'local-admin-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/admin') || url.startsWith('/admin/api')) {
          return next();
        }

        try {
          const upstream = await fetch(`${LIVE_ORIGIN}${url}`, {
            headers: {
              accept: req.headers.accept || '*/*',
              'user-agent': req.headers['user-agent'] || 'Mozilla/5.0',
            },
          });
          const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
          let body = Buffer.from(await upstream.arrayBuffer());

          if (/javascript|html|json|text/.test(contentType)) {
            body = Buffer.from(body.toString('utf8').replaceAll(LIVE_API, '/admin/api'));
          }

          res.statusCode = upstream.status;
          res.setHeader('content-type', contentType);
          res.end(body);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [localAdminProxy(), react()],
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
        target: LIVE_ORIGIN,
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://globeflight.co.ke',
        changeOrigin: true,
        secure: true,
      },
    },
  }
});

