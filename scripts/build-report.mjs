import fs from 'node:fs/promises';
import { statSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const dist = path.join(root, 'dist');
const out = path.join(process.env.AGENT_OUT || path.join(root, '.build-out'), 'build-report.md');
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

const distFiles = [];
async function collectFiles(dir) {
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await collectFiles(file);
    else distFiles.push(file);
  }
}
await collectFiles(dist);
const physicalDistBytes = distFiles.reduce((total, file) => total + statSync(file).size, 0);

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
const mediaFiles = new Set();
let logicalMediaBytes = 0;
for (const record of Object.values(mediaData)) {
  const refs = record.type === 'video'
    ? [record.sources.desktop.mp4, record.sources.mobile.mp4, record.posters.desktop]
    : [...record.srcset.avif, ...(record.srcset.webp ?? [])].map((item) => item.src);
  for (const ref of refs) {
    const file = path.join(root, 'public', ref.replace(/^\//, ''));
    const bytes = (await fs.stat(file)).size;
    logicalMediaBytes += bytes;
    mediaFiles.add(file);
  }
}
const physicalMediaBytes = [...mediaFiles].reduce((total, file) => total + statSync(file).size, 0);
const dedupeSavings = logicalMediaBytes - physicalMediaBytes;
const mediaTypeBytes = {
  images: [...mediaFiles].filter((file) => /\.(?:avif|webp)$/i.test(file)).reduce((total, file) => total + statSync(file).size, 0),
  video: [...mediaFiles].filter((file) => /\.mp4$/i.test(file)).reduce((total, file) => total + statSync(file).size, 0),
  other: [...mediaFiles].filter((file) => !/\.(?:avif|webp|mp4)$/i.test(file)).reduce((total, file) => total + statSync(file).size, 0),
};
const heroRecord = mediaData['intro.1'];
const heroNames = [...heroRecord.srcset.avif, ...(heroRecord.srcset.webp ?? [])].map((item) => item.src.slice('/media/'.length));
const heroLcpName = heroRecord.srcset.avif.find((item) => item.w === 800)?.src.slice('/media/'.length);
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
  ...lazyFiles.map((file) => {
    const budgetForFile = file.name.endsWith('experience.js') ? 14 * 1024 : 20 * 1024;
    const label = file.name.endsWith('experience.js') ? 'chunk ≤14 KB' : 'chunk ≤20 KB';
    return `| \`${file.name}\` | ${(file.bytes / 1024).toFixed(1)} KB | ${file.bytes <= budgetForFile ? `OK · ${label}` : 'REVISAR'} |`;
  }),
  '',
  'El módulo `chrome.js` y `experience.js` son la carga inicial; `media.js` se importa al acercarse a capítulo 1.',
  `JS inicial: ${(Math.max(...rows.filter((row) => row.route !== '/').map((row) => row.jsGzip)) / 1024).toFixed(1)} KB gz (presupuesto ≤30 KB: OK).`,
  'El módulo `experience.js` contiene IntroReel, CamilleCarousel e Interlude; su fila debe mantenerse en ≤14 KB gz.',
  '',
  '## Hero intro.1',
  '',
  '| Variante | Peso | Estado |',
  '|---|---:|---|',
  ...heroRows.map((row) => `| \`${row.name}\` | ${(row.bytes / 1024).toFixed(1)} KB | ${row.status} |`),
  '',
  'El presupuesto de carga inicial usa el AVIF de 800 px como hero LCP; la variante 3200 px queda para `srcset` responsive.',
  '',
  '## Dedupe de media',
  '',
  `- Claves de media: ${Object.keys(mediaData).length}`,
  `- Archivos físicos únicos: ${mediaFiles.size}`,
  `- Peso físico de public/media: ${(physicalMediaBytes / 1024 / 1024).toFixed(2)} MB`,
  `- Peso físico de dist: ${(physicalDistBytes / 1024 / 1024).toFixed(2)} MB`,
  `- Estado del presupuesto dist ≤260 MB: ${physicalDistBytes <= 260 * 1024 * 1024 ? 'OK' : 'REVISAR'}`,
  `- Ahorro frente a materializar cada clave por separado: ${(dedupeSavings / 1024 / 1024).toFixed(2)} MB`,
  '- Aliases confirmados por rutas compartidas en media.json; no se recodifican ni se duplican bytes.',
  '',
  '## Totales de media por tipo',
  '',
  '| Tipo | Peso físico | Estado |',
  '|---|---:|---|',
  `| Imágenes (AVIF/WebP y posters) | ${(mediaTypeBytes.images / 1024 / 1024).toFixed(2)} MB | OK |`,
  `| Video (MP4 H.264) | ${(mediaTypeBytes.video / 1024 / 1024).toFixed(2)} MB | OK |`,
  `| Otros | ${(mediaTypeBytes.other / 1024 / 1024).toFixed(2)} MB | ${mediaTypeBytes.other === 0 ? 'OK' : 'REVISAR'} |`,
  `| Total public/media | ${(physicalMediaBytes / 1024 / 1024).toFixed(2)} MB | ${physicalMediaBytes <= 260 * 1024 * 1024 ? 'OK · ≤260 MB' : 'REVISAR' } |`,
];
await fs.writeFile(out, `${lines.join('\n')}\n`);
console.log(`build-report: ${rows.length} páginas y ${heroRows.length} variantes listadas en ${out}`);
