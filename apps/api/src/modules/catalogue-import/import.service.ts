import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseCsv } from 'csv-parse/sync';
import sharp from 'sharp';
import { z } from 'zod';
import type { Prisma, Sport } from '@prisma/client';
import { toCents } from '@glaciora/shared';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { slugify } from '../../lib/slug';

/**
 * Import idempotent du catalogue client.
 * Sources (jamais modifiées) :
 *  - GLACIORA_CATALOGUE/04_SUIVI_PRODUITS/suivi_produits.csv (références, marques, dossiers, statut)
 *  - images PNG des dossiers 01_SKI / 02_HOCKEY (03_CATALOGUE_COMPLET = copies, ignoré)
 *  - apps/api/data/catalogue-complement.csv (prix marché relevés, tailles, descriptions)
 */

export const CATEGORY_TREE = [
  { slug: 'skis', name: 'Skis', sport: 'SKI', position: 1, children: [
    { slug: 'skis-all-mountain-freeride', name: 'Skis all-mountain & freeride', folder: '01_SKI/01_Skis_All_Mountain_Freeride' },
    { slug: 'skis-junior', name: 'Skis junior', folder: '01_SKI/02_Skis_Junior' },
  ] },
  { slug: 'bottes', name: 'Bottes', sport: 'SKI', position: 2, children: [
    { slug: 'chaussures-de-ski', name: 'Chaussures de ski', folder: '01_SKI/03_Chaussures_Ski' },
  ] },
  { slug: 'hockey', name: 'Hockey', sport: 'HOCKEY', position: 3, children: [
    { slug: 'patins-hockey', name: 'Patins', folder: '02_HOCKEY/01_Patins' },
    { slug: 'crosses-hockey', name: 'Crosses', folder: '02_HOCKEY/02_Batons' },
    { slug: 'casques-hockey', name: 'Casques de hockey', folder: '02_HOCKEY/03_Casques' },
    { slug: 'protections-hockey', name: 'Protections', folder: '02_HOCKEY/04_Protections' },
    { slug: 'entrainement-hockey', name: 'Entraînement', folder: '02_HOCKEY/05_Accessoires_Entrainement' },
  ] },
  { slug: 'accessoires', name: 'Accessoires', sport: null, position: 4, children: [
    { slug: 'casques-de-ski', name: 'Casques de ski', folder: '01_SKI/04_Casques' },
    { slug: 'masques-de-ski', name: 'Masques de ski', folder: '01_SKI/05_Masques' },
    { slug: 'securite-avalanche', name: 'Sécurité avalanche', folder: '01_SKI/06_Securite_Avalanche' },
    { slug: 'gants', name: 'Gants', folder: '01_SKI/07_Gants_Chauffants' },
  ] },
  { slug: 'vestes', name: 'Vestes', sport: null, position: 5, children: [] },
  { slug: 'vetements', name: 'Vêtements', sport: null, position: 6, children: [] },
] as const;

const SIZE_ORDER: Record<string, (label: string) => number> = {
  SKI_LENGTH: (l) => parseFloat(l),
  BOOT_MONDO: (l) => parseFloat(l) * 10,
  SKATE: (l) => parseFloat(l) * 10,
  APPAREL: (l) => ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].indexOf(l),
  HELMET: (l) => ['XS', 'S', 'M', 'L', 'XL'].findIndex((s) => l.startsWith(s)),
  STICK: (l) => (l.startsWith('Gauche') ? 0 : 100) + parseFloat(l.replace(/\D+/g, '') || '0'),
  ONE_SIZE: () => 0,
};

const sourceRowSchema = z.object({
  reference: z.string().regex(/^(GLA|HL)-\d{3}$/),
  category: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  imageFile: z.string(),
  imageOrigin: z.string(),
  sourceUrl: z.string().optional(),
  status: z.string(),
  realModel: z.string(),
  imagePresent: z.string(),
  folder: z.string().min(1),
});

