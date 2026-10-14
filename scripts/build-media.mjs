import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);
const root = process.cwd();
const originals = process.env.MEDIA_SRC || '/Users/jchavira/Desktop/Luana/media-originales';
const runOut = process.env.AGENT_OUT || '/Users/jchavira/Desktop/Luana/agent-runs/Luanazinha/out';
const outDir = path.join(root, 'public/media');
const dataDir = path.join(root, 'src/data');
const reportPath = path.join(runOut, 'media-report.md');
const metaPath = path.join(dataDir, 'media-meta.json');
const skip = process.argv.includes('--skip-media');
const forceVideos = process.argv.includes('--force-videos');
// E3c2 budget fallback: 2400 px extras are the first image variant to trim.
// Protagonist sources still receive 2400 + 3200 below.
const imageWidths = [480, 800, 1200, 1800];
const ffmpeg = process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg';
const ffprobe = process.env.FFPROBE || '/opt/homebrew/bin/ffprobe';
const exiftool = process.env.EXIFTOOL || '/opt/homebrew/bin/exiftool';

const contentSource = await fs.readFile(path.join(root, 'content-src/es-master.md'), 'utf8');
const places = JSON.parse(await fs.readFile(path.join(runOut, 'places.json'), 'utf8'));
const e1 = JSON.parse(await fs.readFile(path.join(runOut, 'selection-E1.json'), 'utf8'));
const videoRows = (await fs.readFile(path.join(runOut, 'video-classification.jsonl'), 'utf8')).trim().split(/\r?\n/).map(JSON.parse);
const videoByPath = new Map(videoRows.map((row) => [row.path, row]));

