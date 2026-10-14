import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const dist = path.join(root, 'dist');
const out = '/Users/jchavira/Desktop/Luana/agent-runs/Luanazinha/out/build-report.md';
const budget = 150 * 1024;
const configuredBase = process.env.SITE_BASE || '/';
const basePrefix = configuredBase === '/' ? '' : configuredBase.replace(/^\/+/, '').replace(/\/+$/, '') + '/';

function distAssetPath(ref) {
  const clean = ref.replace(/^\/+/, '');
  const relative = basePrefix && clean.startsWith(basePrefix) ? clean.slice(basePrefix.length) : clean;
  return path.join(dist, relative);
}

async function gzipSize(file) {
  return gzipSync(await fs.readFile(file), { level: 9 }).length;
}

function routeFile(route) {
  return route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html');
}

function assetRefs(html, tag, attribute) {
  const pattern = new RegExp(`<${tag}[^>]+${attribute}=["']([^"']+)["'][^>]*>`, 'gi');
  return [...html.matchAll(pattern)].map((match) => match[1]).filter((src) => src.startsWith('/'));
}

async function assetGzipTotal(refs) {
  let total = 0;
  for (const ref of refs) total += await gzipSize(distAssetPath(ref));
  return total;
}

async function inlineScriptGzip(html) {
  const scripts = [...html.matchAll(/<script(?![^>]+src=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  return scripts.reduce((total, script) => total + gzipSync(Buffer.from(script), { level: 9 }).length, 0);
}

const routes = ['/', '/en/', '/pt/', '/zh/'];
const rows = [];
for (const route of routes) {
  const file = routeFile(route);
  const html = await fs.readFile(file, 'utf8');
  const htmlGzip = await gzipSize(file);
  const cssGzip = await assetGzipTotal(assetRefs(html, 'link', 'href').filter((ref) => ref.endsWith('.css')));
  const jsGzip = (await assetGzipTotal(assetRefs(html, 'script', 'src'))) + await inlineScriptGzip(html);
  const total = htmlGzip + cssGzip + jsGzip;
  rows.push({ route, htmlGzip, cssGzip, jsGzip, total, status: total <= budget ? 'OK' : 'REVISAR' });
}

const lazyFiles = [];
async function collectJs(dir, prefix = '') {
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await collectJs(file, `${prefix}${entry.name}/`);
    else if (entry.name.endsWith('.js')) lazyFiles.push({ name: `${prefix}${entry.name}`, path: file, bytes: await gzipSize(file) });
  }
}
await collectJs(path.join(dist, 'scripts'), 'scripts/');
await collectJs(path.join(dist, '_astro'), '_astro/');

const mediaData = JSON.parse(await fs.readFile(path.join(root, 'src/data/media.json'), 'utf8'));
const heroRecord = mediaData['ch0.photo1.media'];
const heroNames = [...heroRecord.srcset.avif, ...heroRecord.srcset.webp].map((item) => item.src.slice('/media/'.length));
const heroLcpName = heroRecord.srcset.avif.find((item) => item.w === 1200)?.src.slice('/media/'.length);
const heroRows = [];
for (const name of heroNames) {
  const bytes = (await fs.stat(path.join(root, 'public/media', name))).size;
  heroRows.push({ name, bytes, status: name === heroLcpName && bytes <= 120 * 1024 ? 'OK · LCP' : bytes <= 120 * 1024 ? 'OK' : 'responsive-only > 120 KB' });
}

const lines = [
  '# Build report',
  '',
  `Generado: ${new Date().toISOString()}`,
  '',
  '## Peso inicial por página',
  '',
  '| Ruta | HTML gz | CSS gz | JS gz | Total sin hero | Estado |',
  '|---|---:|---:|---:|---:|---|',
  ...rows.map((row) => `| \`${row.route}\` | ${(row.htmlGzip / 1024).toFixed(1)} KB | ${(row.cssGzip / 1024).toFixed(1)} KB | ${(row.jsGzip / 1024).toFixed(1)} KB | ${(row.total / 1024).toFixed(1)} KB | ${row.status} |`),
  '',
  `Presupuesto inicial sin hero: ≤ ${(budget / 1024).toFixed(0)} KB gz.`,
  '',
  '## JavaScript inicial y módulos',
  '',
  '| Archivo | Peso gz | Estado |',
  '|---|---:|---|',
  ...lazyFiles.map((file) => `| \`${file.name}\` | ${(file.bytes / 1024).toFixed(1)} KB | ${file.bytes <= 20 * 1024 ? 'OK · chunk ≤20 KB' : 'REVISAR'} |`),
  '',
  'El módulo `chrome.js` es la única carga inicial; `media.js` se importa al acercarse a capítulo 1.',
  '',
  '## Hero ch0-photo1',
  '',
  '| Variante | Peso | Estado |',
  '|---|---:|---|',
  ...heroRows.map((row) => `| \`${row.name}\` | ${(row.bytes / 1024).toFixed(1)} KB | ${row.status} |`),
  '',
  'El presupuesto de carga inicial usa el AVIF de 1200 px como hero LCP; las variantes grandes quedan para `srcset` responsive.',
];
await fs.writeFile(out, `${lines.join('\n')}\n`);
console.log(`build-report: ${rows.length} páginas y ${heroRows.length} variantes listadas en ${out}`);