const complementSchema = z.object({
  reference: z.string(),
  name: z.string().min(2).max(160),
  price_eur: z.string(),
  compare_at_eur: z.string(),
  price_source: z.string(),
  size_system: z.enum(['SKI_LENGTH', 'BOOT_MONDO', 'SKATE', 'APPAREL', 'HELMET', 'STICK', 'ONE_SIZE']),
  sizes: z.string().min(1),
  stock: z.string(),
  condition: z.enum(['NEW', 'USED']),
  color: z.string(),
  featured: z.enum(['true', 'false']),
  is_new: z.enum(['true', 'false']),
  short_description: z.string().max(300),
  specs: z.string(),
});

export interface ImportOptions {
  catalogueDir: string;
  complementPath?: string;
  /** Écrit les images optimisées dans le dossier public du site (poste de développement). */
  copyImages?: boolean;
  triggeredById?: string;
  dryRun?: boolean;
}

export interface ImportReportLine {
  reference: string;
  action: 'created' | 'updated' | 'unchanged' | 'skipped' | 'error';
  status?: string;
  message?: string;
}

function readCsv(content: string): Record<string, string>[] {
  return parseCsv(content, { bom: true, delimiter: ';', columns: true, skip_empty_lines: true, relax_quotes: true, trim: true });
}

function parseSpecs(raw: string): Record<string, string> | undefined {
  if (!raw) return undefined;
  const entries = raw
    .split('|')
    .map((pair) => pair.split('='))
    .filter((p): p is [string, string] => p.length === 2 && Boolean(p[0]?.trim()) && Boolean(p[1]?.trim()))
    .map(([k, v]) => [k.trim(), v.trim()] as const);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export async function ensureCategories(tx: Prisma.TransactionClient = prisma) {
  const byFolder = new Map<string, { id: string; sport: Sport | null }>();
  for (const root of CATEGORY_TREE) {
    const parent = await tx.category.upsert({
      where: { slug: root.slug },
      create: { slug: root.slug, name: root.name, sport: root.sport, position: root.position, isVisible: root.children.length > 0 },
      update: { name: root.name, position: root.position },
    });
    let position = 0;
    for (const child of root.children) {
      const created = await tx.category.upsert({
        where: { slug: child.slug },
        create: { slug: child.slug, name: child.name, sport: root.sport, parentId: parent.id, position: position++ },
        update: { name: child.name, parentId: parent.id },
      });
      byFolder.set(child.folder, { id: created.id, sport: root.sport });
    }
  }
  return byFolder;
}

async function optimiseImage(sourceFile: string, slug: string, index: number, copyImages: boolean) {
  const input = await readFile(sourceFile);
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 10);
  const fileName = `${slug}${index > 0 ? `-${index + 1}` : ''}-${hash}.webp`;
  const url = `${env.PRODUCT_MEDIA_BASE_URL}/products/${fileName}`;
  const pipeline = sharp(input).resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 });
  const meta = await sharp(input).metadata();
  if (copyImages) {
    const outDir = path.resolve(env.PRODUCT_MEDIA_DIR, 'products');
    await mkdir(outDir, { recursive: true });
    const outFile = path.join(outDir, fileName);
    if (!existsSync(outFile)) await writeFile(outFile, await pipeline.toBuffer());
  }
  const size = Math.min(1200, meta.width ?? 1200);
  return { url, width: size, height: size, hash };
}

