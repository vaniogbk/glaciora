// Génère avec Gemini les images manquantes de l'extension du catalogue.
//   node GLACIORA_EXTENSION/generate-images.mjs            → toutes les références sans image
//   node GLACIORA_EXTENSION/generate-images.mjs GLA-040 …  → seulement ces références (régénère si l'image existe)
// Clé : GEMINI_API_KEY dans C:\MySTARTUPS\GLACIORA\.env (jamais affichée ni écrite ailleurs).
// Modèle : GEMINI_IMAGE_MODEL dans .env, sinon le premier modèle « image » disponible pour la clé.
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const env = Object.fromEntries(
  (existsSync(path.join(root, '.env')) ? readFileSync(path.join(root, '.env'), 'utf8') : '')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]),
);
const KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error('GEMINI_API_KEY absente de .env');
  process.exit(1);
}
const API = 'https://generativelanguage.googleapis.com/v1beta';
const headers = { 'content-type': 'application/json', 'x-goog-api-key': KEY };

const COMMON =
  'Photorealistic e-commerce product photo of {subject}. A single product (or the single pair sold), fully visible, centred, on a clean uniform white background. Professional studio lighting, realistic materials, textures, seams and functional details, soft natural shadow, sharp high-resolution catalogue quality. No text, no letters, no logo, no brand name, no label, no price, no watermark, no collage, no other product, no person, no mannequin visible.';

function readCsv(file) {
  const [head, ...rows] = readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const cols = head.split(';');
  return rows.map((r) => Object.fromEntries(r.split(';').map((v, i) => [cols[i], v])));
}

async function pickModel() {
  if (env.GEMINI_IMAGE_MODEL) return env.GEMINI_IMAGE_MODEL;
  const res = await fetch(`${API}/models?pageSize=200`, { headers });
  if (!res.ok) throw new Error(`Liste des modèles : HTTP ${res.status}`);
  const { models = [] } = await res.json();
  const image = models
    .filter((m) => /image/i.test(m.name) && (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m) => m.name.replace('models/', ''));
  if (!image.length) throw new Error('Aucun modèle de génération d’images disponible pour cette clé');
  return image.find((n) => /flash-image(?!.*preview)/.test(n)) ?? image[0];
}

async function generate(model, prompt) {
  const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } } };
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${API}/models/${model}:generateContent`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, attempt * 15000));
      continue;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(`HTTP ${res.status} : ${json.error?.message ?? 'erreur'}`);
    const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part) throw new Error(`Pas d’image dans la réponse (${json.candidates?.[0]?.finishReason ?? 'raison inconnue'})`);
    return Buffer.from(part.inlineData.data, 'base64');
  }
  throw new Error('Trop de tentatives (quota ou serveur)');
}

const subjects = JSON.parse(readFileSync(path.join(here, 'subjects.json'), 'utf8'));
const rows = readCsv(path.join(root, 'apps', 'api', 'data', 'catalogue-extension.csv'));
const only = new Set(process.argv.slice(2));
const model = await pickModel();
console.log(`Modèle : ${model}`);
const log = path.join(here, 'generation-log.txt');
let done = 0;
for (const row of rows) {
  if (only.size && !only.has(row.reference)) continue;
  const out = path.join(here, ...row.folder.split('/'), row.image_file);
  if (existsSync(out) && !only.size) continue;
  const subject = subjects[row.reference];
  if (!subject) {
    console.log(`${row.reference} : pas de sujet dans subjects.json, ignoré`);
    continue;
  }
  const prompt = COMMON.replace('{subject}', subject);
  try {
    const png = await generate(model, prompt);
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, png);
    appendFileSync(log, `${new Date().toISOString()}\t${row.reference}\t${model}\t${row.folder}/${row.image_file}\t${prompt}\n`);
    console.log(`${row.reference} : ${row.image_file} (${Math.round(png.length / 1024)} Ko)`);
    done++;
  } catch (e) {
    console.log(`${row.reference} : ÉCHEC — ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 4000));
}
console.log(`${done} image(s) générée(s).`);
