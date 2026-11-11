// npm run data : récupère les 6 « produits phares » de l'accueil (nom, marque, prix réels) et leurs photos depuis le site
// en ligne, ainsi que les visuels d'ambiance de l'accueil. Rien n'est inventé : la vidéo affiche ce que le site vend.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SITE = process.env.SITE_URL ?? 'https://www.glaciora.online';

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

const home = await (await fetch(`${SITE}/api/catalogue/home`, { headers: { accept: 'application/json' } })).json();
const products = [];
for (const p of home.featured.slice(0, 6)) {
  if (!p.image) continue;
  const file = `products/${p.slug}${path.extname(p.image.url) || '.webp'}`;
  await download(`${SITE}${p.image.url}`, path.join(ROOT, 'public', file));
  products.push({ slug: p.slug, brand: p.brand, name: p.name, sport: p.sport, priceFromCents: p.priceFromCents, hasPriceRange: p.hasPriceRange, image: file });
}

const homeImages = JSON.parse(await (await import('node:fs/promises')).readFile(path.join(ROOT, '..', 'apps', 'web', 'src', 'data', 'home-images.json'), 'utf8'));
const visuals = {};
for (const [key, image] of Object.entries(homeImages)) {
  if (!image || typeof image !== 'object' || !image.src) continue;
  const file = `visuals/${key}${path.extname(image.src)}`;
  await download(`${SITE}${image.src}`, path.join(ROOT, 'public', file));
  visuals[key] = file;
}

await mkdir(path.join(ROOT, 'src', 'data'), { recursive: true });
await writeFile(path.join(ROOT, 'src', 'data', 'products.json'), JSON.stringify({ fetchedAt: new Date().toISOString(), products, visuals }, null, 2) + '\n');
console.log(`${products.length} produits phares et ${Object.keys(visuals).length} visuels récupérés depuis ${SITE}`);
for (const p of products) console.log(`- ${p.brand} ${p.name} : ${(p.priceFromCents / 100).toFixed(2)} €`);