export async function runCatalogueImport(options: ImportOptions) {
  const startedAt = new Date();
  const lines: ImportReportLine[] = [];
  const csvPath = path.join(options.catalogueDir, '04_SUIVI_PRODUITS', 'suivi_produits.csv');
  const complementPath = options.complementPath ?? path.resolve(process.cwd(), 'data', 'catalogue-complement.csv');
  const copyImages = options.copyImages ?? true;

  const run = options.dryRun
    ? null
    : await prisma.importRun.create({ data: { source: path.basename(options.catalogueDir), triggeredById: options.triggeredById ?? null } });

  const sourceRows = readCsv(await readFile(csvPath, 'utf8'));
  const complementRows = new Map(readCsv(await readFile(complementPath, 'utf8')).map((r) => [r.reference ?? '', r]));
  const categories = await ensureCategories();

  for (const raw of sourceRows) {
    const reference = raw['Identifiant du produit'] ?? '?';
    try {
      const source = sourceRowSchema.parse({
        reference,
        category: raw['Catégorie'],
        brand: raw['Marque'],
        model: raw['Modèle'],
        imageFile: raw['Nom du fichier image'] ?? '',
        imageOrigin: raw['Image officielle ou générée par IA'] ?? '',
        sourceUrl: raw['Source de référence'] || undefined,
        status: raw['Statut'] ?? '',
        realModel: raw['Modèle réel retenu / identifié'] ?? '',
        imagePresent: raw['Image présente dans le dossier'] ?? '',
        folder: raw['Dossier'],
      });
      const imagePath = path.join(options.catalogueDir, ...source.folder.split('/'), source.imageFile);
      if (source.imagePresent !== 'Oui' || !existsSync(imagePath)) {
        lines.push({ reference, action: 'skipped', message: 'Aucune image dans le dossier catalogue : référence non importée' });
        continue;
      }
      const category = categories.get(source.folder);
      if (!category) {
        lines.push({ reference, action: 'error', message: `Dossier inconnu : ${source.folder}` });
        continue;
      }
      const complementRaw = complementRows.get(reference);
      if (!complementRaw) {
        lines.push({ reference, action: 'error', message: 'Absente de catalogue-complement.csv (nom, tailles, prix)' });
        continue;
      }
      const complement = complementSchema.parse(complementRaw);
      const priceCents = complement.price_eur ? toCents(complement.price_eur) : null;
      const compareAt = complement.compare_at_eur ? toCents(complement.compare_at_eur) : null;
      const sizes = complement.sizes.split(',').map((s) => s.trim()).filter(Boolean);
      const sport: Sport = source.folder.startsWith('02_HOCKEY') ? 'HOCKEY' : 'SKI';
      const slug = slugify(`${source.brand.split(' ')[0]} ${complement.name}`);
      const isIllustration = /IA/i.test(source.imageOrigin);
      const extraImages = reference === 'GLA-001' ? ['volkl_shine_72_variante_coloris.png'] : [];

      const checksum = createHash('sha256')
        .update(JSON.stringify({ raw, complementRaw, imageSize: (await readFile(imagePath)).length, extraImages }))
        .digest('hex');
      const existing = await prisma.product.findUnique({ where: { reference }, select: { id: true, importChecksum: true, status: true } });
      if (existing && existing.importChecksum === checksum) {
        lines.push({ reference, action: 'unchanged', status: existing.status });
        continue;
      }

      const images: { url: string; width: number; height: number; hash: string; sourceFile: string; alt: string }[] = [];
      for (const [index, file] of [source.imageFile, ...extraImages].entries()) {
        const full = path.join(options.catalogueDir, ...source.folder.split('/'), file);
        if (!existsSync(full)) continue;
        const optimised = await optimiseImage(full, slug, index, copyImages && !options.dryRun);
        images.push({
          ...optimised,
          sourceFile: `${source.folder}/${file}`,
          alt:
            index === 0
              ? `${source.brand} ${complement.name}${complement.color ? ` coloris ${complement.color}` : ''} — visuel d'illustration`
              : `${source.brand} ${complement.name} — autre coloris (visuel d'illustration)`,
        });
      }

      const sellable = priceCents != null && priceCents > 0;
      const initialStatus = source.status === 'terminé' && sellable ? 'ACTIVE' : 'DRAFT';
      const data = {
        name: complement.name,
        brand: source.brand.replace(/\s*\(.*\)$/, ''),
        model: source.realModel || source.model,
        shortDescription: complement.short_description || null,
        description: null,
        categoryId: category.id,
        sport,
        condition: complement.condition,
        currency: 'EUR',
        priceFromCents: priceCents,
        compareAtPriceCents: compareAt && priceCents && compareAt > priceCents ? compareAt : null,
        specs: parseSpecs(complement.specs) ?? undefined,
        colors: complement.color ? [complement.color] : [],
        isFeatured: complement.featured === 'true',
        isNew: complement.is_new === 'true',
        sourceUrl: source.sourceUrl ?? null,
        priceSourceUrl: complement.price_source || null,
        priceCheckedAt: sellable ? new Date('2026-10-26T00:00:00Z') : null,
        imagesAreIllustrations: isIllustration,
        importChecksum: checksum,
      };

      if (options.dryRun) {
        lines.push({ reference, action: existing ? 'updated' : 'created', status: existing?.status ?? initialStatus, message: 'simulation' });
        continue;
      }

      await prisma.$transaction(async (tx) => {
        const product = existing
          ? await tx.product.update({ where: { id: existing.id }, data: { ...data, status: sellable ? undefined : 'DRAFT' } })
          : await tx.product.create({ data: { ...data, reference, slug, status: initialStatus } });

        const keepUrls: string[] = [];
        for (const [position, image] of images.entries()) {
          keepUrls.push(image.url);
          await tx.productImage.upsert({
            where: { productId_url: { productId: product.id, url: image.url } },
            create: { productId: product.id, url: image.url, alt: image.alt, position, width: image.width, height: image.height, isIllustration: isIllustration, sourceFile: image.sourceFile },
            update: { alt: image.alt, position, width: image.width, height: image.height, isIllustration: isIllustration },
          });
        }
        await tx.productImage.deleteMany({ where: { productId: product.id, sourceFile: { not: null }, url: { notIn: keepUrls } } });

        const sortKey = SIZE_ORDER[complement.size_system] ?? (() => 0);
        const keepSkus: string[] = [];
        for (const [position, label] of sizes.entries()) {
          const size = await tx.size.upsert({
            where: { system_label: { system: complement.size_system, label } },
            create: { system: complement.size_system, label, sortOrder: Math.round(sortKey(label) * 10) || 0 },
            update: {},
          });
          const sku = `${reference}-${slugify(label) || 'unique'}`.toUpperCase();
          keepSkus.push(sku);
          const variant = await tx.productVariant.upsert({
            where: { sku },
            create: {
              productId: product.id,
              sku,
              sizeId: size.id,
              color: complement.color || null,
              priceCents: priceCents ?? 0,
              compareAtPriceCents: data.compareAtPriceCents,
              isActive: sellable,
              position,
              stock: { create: { quantity: Number(complement.stock) || 0 } },
            },
            update: { sizeId: size.id, color: complement.color || null, priceCents: priceCents ?? 0, compareAtPriceCents: data.compareAtPriceCents, isActive: sellable, position },
          });
          // Le stock n'est fixé qu'à la création : ensuite il se gère dans l'admin.
          if (!existing && Number(complement.stock) > 0) {
            await tx.stockMovement.create({ data: { variantId: variant.id, type: 'IMPORT', delta: Number(complement.stock), reason: 'Import catalogue' } });
          }
        }
        await tx.productVariant.updateMany({ where: { productId: product.id, sku: { notIn: keepSkus } }, data: { isActive: false } });
        lines.push({ reference, action: existing ? 'updated' : 'created', status: product.status, message: sellable ? undefined : 'Sans prix relevé en euros : reste en brouillon' });
      });
    } catch (err) {
      const message = err instanceof z.ZodError ? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' ; ') : (err as Error).message;
      lines.push({ reference, action: 'error', message });
    }
  }

  const summary = {
    created: lines.filter((l) => l.action === 'created').length,
    updated: lines.filter((l) => l.action === 'updated').length,
    unchanged: lines.filter((l) => l.action === 'unchanged').length,
    skipped: lines.filter((l) => l.action === 'skipped').length,
    errors: lines.filter((l) => l.action === 'error').length,
  };
  if (run) {
    await prisma.importRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        createdCount: summary.created,
        updatedCount: summary.updated,
        skippedCount: summary.skipped + summary.unchanged,
        errorCount: summary.errors,
        report: lines as unknown as Prisma.InputJsonValue,
      },
    });
  }
  return { runId: run?.id ?? null, startedAt, finishedAt: new Date(), summary, lines };
}

