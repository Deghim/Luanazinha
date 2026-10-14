import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'http://127.0.0.1:4321';
const base = process.env.SITE_BASE || '/';

export default defineConfig({
  output: 'static',
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' }
});
