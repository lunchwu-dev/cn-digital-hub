import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * 让 dist/index.html 可以「双击直接打开」。
 * 默认 Vite 产出 type="module" 的 script，在 file:// 下会被 CORS 拦死；
 * 这里配合 rollupOptions.output.format = 'iife' 一并处理。
 */
function offlineFriendlyHtml() {
  return {
    name: 'offline-friendly-html',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler: (html) =>
        html
          .replace(/<script type="module" crossorigin([^>]*)>/g, '<script defer$1>')
          .replace(/<script type="module"([^>]*)>/g, '<script$1>')
          .replace(/ crossorigin(?=[\s>])/g, ''),
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), offlineFriendlyHtml()],
  build: {
    target: 'es2018',
    chunkSizeWarningLimit: 1200,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