export function reportToMarkdown(report: Awaited<ReturnType<typeof runCatalogueImport>>): string {
  const rows = report.lines.map((l) => `| ${l.reference} | ${l.action} | ${l.status ?? ''} | ${(l.message ?? '').replace(/\|/g, '/')} |`).join('\n');
  return `# Rapport d'import du catalogue GLACIORA

- Début : ${report.startedAt.toISOString()}
- Fin : ${report.finishedAt.toISOString()}
- Créés : ${report.summary.created} · Mis à jour : ${report.summary.updated} · Inchangés : ${report.summary.unchanged} · Ignorés : ${report.summary.skipped} · Erreurs : ${report.summary.errors}

| Référence | Action | Statut | Message |
|---|---|---|---|
${rows}
`;
}

/** Visuels d'ambiance de l'accueil (dossier 05_ACCUEIL), reconnus par mots-clés dans le nom de fichier. */
const HOME_IMAGE_RULES: { key: string; pattern: RegExp; alt: string }[] = [
  { key: 'hockeyBanner', pattern: /banni.*hockey|hockey.*banni|joueur|freinage/i, alt: 'Joueur de hockey qui freine sur la glace d’une patinoire aux lumières bleues' },
  { key: 'skiBanner', pattern: /banni.*ski|ski.*banni|skieur|poudreuse/i, alt: 'Skieur dans la poudreuse' },
  { key: 'collectionHockey', pattern: /collection.*hockey|hockey.*collection|patin|palet|crosse/i, alt: 'Patin, crosse et palet posés sur la glace' },
  { key: 'collectionSki', pattern: /collection.*ski|ski.*collection|panorama|alpin/i, alt: 'Panorama alpin enneigé' },
  { key: 'essentials', pattern: /essential|for[eê]t/i, alt: 'Forêt enneigée sous un ciel clair' },
];

