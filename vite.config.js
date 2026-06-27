import { defineConfig } from 'vite';

// base:'./' = 静的ホスティング/GitHub Pages でもそのまま開ける相対パス
export default defineConfig({
  base: './',
  // PORT 環境変数があればそれを使う（プレビューツールが割り当てるポートに従う）
  server: { host: true, port: process.env.PORT ? Number(process.env.PORT) : 5173 },
  build: { target: 'es2019' },
});
