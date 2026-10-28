import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
function loadSeo() {
  const seoPath = require.resolve('./scripts/seo-meta.cjs');
  delete require.cache[seoPath];
  return require(seoPath);
}

const adminRoot = path.resolve(__dirname, 'public/admin');

function skipStatusCheck(pathname) {
  return (
    pathname.startsWith('/@') ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/node_modules/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/__') ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

function markUnknownHtmlAs404(req, res, next) {
  const pathname = (req.url || '/').split('?')[0];
  const known = loadSeo().isKnownAppPath(pathname);
  if ((req.method !== 'GET' && req.method !== 'HEAD') || skipStatusCheck(pathname) || known) {
    return next();
  }
  const end = res.end;
  res.end = function forceMissingStatus(...args) {
    if (!res.headersSent) res.statusCode = 404;
    return end.apply(this, args);
  };
  next();
}

// Writes one HTML file per public address during build, and returns 404 for unknown addresses in dev.
function seoPages() {
  return {
    name: 'seo-pages',
    transformIndexHtml(html, ctx) {
      if (!ctx.server) return html;
      const seo = loadSeo();
      return seo.applySeo(html, seo.getSeo(ctx.originalUrl || '/'));
    },
    configureServer(server) {
      server.middlewares.use(markUnknownHtmlAs404);
    },
    configurePreviewServer(server) {
      server.middlewares.use(markUnknownHtmlAs404);
    },
    closeBundle() {
      if (this.meta && this.meta.watchMode) return;
      const seo = loadSeo();
      const distIndex = path.resolve(__dirname, 'dist/index.html');
      if (!fs.existsSync(distIndex)) return;
      const base = fs.readFileSync(distIndex, 'utf8');
      fs.writeFileSync(distIndex, seo.applySeo(base, seo.getSeo('/')));
      seo.prerenderPaths().forEach((route) => {
        if (route === '/') return;
        const parts = route.split('/').filter(Boolean);
        const file = path.resolve(__dirname, 'dist', ...parts, 'index.html');
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, seo.applySeo(base, seo.getSeo(route)));
      });
      fs.writeFileSync(path.resolve(__dirname, 'dist/404.html'), seo.applySeo(base, seo.notFound()));
    },
  };
}

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
  plugins: [seoPages(), adminDashboard(), react()],
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

