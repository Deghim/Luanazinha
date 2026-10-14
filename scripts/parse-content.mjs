import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceDir = path.join(root, 'content-src');
const outputDir = path.join(root, 'src/data');
const files = { es: 'es-master.md', en: 'en.md', pt: 'pt-BR.md', zh: 'zh-Hans.md' };
const emojiPattern = /\p{Extended_Pictographic}/gu;

function clean(value) {
  return value
    .trim()
    .replace(/\s+\((?:\d+)\s+(?:palabras?|words?|字)\)\.?$/, '')
    .replace(/^\*\*(.*)\*\*$/, '$1')
    .replace(/^`(.*)`$/, '$1')
    .trim();
}

async function parse(file) {
  const text = await fs.readFile(path.join(sourceDir, file), 'utf8');
  const values = {};
  let inYaml = false;
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === '```yaml') { inYaml = true; continue; }
    if (inYaml && line.trim() === '```') { inYaml = false; continue; }
    const keyed = line.match(/^`([^`]+)`\s+—\s+(.+?)\s*$/);
    const yaml = inYaml && line.match(/^([a-z][a-z0-9_.]+):\s*"(.*)"\s*$/);
    if (!keyed && !yaml) continue;
    const key = keyed ? keyed[1] : yaml[1];
    values[key] = clean(keyed ? keyed[2] : yaml[2]);
  }
  if (!Object.keys(values).length) throw new Error(`No se encontraron claves en ${file}`);
  if (values['ch9.s2.text']?.includes('{{ch9.emoji}}')) {
    values['ch9.s2.text'] = values['ch9.s2.text'].replaceAll('{{ch9.emoji}}', values['ch9.emoji'] ?? '');
  }
  return values;
}

await fs.mkdir(outputDir, { recursive: true });
const parsed = {};
for (const [locale, file] of Object.entries(files)) parsed[locale] = await parse(file);
const expected = new Set(Object.keys(parsed.es));
for (const [locale, values] of Object.entries(parsed)) {
  const actual = new Set(Object.keys(values));
  const missing = [...expected].filter((key) => !actual.has(key));
  const extra = [...actual].filter((key) => !expected.has(key));
  if (missing.length || extra.length) {
    throw new Error(`${locale}: paridad inválida; faltan ${missing.join(', ')}; sobran ${extra.join(', ')}`);
  }
  const allText = Object.values(values).join('\n');
  if (/[!！]/u.test(allText)) throw new Error(`${locale}: contiene un signo de exclamación`);
  if (/\b(?:pendiente|pending|tbd)\b/i.test(allText) || /\bTODO\s*:/i.test(allText)) throw new Error(`${locale}: contiene un marcador pendiente`);
  const emojis = [...allText.matchAll(emojiPattern)].map((item) => item[0]);
  if (new Set(emojis).size !== 1) throw new Error(`${locale}: debe contener exactamente un emoji distinto; tiene ${new Set(emojis).size}`);
  await fs.writeFile(path.join(outputDir, `${locale}.json`), `${JSON.stringify(values, null, 2)}\n`);
}
console.log(`parse-content: ${Object.keys(parsed.es).length} claves, 4 idiomas, paridad y restricciones OK`);