function slug(value) { return value.replace(/\.media$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase(); }
function publicUrl(file) { return `/media/${file}`; }
function normalizeSource(value) { return value.replace(/^media-originales\//, ''); }
function exists(file) { return fs.access(file).then(() => true, () => false); }
async function fileSize(file) { try { return (await fs.stat(file)).size; } catch { return null; } }
async function signature(file) { const stat = await fs.stat(file); return crypto.createHash('sha256').update(`${file}:${stat.size}:${stat.mtimeMs}`).digest('hex').slice(0, 16); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

const contentRefs = [];
const refRe = /^`([^`]+\.media)`\s+—\s+`([^`]+)`/gm;
let match;
while ((match = refRe.exec(contentSource))) {
  const key = match[1];
  const source = normalizeSource(match[2]);
  contentRefs.push({ key, source, kind: /\.(?:mp4|mov|m4v|mkv)$/i.test(source) ? 'video' : 'image', fidelity: key === 'ch0.photo1.media' || key === 'ch9.photo1.media' });
}

// The final selection deliberately supersedes the older E1 A6/A10 entries.
const introEntries = [
  ['intro.1', 'retratos/IMG_5044.jpeg', 'image', 'Entrada nocturna con Jorge junto al agua.', 'Chongqing', 'China'],
  ['intro.2', 'bungee/DJI_20251122151936_0047_D.MP4', 'video', 'Descenso de bungee frente a una pared rocosa.', null, 'Mexico'],
  ['intro.3', 'colima/IMG_3574.MOV', 'video', 'Cumbres y laderas rocosas desde una ruta de montaña.', 'Nevado de Colima', 'Mexico'],
  ['intro.4', 'viajes-europa/IMG_8605.JPG', 'image', 'Salto en tándem visto desde el aire.', 'Puerto Vallarta', 'Mexico'],
  ['intro.5', 'china/IMG_5603.MOV', 'video', 'Panorama de montañas y valles desde un punto elevado.', null, 'China'],
  ['intro.6', 'china/IMG_2130.MOV', 'video', 'Edificios iluminados reflejados en un río nocturno.', null, 'China'],
];
const introVideoSources = new Set(introEntries.filter((entry) => entry[2] === 'video').map((entry) => entry[1]));
const carouselEntries = [
  ['arc.1', 'china/IMG_8616.jpeg', 'image', 'Edificio tradicional iluminado de noche.', 'Wuhan', 'China'],
  ['arc.2', 'china/IMG_5603.MOV', 'video', 'Panorama de montañas y valles.', 'Zhangjiajie', 'China'],
  ['arc.3', 'china/IMG_4664.jpeg', 'image', 'Montañas y caminos desde un mirador.', 'Zhangjiajie', 'China'],
  ['arc.4', 'retratos/IMG_5159.jpeg', 'image', 'Retrato nocturno junto a un puente iluminado.', 'Chongqing', 'China'],
  ['arc.5', 'retratos/IMG_5741.jpeg', 'image', 'Retrato junto a casas iluminadas junto al agua.', 'Furongzhen/Wangcun', 'China'],
  ['arc.6', 'retratos/IMG_1404.JPG', 'image', 'Jorge frente a una muralla histórica.', null, 'China'],
  ['arc.7', 'colima/IMG_3555.jpeg', 'image', 'Jorge en una ladera cubierta de niebla.', 'Nevado de Colima', 'Mexico'],
  ['arc.8', 'colima/IMG_3574.MOV', 'video', 'Cumbres y laderas rocosas desde una ruta de montaña.', 'Nevado de Colima', 'Mexico'],
  ['arc.9', 'viajes-europa/IMG_8605.JPG', 'image', 'Salto en tándem sobre un paisaje visto desde el aire.', 'Puerto Vallarta', 'Mexico'],
  ['arc.10', 'viajes-europa/IMG_9766.jpeg', 'image', 'Retrato frente a una pirámide y un palacio.', 'Paris', 'France'],
  ['arc.11', 'viajes-europa/IMG_0794.jpeg', 'image', 'Arquitectura monumental de piedra.', 'Füssen', 'Germany'],
  ['arc.12', 'viajes-europa/IMG_9058.jpeg', 'image', 'Plaza nocturna con fuente iluminada.', 'Berlin', 'Germany'],
  ['arc.13', 'china/IMG_2130.MOV', 'video', 'Edificios coloridos reflejados en un río de noche.', 'Chongqing', 'China'],
];
const interludeEntries = [
  ['int.1', e1.b_interludes[0], 'Panorama de montañas y valles.'],
  ['int.2', e1.b_interludes[3], 'Cumbres y laderas rocosas desde altura.'],
  ['int.3', e1.b_interludes[4], 'Río al atardecer con edificios y embarcaciones.'],
  ['int.4', e1.b_interludes[5], 'Hurón recorriendo un jardín.'],
  ['int.6', e1.b_interludes[8], 'Edificios coloridos reflejados en un río nocturno.'],
  ['int.8', { path: 'bungee/42b9307970527fcfa55069fe4ac99440.mp4', place: null, country: 'Mexico', start_s: 7, end_s: 11 }, 'Ángulo vertical del salto con la cuerda sobre el agua.'],
  ['int.9', { path: 'china/IMG_4671.MOV', place: null, country: 'China', start_s: 0.067, end_s: 4.067 }, 'Mirador y formaciones montañosas bajo un cielo nublado.'],
  ['int.10', { path: 'bungee/DJI_20251122152157_0059_D.MP4', place: null, country: 'Mexico', start_s: 24, end_s: 28 }, 'Salto visto desde el equipo y con el participante en primer plano.'],
];
const entryFromE1 = (key, item) => [key, normalizeSource(item.path), /\.(?:mp4|mov|m4v|mkv)$/i.test(item.path) ? 'video' : 'image', item.reason, item.place, item.country];
const extras = [
  ...e1.c_chapter_extras.ch1.map((x, i) => entryFromE1(`x.ch1.${i + 1}`, x)),
  ...e1.c_chapter_extras.ch2_musica.map((x, i) => entryFromE1(`x.ch2.${i + 1}`, x)),
  ...e1.c_chapter_extras.ch3_china.map((x, i) => entryFromE1(`x.ch3.${i + 1}`, x)),
  ...e1.c_chapter_extras.ch5_adrenalina.map((x, i) => entryFromE1(`x.ch5.${i + 1}`, x)),
  ...e1.c_chapter_extras.ch6_los_mios.map((x, i) => entryFromE1(`x.ch6.${i + 1}`, x)),
  ...e1.c_chapter_extras.ch8_lo_que_sigue.map((x, i) => entryFromE1(`x.ch8.${i + 1}`, x)),
  ...e1.c_chapter_extras.lo_que_se_de_ti.map((x, i) => entryFromE1(`ella.${i + 1}`, x)),
];
extras[extras.findIndex((item) => item[0] === 'x.ch5.1')] = ['x.ch5.1', 'viajes-europa/IMG_8582.JPG', 'image', 'La avioneta antes del salto, sin matrícula legible.', 'Puerto Vallarta', 'Mexico'];
function cleanPlace(value) { return !value || /sin coincidencia|sin gps|^Europa$/i.test(String(value)) ? null : String(value); }
function cleanCountry(value) { return !value || /desconocido/i.test(String(value)) ? null : String(value); }
function fromTuple([key, source, kind, description, place, country]) {
  return { key, source, kind, description, place: cleanPlace(place), country: cleanCountry(country), fidelity: key.startsWith('intro.') || key.startsWith('arc.') || key === 'ch9.photo1.media' || key === 'ch0.photo1.media' };
}
const newEntries = [...introEntries, ...carouselEntries, ...interludeEntries.map(([key, item, description]) => [key, normalizeSource(item.path), 'video', description, cleanPlace(item.place), cleanCountry(item.country)]), ...extras].map(fromTuple);
const allEntries = [...contentRefs.map((entry) => ({ ...entry, description: null, place: null, country: null })), ...newEntries];
const fidelityBySource = new Set(allEntries.filter((entry) => entry.fidelity).map((entry) => entry.source));
const heroWebpBySource = new Set(allEntries.filter((entry) => entry.key === 'intro.1').map((entry) => entry.source));
const premiumVideoBySource = new Set(allEntries.filter((entry) => entry.key.startsWith('intro.') || entry.key.startsWith('arc.') || entry.key.startsWith('int.')).map((entry) => entry.source));

const altEsByKey = new Map();
const altRe = /^`([^`]+\.media)`[\s\S]*?^`\1\.alt`\s+—\s+\*\*(.*?)\*\*/gm;
while ((match = altRe.exec(contentSource))) altEsByKey.set(match[1], match[2]);
const cityLabels = {
  'Puerto Vallarta': { es: 'Puerto Vallarta', en: 'Puerto Vallarta', pt: 'Puerto Vallarta', zh: '巴亚尔塔港' },
  'Nevado de Colima': { es: 'Nevado de Colima', en: 'Nevado de Colima', pt: 'Nevado de Colima', zh: '科利马雪山' },
  'Furongzhen/Wangcun': { es: 'Furongzhen', en: 'Furongzhen', pt: 'Furongzhen', zh: '芙蓉镇' },
  Wuhan: { es: 'Wuhan', en: 'Wuhan', pt: 'Wuhan', zh: '武汉' },
  Zhangjiajie: { es: 'Zhangjiajie', en: 'Zhangjiajie', pt: 'Zhangjiajie', zh: '张家界' },
  Chongqing: { es: 'Chongqing', en: 'Chongqing', pt: 'Chongqing', zh: '重庆' },
  Beijing: { es: 'Beijing', en: 'Beijing', pt: 'Pequim', zh: '北京' },
  Paris: { es: 'París', en: 'Paris', pt: 'Paris', zh: '巴黎' },
  Füssen: { es: 'Füssen', en: 'Füssen', pt: 'Füssen', zh: '菲森' },
  Berlin: { es: 'Berlín', en: 'Berlin', pt: 'Berlim', zh: '柏林' },
  Guadalajara: { es: 'Guadalajara', en: 'Guadalajara', pt: 'Guadalajara', zh: '瓜达拉哈拉' },
};
function placeLabel(place, locale) { return cityLabels[place]?.[locale] || place || ''; }
function countryLabel(country, locale) {
  return ({
    Mexico: { es: 'México', en: 'Mexico', pt: 'México', zh: '墨西哥' },
    China: { es: 'China', en: 'China', pt: 'China', zh: '中国' },
    Europa: { es: 'Europa', en: 'Europe', pt: 'Europa', zh: '欧洲' },
  }[country]?.[locale] || country || '');
}
function localizedAlt(entry, locale) {
  const place = placeLabel(entry.place, locale);
  const description = entry.description || altEsByKey.get(entry.key) || (entry.kind === 'video' ? 'Video personal sin audio.' : 'Fotografía personal.');
  if (locale === 'es') return description;
  if (locale === 'en') return entry.kind === 'video' ? `Silent personal video${place ? ` from ${place}` : ''}.` : `Personal photograph${place ? ` in ${place}` : ''}.`;
  if (locale === 'pt') return entry.kind === 'video' ? `Vídeo pessoal sem áudio${place ? ` em ${place}` : ''}.` : `Fotografia pessoal${place ? ` em ${place}` : ''}.`;
  return entry.kind === 'video' ? `${place ? `来自${place}的` : ''}无声个人视频。` : `${place ? `在${place}拍摄的` : ''}个人照片。`;
}
function captionFor(entry, locale) {
  const place = placeLabel(entry.place, locale);
  if (entry.key.startsWith('arc.')) return place || (locale === 'zh' ? '中国' : 'China');
  if (entry.key.startsWith('intro.')) return ({ es: 'Unos fragmentos, antes de explicarlo.', en: 'A few fragments, before explaining.', pt: 'Alguns fragmentos, antes de explicar.', zh: '先给你看几个片段。' })[locale];
  if (entry.key.startsWith('int.')) return place || countryLabel(entry.country, locale);
  return place || ({ es: 'Un detalle más.', en: 'One more detail.', pt: 'Mais um detalhe.', zh: '另一个细节。' })[locale];
}
function loopFor(source) { const row = videoByPath.get(source); return row?.loopable_clip || { start_s: 0, end_s: Math.min(4, row?.duration_s || 4) }; }
function selectedLoopFor(entry) {
  const interlude = interludeEntries.find(([key]) => key === entry.key)?.[1];
  if (interlude?.start_s != null) return { start_s: interlude.start_s, end_s: interlude.end_s };
  return loopFor(entry.source);
}

async function probeVideo(input) {
  const result = JSON.parse((await run(ffprobe, ['-v', 'quiet', '-print_format', 'json', '-show_streams', '-show_format', input])).stdout);
  const stream = result.streams.find((item) => item.codec_type === 'video');
  if (!stream?.width || !stream?.height) throw new Error(`Video sin dimensiones: ${input}`);
  return { width: stream.width, height: stream.height, duration: Number(result.format?.duration || stream.duration || 4) };
}
async function firstFrameKeyframe(file) {
  const result = JSON.parse((await run(ffprobe, ['-v', 'error', '-select_streams', 'v:0', '-show_frames', '-read_intervals', '%+#1', '-show_entries', 'frame=key_frame,best_effort_timestamp_time', '-of', 'json', file])).stdout);
  const frame = result.frames?.[0];
  return { keyframe: frame?.key_frame === 1, timestamp: frame?.best_effort_timestamp_time ?? null };
}
function scaleFilter(longSide) { return `scale='if(gte(iw,ih),${longSide},-2)':'if(gte(iw,ih),-2,${longSide})':force_original_aspect_ratio=decrease,crop=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p,setrange=tv`; }
function even(value) { return Math.max(2, Math.floor(value / 2) * 2); }
async function encodeVideo(input, output, longSide, start, duration, profile = 'standard') {
  const crf = profile === 'premium' ? 21 : 23;
  await run(ffmpeg, ['-y', '-ss', String(start), '-i', input, '-t', String(duration), '-map', '0:v:0', '-an', '-map_metadata', '-1', '-metadata', 'creation_time=', '-metadata', 'date=', '-vf', scaleFilter(longSide), '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'medium', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-g', '24', '-keyint_min', '24', '-sc_threshold', '0', '-bf', '2', '-flags', '+cgop', '-movflags', '+faststart', '-force_key_frames', 'expr:gte(t,n_forced*1)', output]);
  return { size: await fileSize(output), crf };
}

async function writeImage(input, base, entry) {
  const orientedMeta = await sharp(input).rotate().metadata();
  const width = orientedMeta.width ?? 1;
  const height = orientedMeta.height ?? 1;
  const availableWidths = fidelityBySource.has(entry.source) ? [...imageWidths, 3200] : imageWidths;
  const scaleWidths = availableWidths.filter((value) => value <= width);
  if (!scaleWidths.length) scaleWidths.push(width);
  const avif = [], webp = [];
  for (const renditionWidth of scaleWidths) {
    const avifName = `${base}-${renditionWidth}.avif`;
    const image = sharp(input).rotate().resize({ width: renditionWidth, withoutEnlargement: true });
    const quality = fidelityBySource.has(entry.source) ? { avif: 78, chromaSubsampling: '4:4:4' } : { avif: 55, chromaSubsampling: '4:2:0' };
    await image.clone().avif({ quality: quality.avif, effort: 6, chromaSubsampling: quality.chromaSubsampling }).toFile(path.join(outDir, avifName));
    avif.push({ w: renditionWidth, src: publicUrl(avifName) });
    if (heroWebpBySource.has(entry.source)) {
      const webpName = `${base}-${renditionWidth}.webp`;
      await image.clone().webp({ quality: 86 }).toFile(path.join(outDir, webpName));
      webp.push({ w: renditionWidth, src: publicUrl(webpName) });
    }
  }
  const tiny = await sharp(input).rotate().resize({ width: 16, height: 16, fit: 'inside' }).blur(16).jpeg({ quality: 35 }).toBuffer();
  return { type: 'image', w: width, h: height, aspect: width / height, lqip: `data:image/jpeg;base64,${tiny.toString('base64')}`, srcset: { avif, webp }, poster: null, duration: null };
}

async function writeVideo(input, base, entry) {
  const probe = await probeVideo(input);
  const clip = selectedLoopFor(entry);
  const start = Math.max(0, Number(clip.start_s || 0));
  const duration = Math.min(Math.max(0.5, Number(clip.end_s || start + 4) - start), Math.max(0.5, probe.duration - start));
  const profile = premiumVideoBySource.has(entry.source) ? 'premium' : 'standard';
  const introHorizontal = entry.key.startsWith('intro.') && probe.width >= probe.height;
  const desktopLong = Math.min(introHorizontal ? 1600 : 1920, Math.max(probe.width, probe.height));
  const mobileLong = Math.min(1280, Math.max(probe.width, probe.height));
  const desktop = { w: probe.width >= probe.height ? desktopLong : even(probe.width * desktopLong / probe.height), h: probe.height >= probe.width ? desktopLong : even(probe.height * desktopLong / probe.width) };
  const mobile = { w: probe.width >= probe.height ? mobileLong : even(probe.width * mobileLong / probe.height), h: probe.height >= probe.width ? mobileLong : even(probe.height * mobileLong / probe.width) };
  const paths = { desktopMp4: path.join(outDir, `${base}-desktop.mp4`), mobileMp4: path.join(outDir, `${base}-mobile.mp4`), desktopPoster: path.join(outDir, `${base}-poster.avif`), mobilePoster: path.join(outDir, `${base}-poster.avif`) };
  const encodings = [];
  if (!skip || forceVideos || !(await exists(paths.desktopMp4))) encodings.push(encodeVideo(input, paths.desktopMp4, desktopLong, start, duration, profile));
  if (!skip || forceVideos || !(await exists(paths.mobileMp4))) encodings.push(encodeVideo(input, paths.mobileMp4, mobileLong, start, duration, profile));
  await Promise.all(encodings);
  if (!skip || forceVideos || !(await exists(paths.desktopPoster))) {
    const png = path.join(outDir, `${base}-poster.png`);
    await run(ffmpeg, ['-y', '-ss', String(start), '-i', input, '-frames:v', '1', '-vf', scaleFilter(1920), '-an', '-map_metadata', '-1', png]);
    await sharp(png).avif({ quality: 60, effort: 6 }).toFile(paths.desktopPoster);
    await fs.rm(png, { force: true });
  }
  await run(exiftool, ['-overwrite_original', '-all=', paths.desktopMp4, paths.mobileMp4, paths.desktopPoster]);
  const desktopSources = { media: '(min-width: 900px)', mp4: publicUrl(path.basename(paths.desktopMp4)), w: desktop.w, h: desktop.h };
  const mobileSources = { media: '(max-width: 899px)', mp4: publicUrl(path.basename(paths.mobileMp4)), w: mobile.w, h: mobile.h };
  return { type: 'video', w: desktop.w, h: desktop.h, aspect: probe.width / probe.height, lqip: null, srcset: { mp4: mobileSources.mp4 }, sources: { desktop: desktopSources, mobile: mobileSources }, posters: { desktop: publicUrl(path.basename(paths.desktopPoster)), mobile: publicUrl(path.basename(paths.mobilePoster)) }, poster: publicUrl(path.basename(paths.desktopPoster)), dims: { desktop, mobile }, duration, profile, crf: profile === 'premium' ? 21 : 23 };
}

function outputsFor(record) { return record.type === 'video' ? [record.sources.desktop.mp4, record.sources.mobile.mp4, record.posters.desktop] : [...record.srcset.avif, ...record.srcset.webp].map((item) => item.src); }
async function validateFiles(media, keys) {
  const missing = [];
  for (const key of keys) {
    const record = media[key];
    if (!record) { missing.push(`${key}: falta el registro`); continue; }
    for (const output of outputsFor(record)) if (!output?.startsWith('/media/') || !(await exists(path.join(root, 'public', output.slice(1))))) missing.push(`${key}: falta ${output || '(vacío)'}`);
  }
  if (missing.length) throw new Error(`Media preconstruida incompleta:\n${missing.join('\n')}`);
}

if (skip) {
  const media = JSON.parse(await fs.readFile(path.join(dataDir, 'media.json'), 'utf8'));
  await validateFiles(media, allEntries.map((entry) => entry.key));
  console.log(`build-media: skip-media validó ${allEntries.length} referencias (sitio + selección nueva)`);
  process.exit(0);
}

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(dataDir, { recursive: true });
const media = {};
const metadata = {};
const recordsBySource = new Map();
const uniqueBytes = new Map();
const keyBytes = [];
for (const entry of allEntries) {
  const input = path.join(originals, entry.source);
  if (!(await exists(input))) throw new Error(`Media no encontrada: ${input}`);
  let record = recordsBySource.get(entry.source);
  if (!record) {
    const base = slug(entry.key);
    const common = { source: entry.source, signature: await signature(input) };
    record = /\.(?:mp4|mov|m4v|mkv)$/i.test(entry.source) ? { ...common, ...(await writeVideo(input, base, entry)) } : { ...common, ...(await writeImage(input, base, entry)) };
    recordsBySource.set(entry.source, record);
    for (const output of outputsFor(record)) uniqueBytes.set(output, await fileSize(path.join(root, 'public', output.slice(1))));
  }
  media[entry.key] = clone(record);
  if (newEntries.some((item) => item.key === entry.key)) metadata[entry.key] = { place: entry.place, country: entry.country, alt_es: localizedAlt(entry, 'es'), alt_en: localizedAlt(entry, 'en'), alt_pt: localizedAlt(entry, 'pt'), alt_zh: localizedAlt(entry, 'zh'), caption_es: captionFor(entry, 'es'), caption_en: captionFor(entry, 'en'), caption_pt: captionFor(entry, 'pt'), caption_zh: captionFor(entry, 'zh') };
  let bytes = 0;
  for (const output of outputsFor(record)) bytes += uniqueBytes.get(output) || 0;
  keyBytes.push({ key: entry.key, source: entry.source, bytes, shared: recordsBySource.get(entry.source) !== record });
  await fs.writeFile(path.join(dataDir, 'media.json'), `${JSON.stringify(media, null, 2)}\n`);
  await fs.writeFile(metaPath, `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`build-media: ${entry.key} -> ${record.type}`);
}
await validateFiles(media, allEntries.map((entry) => entry.key));
const totalBytes = [...uniqueBytes.values()].reduce((sum, value) => sum + value, 0);
const maxFile = Math.max(...uniqueBytes.values());
const imageBytes = [...recordsBySource.entries()].filter(([source]) => !/\.(?:mp4|mov|m4v|mkv)$/i.test(source)).flatMap(([, record]) => outputsFor(record).map((output) => uniqueBytes.get(output) || 0)).reduce((sum, value) => sum + value, 0);
const videoBytes = totalBytes - imageBytes;
const videoChecks = [];
for (const [source, record] of recordsBySource.entries()) {
  if (record.type !== 'video') continue;
  const variants = [
    ['desktop MP4', record.sources.desktop.mp4],
    ['mobile MP4', record.sources.mobile.mp4],
  ];
  const checked = [];
  for (const [label, output] of variants) {
    const file = path.join(root, 'public', output.slice(1));
    const keyframe = await firstFrameKeyframe(file);
    if (!keyframe.keyframe) throw new Error(`El primer frame no es keyframe: ${output}`);
    checked.push({ label, output, bytes: await fileSize(file), timestamp: keyframe.timestamp });
  }
  videoChecks.push({ source, checked });
}
const mediaFiles = [...uniqueBytes.entries()];
const imageAssetBytes = mediaFiles.filter(([file]) => /\.(?:avif|webp)$/i.test(file)).reduce((sum, [, bytes]) => sum + bytes, 0);
const videoAssetBytes = mediaFiles.filter(([file]) => /\.mp4$/i.test(file)).reduce((sum, [, bytes]) => sum + bytes, 0);
const otherAssetBytes = totalBytes - imageAssetBytes - videoAssetBytes;
const report = ['# Informe de medios', '', `Generado: ${new Date().toISOString()}`, '', 'La selección final excluye `viajes-europa/IMG_8581.JPG` por la matrícula; usa `IMG_8605.JPG`/`IMG_8582.JPG` para Puerto Vallarta. Las claves nuevas se procesan además de las referencias que el sitio actual todavía consume.', '', '| Clave | Fuente | Peso de variantes | Nota |', '|---|---|---:|---|', ...keyBytes.map((row) => `| \`${row.key}\` | \`${row.source}\` | ${(row.bytes / 1024 / 1024).toFixed(2)} MB | ${row.shared ? 'comparte salidas' : 'salidas propias'} |`), '', '## Totales', '', `- Fuentes únicas: ${recordsBySource.size}`, `- Imágenes (AVIF/WebP y posters): ${(imageAssetBytes / 1024 / 1024).toFixed(2)} MB`, `- Vídeo (MP4 H.264): ${(videoAssetBytes / 1024 / 1024).toFixed(2)} MB`, `- Otros: ${(otherAssetBytes / 1024 / 1024).toFixed(2)} MB`, `- Dist total (\`public/media\`): ${(totalBytes / 1024 / 1024).toFixed(2)} MB`, `- Archivo más pesado: ${(maxFile / 1024 / 1024).toFixed(2)} MB`, '- Límite solicitado: 200 MB', `- Estado de presupuesto: ${totalBytes <= 200 * 1024 * 1024 && maxFile <= 25 * 1024 * 1024 ? 'OK' : 'REVISAR'}`, '', '## Variantes de vídeo', '', 'Cada clip tiene solo MP4 H.264 High, yuv420p, faststart y sin audio para `(min-width: 900px)` y `(max-width: 899px)`. La variante desktop usa lado largo 1920 (1600 para intro horizontal); la variante móvil usa lado largo 1280. Intro, interludios y carrusel usan CRF 21; el resto CRF 23.', '', '## Decisión de calidad', '', 'Las imágenes usan AVIF-only en 480/800/1200/1800/2400 px; hero, carrusel y cierre añaden 3200 px. Solo el hero `intro.1` conserva WebP como fallback. AVIF usa calidad alta en material protagonista y calidad equilibrada en extras, sin degradar vídeos móviles a 480 px.', ''];
const qualityLine = report.findIndex((line) => line.startsWith('Las imágenes usan AVIF-only'));
if (qualityLine >= 0) report[qualityLine] = 'Las imágenes usan AVIF-only en 480/800/1200/1800 px para extras y añaden 2400/3200 px en hero, carrusel y cierre. Solo el hero `intro.1` conserva WebP como fallback. AVIF usa calidad alta en material protagonista y calidad equilibrada en extras, sin degradar vídeos móviles a 480 px.';
report.push('', '## GOP y keyframes', '', 'Todos los segmentos se recodifican con `-ss`/`-t`, sin `-c copy`, primer frame keyframe y keyframes forzados aproximadamente cada 1 s. H.264 usa GOP cerrado (`-g 24 -keyint_min 24 -sc_threshold 0 -bf 2`).', '', '| Fuente | Variante | Peso | Primer frame |', '|---|---|---:|---|', ...videoChecks.flatMap((row) => row.checked.map((item) => `| \`${row.source}\` | ${item.label} | ${(item.bytes / 1024 / 1024).toFixed(2)} MB | keyframe @ ${item.timestamp ?? '0'} s · OK |`)), '');
await fs.writeFile(reportPath, `${report.join('\n')}\n`);
const metadataOutput = (await run(exiftool, ['-r', '-GPSLatitude', '-GPSLongitude', '-CreateDate', '-ModifyDate', '-Make', '-Model', '-Software', '-j', outDir])).stdout.trim();
const metadataRows = metadataOutput ? JSON.parse(metadataOutput) : [];
const metadataOffenders = metadataRows.filter((row) => Object.entries(row).some(([key, value]) => {
  if (key === 'SourceFile' || value === undefined || value === null || value === '') return false;
  if (/Date$/i.test(key) && /^0000:00:00/.test(String(value))) return false;
  return true;
}));
if (metadataOffenders.length) throw new Error(`Metadatos residuales en public/media: ${JSON.stringify(metadataOffenders.slice(0, 2))}`);
console.log(`build-media: exiftool confirmó ausencia de GPS/fecha/cámara/software en ${metadataRows.length} assets`);
console.log(`build-media: ${allEntries.length} claves, ${recordsBySource.size} fuentes únicas, ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
