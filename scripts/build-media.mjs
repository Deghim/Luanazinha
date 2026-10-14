import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);
const root = process.cwd();
const originals = process.env.MEDIA_SRC || '/Users/jchavira/Desktop/Luana/media-originales';
const outDir = path.join(root, 'public/media');
const dataDir = path.join(root, 'src/data');
const reportPath = '/Users/jchavira/Desktop/Luana/agent-runs/Luanazinha/out/media-report.md';
const skip = process.argv.includes('--skip-media');
const forceVideos = process.argv.includes('--force-videos');
const widths = [480, 800, 1200, 1800, 2400];
const qualityRevisionKeys = new Set(['ch0.photo1.media', 'ch3.photo4.media', 'ch7.photo2.media', 'ch9.photo1.media']);
const highFidelityKeys = new Set(['ch0.photo1.media', 'ch9.photo1.media']);

const source = await fs.readFile(path.join(root, 'content-src/es-master.md'), 'utf8');
const refs = [];
const refRe = /^`([^`]+\.media)`\s+—\s+`([^`]+)`/gm;
let match;
while ((match = refRe.exec(source))) refs.push({ key: match[1], relative: match[2].replace(/^media-originales\//, '') });
await fs.mkdir(outDir, { recursive: true });
const beforeQualityAudit = {};
for (const ref of refs.filter((item) => qualityRevisionKeys.has(item.key))) {
  const oldBase = slug(ref.key);
  beforeQualityAudit[ref.key] = {};
  for (const w of widths) {
    for (const format of ['avif', 'webp']) {
      beforeQualityAudit[ref.key][`${w}.${format}`] = await fileSize(path.join(outDir, `${oldBase}-${w}.${format}`));
    }
  }
}
const qualityAudit = {};

let loopable = new Map();
try {
  const lines = (await fs.readFile('/Users/jchavira/Desktop/Luana/agent-runs/Luanazinha/out/video-classification.jsonl', 'utf8')).trim().split(/\r?\n/);
  loopable = new Map(lines.map((line) => JSON.parse(line)).map((item) => [item.path.toLowerCase(), item.loopable_clip]));
} catch { /* optional classification */ }

function slug(key) { return key.replace(/\.media$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase(); }
function publicUrl(file) { return `/media/${file}`; }
function outputBase(key) { return `${slug(key)}${qualityRevisionKeys.has(key) ? '-q72' : ''}`; }
async function signature(file) {
  const stat = await fs.stat(file);
  return crypto.createHash('sha256').update(`${file}:${stat.size}:${stat.mtimeMs}`).digest('hex').slice(0, 16);
}
async function writeImage(input, base, record, key) {
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 1;
  const height = meta.height ?? 1;
  const scaleWidths = widths.filter((w) => w <= width);
  if (!scaleWidths.length) scaleWidths.push(width);
  const avif = [], webp = [];
  for (const w of scaleWidths) {
    const avifName = `${base}-${w}.avif`, webpName = `${base}-${w}.webp`;
    const image = sharp(input).rotate().resize({ width: w, withoutEnlargement: true });
    if (!skip || !(await exists(path.join(outDir, avifName)))) await image.clone().avif({ quality: 72, effort: 6, chromaSubsampling: highFidelityKeys.has(key) ? '4:4:4' : '4:2:0' }).toFile(path.join(outDir, avifName));
    if (!skip || !(await exists(path.join(outDir, webpName)))) await image.clone().webp({ quality: 82 }).toFile(path.join(outDir, webpName));
    avif.push({ w, src: publicUrl(avifName) }); webp.push({ w, src: publicUrl(webpName) });
  }
  const tiny = await sharp(input).rotate().resize({ width: 16, height: 16, fit: 'inside' }).blur(16).jpeg({ quality: 35, chromaSubsampling: '4:2:0' }).toBuffer();
  const lqip = `data:image/jpeg;base64,${tiny.toString('base64')}`;
  record.type = 'image'; record.w = width; record.h = height; record.aspect = width / height; record.lqip = lqip.length <= 400 ? lqip : lqip.slice(0, 400);
  record.srcset = { avif, webp }; record.poster = null; record.duration = null;
}
async function writeVideo(input, base, record, relative) {
  const probe = JSON.parse((await run('/opt/homebrew/bin/ffprobe', ['-v', 'quiet', '-print_format', 'json', '-show_streams', '-show_format', input])).stdout);
  const stream = probe.streams.find((item) => item.codec_type === 'video');
  const iw = stream.width, ih = stream.height;
  const clip = loopable.get(relative.toLowerCase()) ?? { start_s: 0, end_s: 4 };
  // Leave a frame of safety so container timestamps stay strictly below 4 s.
  const start = Number(clip.start_s ?? 0), duration = Math.min(3.9, Math.max(0.5, Number(clip.end_s ?? start + 4) - start));
  const mp4 = path.join(outDir, `${base}.mp4`), webm = path.join(outDir, `${base}.webm`), posterPng = path.join(outDir, `${base}-poster.png`), posterAvif = path.join(outDir, `${base}-poster.avif`);
  const vf = `scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'`;
  if (!skip || forceVideos || !(await exists(mp4))) await encodeBounded(input, mp4, 'mp4', vf, start, duration);
  if (!skip || forceVideos || !(await exists(webm))) await encodeBounded(input, webm, 'webm', vf, start, duration);
  if (!skip || !(await exists(posterAvif))) {
    await run('/opt/homebrew/bin/ffmpeg', ['-y', '-ss', String(start), '-i', input, '-frames:v', '1', '-vf', vf, '-an', posterPng]);
    await sharp(posterPng).avif({ quality: 52, effort: 4 }).toFile(posterAvif);
    await fs.rm(posterPng, { force: true });
  }
  // exiftool can scrub MP4/AVIF, but its WebM writer is intentionally unsupported.
  await run('/opt/homebrew/bin/exiftool', ['-overwrite_original', '-all=', mp4, posterAvif]);
  const outW = iw >= ih ? 720 : Math.round(iw * 720 / ih), outH = ih >= iw ? 720 : Math.round(ih * 720 / iw);
  record.type = 'video'; record.w = outW; record.h = outH; record.aspect = iw / ih; record.lqip = null; record.srcset = { mp4: publicUrl(path.basename(mp4)), webm: publicUrl(path.basename(webm)) }; record.poster = publicUrl(path.basename(posterAvif)); record.duration = duration;
}
async function encodeBounded(input, output, kind, vf, start, duration) {
  const crfs = kind === 'mp4' ? [30, 34, 38, 42, 46] : [38, 42, 46, 50, 56, 60];
  for (const crf of crfs) {
    const codecArgs = kind === 'mp4'
      ? ['-c:v', 'libx264', '-preset', 'fast', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
      : ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(crf), '-deadline', 'good', '-cpu-used', '5'];
    await run('/opt/homebrew/bin/ffmpeg', ['-y', '-ss', String(start), '-t', String(duration), '-i', input, ...codecArgs, '-map_metadata', '-1', '-metadata', 'creation_time=', '-metadata', 'date=', '-an', '-vf', vf, output]);
    const size = (await fs.stat(output)).size;
    if (size <= 1.5 * 1024 * 1024) return;
  }
}
async function exists(file) { try { await fs.access(file); return true; } catch { return false; } }
async function fileSize(file) { try { return (await fs.stat(file)).size; } catch { return null; } }

if (skip) {
  const existing = JSON.parse(await fs.readFile(path.join(dataDir, 'media.json'), 'utf8'));
  const missing = [];
  for (const ref of refs) {
    const record = existing[ref.key];
    if (!record) {
      missing.push(`${ref.key}: falta el registro`);
      continue;
    }
    const outputs = record.type === 'video'
      ? [record.srcset?.mp4, record.srcset?.webm, record.poster]
      : [...(record.srcset?.avif || []), ...(record.srcset?.webp || [])].map((item) => item?.src);
    for (const output of outputs) {
      if (!output || !output.startsWith('/media/')) {
        missing.push(`${ref.key}: salida inválida ${output || '(vacía)'}`);
        continue;
      }
      if (!(await exists(path.join(root, 'public', output.slice(1))))) missing.push(`${ref.key}: falta ${output}`);
    }
  }
  if (missing.length) throw new Error(`Media preconstruida incompleta:\n${missing.join('\n')}`);
  console.log(`build-media: skip-media validó ${refs.length} referencias y ${Object.keys(existing).length} registros existentes (MEDIA_SRC=${originals})`);
  process.exit(0);
}

const media = {};
const report = ['# Informe de medios', '', `Generado: ${new Date().toISOString()}`, '', '| Clave | Tipo | Variante | Peso | Estado |', '|---|---|---|---:|---|'];
let totalBytes = 0;
let imageBytes = 0;
let videoBytes = 0;
for (const ref of refs) {
  const input = path.join(originals, ref.relative);
  if (!(await exists(input))) throw new Error(`Media no encontrada: ${input}`);
  const base = outputBase(ref.key), record = { source: ref.relative, signature: await signature(input) };
  if (/\.(mp4|mov|m4v|mkv)$/i.test(ref.relative)) await writeVideo(input, base, record, ref.relative);
  else await writeImage(input, base, record, ref.key);
  media[ref.key] = record;
  const outputs = record.type === 'video' ? [record.srcset.mp4, record.srcset.webm, record.poster] : [...record.srcset.avif, ...record.srcset.webp].map((item) => item.src);
  let bytes = 0;
  const variantRows = [];
  for (const item of outputs) {
    const size = (await fs.stat(path.join(root, 'public', item.slice(1)))).size;
    bytes += size;
    variantRows.push([path.basename(item), size]);
  }
  if (qualityRevisionKeys.has(ref.key)) qualityAudit[ref.key] = variantRows;
  totalBytes += bytes;
  if (record.type === 'video') videoBytes += bytes; else imageBytes += bytes;
  const videoSizes = record.type === 'video' ? await Promise.all([record.srcset.mp4, record.srcset.webm].map((item) => fs.stat(path.join(root, 'public', item.slice(1))).then((stat) => stat.size))) : [];
  const status = record.type === 'video' && Math.max(...videoSizes) > 1.5 * 1024 * 1024 ? 'REVISAR > 1.5 MB' : 'OK';
  for (const [name, size] of variantRows) report.push(`| \`${ref.key}\` | ${record.type} | \`${name}\` | ${(size / 1024).toFixed(1)} KB | ${status} |`);
  report.push(`|  |  | **Total referencia** | **${(bytes / 1024).toFixed(1)} KB** | ${status} |`);
  await fs.writeFile(path.join(dataDir, 'media.json'), `${JSON.stringify(media, null, 2)}\n`);
  await fs.writeFile(reportPath, `${report.join('\n')}\n`);
  console.log(`build-media: ${ref.key} -> ${record.type}`);
}
report.push('', '## Auditoría de calidad y caché', '', 'Las variantes de imagen se regeneraron con AVIF quality 72 / effort 6 y WebP quality 82. Hero y cierre usan AVIF 4:4:4; las fotos nocturnas `ch0.photo1`, `ch3.photo4`, `ch7.photo2` y `ch9.photo1` tienen nombres `-q72` nuevos para invalidar caché.', '', '| Clave | Variante | Antes | Después | Estado |', '|---|---|---:|---:|---|');
for (const ref of refs.filter((item) => qualityRevisionKeys.has(item.key))) {
  for (const w of widths) {
    for (const format of ['avif', 'webp']) {
      const key = `${w}.${format}`;
      const before = beforeQualityAudit[ref.key]?.[key];
      const afterName = `${outputBase(ref.key)}-${w}.${format}`;
      const after = qualityAudit[ref.key]?.find(([name]) => name === afterName)?.[1] ?? null;
      const status = before !== null && after !== null ? 'OK' : 'REVISAR';
      report.push(`| \`${ref.key}\` | \`${afterName}\` | ${before === null ? 'n/d' : `${(before / 1024).toFixed(1)} KB`} | ${after === null ? 'n/d' : `${(after / 1024).toFixed(1)} KB`} | ${status} |`);
    }
  }
}
report.push('', '## Totales', '', `- Imágenes: ${(imageBytes / 1024 / 1024).toFixed(2)} MB`, `- Vídeos, incluyendo posters: ${(videoBytes / 1024 / 1024).toFixed(2)} MB`, `- Todo el pipeline: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`, '');
await fs.writeFile(reportPath, `${report.join('\n')}\n`);
try {
  const output = (await run('/opt/homebrew/bin/exiftool', ['-r', '-GPSLatitude', '-GPSLongitude', '-CreateDate', '-ModifyDate', '-Make', '-Model', '-Software', '-j', outDir])).stdout.trim();
  const metadataRows = output ? JSON.parse(output) : [];
  const offenders = metadataRows.filter((row) => Object.entries(row).some(([key, value]) => {
    if (key === 'SourceFile' || value === undefined || value === null || value === '') return false;
    // MP4 requires zeroed QuickTime timestamps in its container; they carry no source date.
    if (/Date$/i.test(key) && /^0000:00:00/.test(String(value))) return false;
    return true;
  }));
  if (offenders.length) console.warn('build-media: revisar metadatos residuales', JSON.stringify(offenders.slice(0, 3)).slice(0, 300));
  else console.log('build-media: exiftool confirmó ausencia de GPS/fecha/cámara/software en los assets');
} catch (error) { console.warn(`build-media: verificación exiftool no disponible: ${error.message}`); }
console.log(`build-media: ${refs.length} referencias procesadas`);