export async function importHomeImages(catalogueDir: string, webDir: string) {
  const dir = path.join(catalogueDir, '05_ACCUEIL');
  if (!existsSync(dir)) return { found: false, mapped: {} as Record<string, string>, ignored: [] as string[] };
  const { readdir } = await import('node:fs/promises');
  const files = (await readdir(dir)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
  const manifest: Record<string, { src: string; alt: string; width: number; height: number } | null | string> = {
    _note: 'Généré par « npm run import:catalogue » à partir de GLACIORA_CATALOGUE/05_ACCUEIL. Valeur null = visuel graphique de repli.',
    skiBanner: null,
    hockeyBanner: null,
    collectionSki: null,
    collectionHockey: null,
    essentials: null,
  };
  const mapped: Record<string, string> = {};
  const ignored: string[] = [];
  const outDir = path.resolve(env.PRODUCT_MEDIA_DIR, 'home');
  await mkdir(outDir, { recursive: true });
  for (const file of files) {
    const normalized = file.normalize('NFKD').replace(/\p{M}+/gu, '');
    const rule = HOME_IMAGE_RULES.find((r) => !mapped[r.key] && r.pattern.test(normalized));
    if (!rule) {
      ignored.push(file);
      continue;
    }
    const input = await readFile(path.join(dir, file));
    const hash = createHash('sha256').update(input).digest('hex').slice(0, 10);
    const name = `${slugify(rule.key)}-${hash}.webp`;
    const { data, info } = await sharp(input).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    await writeFile(path.join(outDir, name), data);
    manifest[rule.key] = { src: `${env.PRODUCT_MEDIA_BASE_URL}/home/${name}`, alt: rule.alt, width: info.width, height: info.height };
    mapped[rule.key] = file;
  }
  await writeFile(path.join(webDir, 'src', 'data', 'home-images.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return { found: true, mapped, ignored };
}
