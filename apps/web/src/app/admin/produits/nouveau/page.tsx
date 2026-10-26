'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toCents } from '@glaciora/shared';
import { errorMessage, useAdminData } from '@/components/admin/useAdminData';
import { api } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  sport: 'SKI' | 'HOCKEY' | null;
}

interface SizeRow {
  key: number;
  label: string;
  price: string;
  stock: string;
}

const SIZE_SYSTEMS = [
  { value: 'SKI_LENGTH', label: 'Longueur de ski (cm)', example: '170 cm' },
  { value: 'BOOT_MONDO', label: 'Chaussure (Mondopoint)', example: '27.5' },
  { value: 'SKATE', label: 'Patin (pointure)', example: '8.5' },
  { value: 'HELMET', label: 'Casque', example: 'M (55-58 cm)' },
  { value: 'APPAREL', label: 'Vêtement / gants', example: 'M' },
  { value: 'STICK', label: 'Crosse (main – flex)', example: 'Gauche – Flex 77' },
  { value: 'ONE_SIZE', label: 'Taille unique', example: 'Taille unique' },
];

let nextKey = 1;
const emptyRow = (label = ''): SizeRow => ({ key: nextKey++, label, price: '', stock: '0' });

/** Ajout d'un nouvel article en une fois : fiche, tailles (prix + stock), photo, publication. */
export default function NewProductPage() {
  const router = useRouter();
  const { data: cats } = useAdminData<{ categories: Category[] }>('/api/admin/categories');
  const [system, setSystem] = useState('SKI_LENGTH');
  const [rows, setRows] = useState<SizeRow[]>([emptyRow()]);
  const [samePrice, setSamePrice] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const categories = cats?.categories.filter((c) => c.parentId) ?? [];
  const example = SIZE_SYSTEMS.find((s) => s.value === system)?.example ?? '';

  function updateRow(key: number, patch: Partial<SizeRow>) {
    setRows((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setMessage('');

    const sizes = rows
      .map((r) => ({ ...r, label: system === 'ONE_SIZE' ? 'Taille unique' : r.label.trim(), price: (r.price || samePrice).trim() }))
      .filter((r) => r.label);
    if (sizes.length === 0) {
      setMessage('Ajoutez au moins une taille.');
      return;
    }
    let parsed: { label: string; priceCents: number; stock: number }[];
    try {
      parsed = sizes.map((s) => {
        const priceCents = toCents(s.price);
        if (priceCents <= 0) throw new Error();
        return { label: s.label, priceCents, stock: Math.max(0, Number(s.stock) || 0) };
      });
    } catch {
      setMessage('Chaque taille doit avoir un prix supérieur à 0 (ou renseignez le prix commun).');
      return;
    }
    const image = f.get('image');
    const hasImage = image instanceof File && image.size > 0;
    const publish = f.get('publish') === 'on';
    if (publish && !hasImage) {
      setMessage('Ajoutez une photo pour publier l’article (ou décochez « Publier »).');
      return;
    }

    setBusy(true);
    try {
      const { product } = await api<{ product: { id: string } }>('/api/admin/products', {
        method: 'POST',
        json: {
          reference: String(f.get('reference') ?? '').trim(),
          name: String(f.get('name') ?? '').trim(),
          brand: String(f.get('brand') ?? '').trim(),
          model: String(f.get('model') ?? '').trim() || null,
          shortDescription: String(f.get('shortDescription') ?? '').trim() || null,
          description: String(f.get('description') ?? '').trim() || null,
          categoryId: String(f.get('categoryId') ?? ''),
          sport: String(f.get('sport') ?? 'SKI'),
          condition: String(f.get('condition') ?? 'NEW'),
          colors: String(f.get('color') ?? '').trim() ? [String(f.get('color')).trim()] : [],
          weightGrams: f.get('weight') ? Math.round(Number(String(f.get('weight')).replace(',', '.')) * 1000) || null : null,
          dimensions: String(f.get('dimensions') ?? '').trim() || null,
          isFeatured: f.get('isFeatured') === 'on',
          isNew: f.get('isNew') === 'on',
          imagesAreIllustrations: false,
        },
      });
      for (const s of parsed) {
        await api(`/api/admin/products/${product.id}/variants`, {
          method: 'POST',
          json: { sizeLabel: s.label, sizeSystem: system, priceCents: s.priceCents, stock: s.stock, color: String(f.get('color') ?? '').trim() || null },
        });
      }
      if (hasImage) {
        const body = new FormData();
        body.set('image', image);
        body.set('alt', String(f.get('alt') ?? '').trim() || `${String(f.get('brand'))} ${String(f.get('name'))}`);
        await api(`/api/admin/products/${product.id}/images`, { method: 'POST', body });
      }
      if (publish) await api(`/api/admin/products/${product.id}`, { method: 'PATCH', json: { status: 'ACTIVE' } });
      router.push(`/admin/produits/${product.id}`);
    } catch (err) {
      setMessage(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <Link href="/admin/produits" className="text-sm font-semibold text-deep underline">
        ← Produits
      </Link>
      <h1 className="mt-3 text-2xl">Ajouter un article</h1>
      <p className="mt-1 text-sm text-muted">Renseignez la fiche, les tailles avec leur prix et leur stock, puis la photo. Les champs marqués * sont obligatoires.</p>
      {message && (
        <p role="alert" className="mt-4 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
          {message}
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-6 space-y-6" noValidate>
        <fieldset className="card grid gap-4 p-5 md:grid-cols-2">
          <legend className="sr-only">Informations de l’article</legend>
          <h2 className="text-lg md:col-span-2">1. Article</h2>
          <div>
            <label htmlFor="name" className="field-label">Nom de l’article *</label>
            <input id="name" name="name" required className="field-input" placeholder="ex. Slap 98" />
          </div>
          <div>
            <label htmlFor="brand" className="field-label">Marque *</label>
            <input id="brand" name="brand" required className="field-input" placeholder="ex. Zag" />
          </div>
          <div>
            <label htmlFor="reference" className="field-label">Référence interne *</label>
            <input id="reference" name="reference" required pattern="[A-Za-z0-9-]+" className="field-input" placeholder="ex. GLA-040" />
          </div>
          <div>
            <label htmlFor="model" className="field-label">Modèle exact / saison</label>
            <input id="model" name="model" className="field-input" placeholder="ex. Zag Slap 98 2026" />
          </div>
          <div>
            <label htmlFor="categoryId" className="field-label">Catégorie *</label>
            <select
              id="categoryId"
              name="categoryId"
              required
              className="field-input"
              defaultValue=""
              onChange={(e) => {
                const sport = categories.find((c) => c.id === e.target.value)?.sport;
                const select = document.getElementById('sport') as HTMLSelectElement | null;
                if (sport && select) select.value = sport;
              }}
            >
              <option value="" disabled>Choisir</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sport" className="field-label">Sport</label>
              <select id="sport" name="sport" className="field-input" defaultValue="SKI">
                <option value="SKI">Ski</option>
                <option value="HOCKEY">Hockey</option>
              </select>
            </div>
            <div>
              <label htmlFor="condition" className="field-label">État</label>
              <select id="condition" name="condition" className="field-input" defaultValue="NEW">
                <option value="NEW">Neuf</option>
                <option value="USED">Occasion</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="color" className="field-label">Coloris</label>
            <input id="color" name="color" className="field-input" placeholder="ex. Noir / Bleu" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="weight" className="field-label">Poids (kg)</label>
              <input id="weight" name="weight" inputMode="decimal" className="field-input" placeholder="ex. 3,3" />
            </div>
            <div>
              <label htmlFor="dimensions" className="field-label">Dimensions</label>
              <input id="dimensions" name="dimensions" className="field-input" placeholder="ex. 128-98-118 mm" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="shortDescription" className="field-label">Description courte</label>
            <input id="shortDescription" name="shortDescription" maxLength={300} className="field-input" placeholder="Une phrase qui résume l’article (affichée sur la fiche)" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="field-label">Description détaillée</label>
            <textarea id="description" name="description" rows={4} className="field-input" />
          </div>
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className="sr-only">Tailles, prix et stock</legend>
          <h2 className="text-lg">2. Tailles, prix et stock</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="systeme" className="field-label">Type de taille</label>
              <select id="systeme" value={system} onChange={(e) => setSystem(e.target.value)} className="field-input w-64">
                {SIZE_SYSTEMS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prix-commun" className="field-label">Prix commun (€)</label>
              <input id="prix-commun" inputMode="decimal" value={samePrice} onChange={(e) => setSamePrice(e.target.value)} className="field-input w-40" placeholder="ex. 449,90" />
            </div>
            <p className="pb-3 text-xs text-muted">Utilisé pour les tailles dont le prix est vide.</p>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th scope="col" className="pb-2">Taille</th>
                <th scope="col" className="pb-2">Prix (€)</th>
                <th scope="col" className="pb-2">Stock</th>
                <th scope="col"><span className="sr-only">Retirer</span></th>
              </tr>
            </thead>
            <tbody>
              {(system === 'ONE_SIZE' ? rows.slice(0, 1) : rows).map((r, index) => (
                <tr key={r.key}>
                  <td className="pb-2 pr-2">
                    <input
                      aria-label={`Taille ${index + 1}`}
                      value={system === 'ONE_SIZE' ? 'Taille unique' : r.label}
                      disabled={system === 'ONE_SIZE'}
                      onChange={(e) => updateRow(r.key, { label: e.target.value })}
                      className="field-input"
                      placeholder={example}
                    />
                  </td>
                  <td className="pb-2 pr-2">
                    <input aria-label={`Prix taille ${index + 1}`} inputMode="decimal" value={r.price} onChange={(e) => updateRow(r.key, { price: e.target.value })} className="field-input" placeholder={samePrice || '0,00'} />
                  </td>
                  <td className="pb-2 pr-2">
                    <input aria-label={`Stock taille ${index + 1}`} type="number" min={0} value={r.stock} onChange={(e) => updateRow(r.key, { stock: e.target.value })} className="field-input w-24" />
                  </td>
                  <td className="pb-2">
                    {rows.length > 1 && system !== 'ONE_SIZE' && (
                      <button type="button" className="font-semibold text-danger underline" onClick={() => setRows((all) => all.filter((x) => x.key !== r.key))}>
                        Retirer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {system !== 'ONE_SIZE' && (
            <button type="button" className="btn-outline" onClick={() => setRows((all) => [...all, emptyRow()])}>
              + Ajouter une taille
            </button>
          )}
        </fieldset>

        <fieldset className="card grid gap-4 p-5 md:grid-cols-2">
          <legend className="sr-only">Photo et publication</legend>
          <h2 className="text-lg md:col-span-2">3. Photo et publication</h2>
          <div>
            <label htmlFor="image" className="field-label">Photo (JPG, PNG, WEBP — 8 Mo max.)</label>
            <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="field-input" />
          </div>
          <div>
            <label htmlFor="alt" className="field-label">Texte alternatif de la photo</label>
            <input id="alt" name="alt" className="field-input" placeholder="ex. Paire de skis Zag Slap 98 vue de dessus" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isFeatured" className="h-4 w-4 accent-deep" /> Produit phare (accueil)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isNew" className="h-4 w-4 accent-deep" /> Nouveauté
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-marine md:col-span-2">
            <input type="checkbox" name="publish" defaultChecked className="h-4 w-4 accent-deep" /> Publier immédiatement sur la boutique
          </label>
        </fieldset>

        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer l’article'}
        </button>
      </form>
    </div>
  );
}
