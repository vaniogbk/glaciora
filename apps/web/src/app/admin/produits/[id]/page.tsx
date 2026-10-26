'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { formatPrice, toCents } from '@glaciora/shared';
import { errorMessage, useAdminData } from '@/components/admin/useAdminData';
import { api } from '@/lib/api-client';

type Status = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

interface Variant {
  id: string;
  sku: string;
  color: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  isActive: boolean;
  size: { label: string; system: string } | null;
  stock: { quantity: number } | null;
}
interface AdminProduct {
  id: string;
  reference: string;
  slug: string;
  name: string;
  brand: string;
  model: string | null;
  shortDescription: string | null;
  description: string | null;
  categoryId: string;
  sport: 'SKI' | 'HOCKEY';
  condition: 'NEW' | 'USED';
  status: Status;
  compareAtPriceCents: number | null;
  isFeatured: boolean;
  isNew: boolean;
  priceSourceUrl: string | null;
  images: { id: string; url: string; alt: string; position: number }[];
  variants: Variant[];
}
interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

const euros = (cents: number | null | undefined) => (cents ? (cents / 100).toFixed(2) : '');

function parseEuros(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  return toCents(text);
}

export default function AdminProductPage({ params }: { params: { id: string } }) {
  const isNew = params.id === 'nouveau';
  const router = useRouter();
  const { data, error, reload } = useAdminData<{ product: AdminProduct }>(isNew ? null : `/api/admin/products/${params.id}`);
  const { data: cats } = useAdminData<{ categories: Category[] }>('/api/admin/categories');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const product = data?.product;

  async function act(fn: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage('');
    try {
      await fn();
      setMessage(success);
      await reload();
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onSaveProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const json = {
      reference: String(f.get('reference') ?? ''),
      name: String(f.get('name') ?? ''),
      brand: String(f.get('brand') ?? ''),
      model: String(f.get('model') ?? '') || null,
      shortDescription: String(f.get('shortDescription') ?? '') || null,
      description: String(f.get('description') ?? '') || null,
      categoryId: String(f.get('categoryId') ?? ''),
      sport: String(f.get('sport') ?? 'SKI'),
      condition: String(f.get('condition') ?? 'NEW'),
      isFeatured: f.get('isFeatured') === 'on',
      isNew: f.get('isNew') === 'on',
    };
    setBusy(true);
    setMessage('');
    try {
      if (isNew) {
        const res = await api<{ product: { id: string } }>('/api/admin/products', { method: 'POST', json });
        router.replace(`/admin/produits/${res.product.id}`);
      } else {
        await api(`/api/admin/products/${params.id}`, { method: 'PATCH', json });
        setMessage('Fiche produit enregistrée.');
        await reload();
      }
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function onApplyPriceToAll(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) return;
    const f = new FormData(e.currentTarget);
    let priceCents: number | null;
    let compareAtPriceCents: number | null;
    try {
      priceCents = parseEuros(f.get('price'));
      compareAtPriceCents = parseEuros(f.get('compareAt'));
    } catch {
      setMessage('Prix invalide.');
      return;
    }
    if (!priceCents) {
      setMessage('Indiquez un prix supérieur à 0.');
      return;
    }
    void act(async () => {
      for (const v of product.variants) {
        await api(`/api/admin/products/variants/${v.id}`, { method: 'PATCH', json: { priceCents, compareAtPriceCents, isActive: true } });
      }
    }, `Prix ${formatPrice(priceCents)} appliqué à toutes les tailles.`);
  }

  function onSaveVariant(e: FormEvent<HTMLFormElement>, variant: Variant) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    let priceCents: number | null;
    let compareAtPriceCents: number | null;
    try {
      priceCents = parseEuros(f.get('price'));
      compareAtPriceCents = parseEuros(f.get('compareAt'));
    } catch {
      setMessage('Prix invalide.');
      return;
    }
    const quantity = Number(f.get('stock'));
    const isActive = f.get('isActive') === 'on';
    void act(async () => {
      if (priceCents) await api(`/api/admin/products/variants/${variant.id}`, { method: 'PATCH', json: { priceCents, compareAtPriceCents, isActive } });
      else await api(`/api/admin/products/variants/${variant.id}`, { method: 'PATCH', json: { isActive: false } });
      if (Number.isInteger(quantity) && quantity !== (variant.stock?.quantity ?? 0)) {
        await api(`/api/admin/products/variants/${variant.id}/stock`, { method: 'PUT', json: { quantity, reason: 'Ajustement admin' } });
      }
    }, `Taille ${variant.size?.label ?? 'unique'} enregistrée.`);
  }

  function onAddVariant(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    let priceCents: number | null;
    try {
      priceCents = parseEuros(f.get('price'));
    } catch {
      setMessage('Prix invalide.');
      return;
    }
    void act(async () => {
      await api(`/api/admin/products/${params.id}/variants`, {
        method: 'POST',
        json: { sizeLabel: String(f.get('sizeLabel') ?? '') || null, sizeSystem: String(f.get('sizeSystem') ?? 'GENERIC'), priceCents, stock: Number(f.get('stock') ?? 0) },
      });
      form.reset();
    }, 'Taille ajoutée.');
  }

  function onUploadImage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = new FormData(form);
    void act(async () => {
      await api(`/api/admin/products/${params.id}/images`, { method: 'POST', body });
      form.reset();
    }, 'Image ajoutée.');
  }

  if (error) return <p role="alert" className="text-danger">{error}</p>;
  if (!isNew && !product) return <p className="text-muted">Chargement…</p>;
  const categories = cats?.categories.filter((c) => c.parentId) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">{isNew ? 'Nouveau produit' : `${product!.brand} ${product!.name}`}</h1>
        {product && (
          <span className={product.status === 'ACTIVE' ? 'rounded-sm bg-success px-2 py-1 text-xs font-bold text-white' : 'rounded-sm bg-line px-2 py-1 text-xs font-bold text-marine'}>
            {product.status === 'ACTIVE' ? 'Publié' : product.status === 'DRAFT' ? 'Brouillon (non visible)' : 'Archivé'}
          </span>
        )}
      </div>
      <p aria-live="polite" className="text-sm font-semibold text-deep">
        {message}
      </p>

      {product && (
        <section className="card flex flex-wrap items-center gap-3 p-5" aria-label="Publication">
          {product.status === 'ACTIVE' ? (
            <button type="button" className="btn-outline" disabled={busy} onClick={() => act(() => api(`/api/admin/products/${product.id}`, { method: 'PATCH', json: { status: 'DRAFT' } }), 'Produit retiré de la vente.')}>
              Dépublier (masquer de la boutique)
            </button>
          ) : (
            <button type="button" className="btn-primary" disabled={busy} onClick={() => act(() => api(`/api/admin/products/${product.id}`, { method: 'PATCH', json: { status: 'ACTIVE' } }), 'Produit publié.')}>
              Publier sur la boutique
            </button>
          )}
          {product.status !== 'ARCHIVED' && (
            <button type="button" className="btn-outline" disabled={busy} onClick={() => act(() => api(`/api/admin/products/${product.id}/archive`, { method: 'POST' }), 'Produit archivé.')}>
              Archiver
            </button>
          )}
          <button
            type="button"
            className="btn border border-danger text-danger hover:bg-danger hover:text-white"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm('Supprimer définitivement ce produit ?')) return;
              try {
                await api(`/api/admin/products/${product.id}`, { method: 'DELETE' });
                router.push('/admin/produits');
              } catch (err) {
                setMessage(errorMessage(err));
              }
            }}
          >
            Supprimer
          </button>
          <a href={`/produit/${product.slug}`} target="_blank" rel="noopener noreferrer" className="ml-auto text-sm font-semibold text-deep underline">
            Voir la fiche publique
          </a>
        </section>
      )}

      <form onSubmit={onSaveProduct} className="card grid gap-4 p-5 md:grid-cols-2" aria-label="Fiche produit">
        <h2 className="text-lg md:col-span-2">Fiche produit</h2>
        <div>
          <label htmlFor="name" className="field-label">Nom de l’article *</label>
          <input id="name" name="name" required defaultValue={product?.name ?? ''} className="field-input" />
        </div>
        <div>
          <label htmlFor="brand" className="field-label">Marque *</label>
          <input id="brand" name="brand" required defaultValue={product?.brand ?? ''} className="field-input" />
        </div>
        <div>
          <label htmlFor="reference" className="field-label">Référence *</label>
          <input id="reference" name="reference" required defaultValue={product?.reference ?? ''} className="field-input" />
        </div>
        <div>
          <label htmlFor="model" className="field-label">Modèle exact</label>
          <input id="model" name="model" defaultValue={product?.model ?? ''} className="field-input" />
        </div>
        <div>
          <label htmlFor="categoryId" className="field-label">Catégorie *</label>
          <select id="categoryId" name="categoryId" required defaultValue={product?.categoryId ?? ''} className="field-input">
            <option value="">Choisir</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sport" className="field-label">Sport</label>
            <select id="sport" name="sport" defaultValue={product?.sport ?? 'SKI'} className="field-input">
              <option value="SKI">Ski</option>
              <option value="HOCKEY">Hockey</option>
            </select>
          </div>
          <div>
            <label htmlFor="condition" className="field-label">État</label>
            <select id="condition" name="condition" defaultValue={product?.condition ?? 'NEW'} className="field-input">
              <option value="NEW">Neuf</option>
              <option value="USED">Occasion</option>
            </select>
          </div>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="shortDescription" className="field-label">Description courte</label>
          <input id="shortDescription" name="shortDescription" maxLength={300} defaultValue={product?.shortDescription ?? ''} className="field-input" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className="field-label">Description détaillée</label>
          <textarea id="description" name="description" rows={5} defaultValue={product?.description ?? ''} className="field-input" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} className="h-4 w-4 accent-deep" /> Produit phare (accueil)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isNew" defaultChecked={product?.isNew} className="h-4 w-4 accent-deep" /> Nouveauté
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="btn-primary" disabled={busy}>{isNew ? 'Créer le produit' : 'Enregistrer la fiche'}</button>
        </div>
      </form>

      {product && (
        <>
          <section className="card p-5" aria-labelledby="prix-stock">
            <h2 id="prix-stock" className="text-lg">Prix et stock par taille</h2>
            {product.priceSourceUrl && (
              <p className="mt-1 text-xs text-muted">
                Prix initial relevé sur le marché le 26/10/2026 :{' '}
                <a href={product.priceSourceUrl} target="_blank" rel="noopener noreferrer" className="underline">source</a>
              </p>
            )}
            {product.variants.length > 0 && (
              <form onSubmit={onApplyPriceToAll} className="mt-4 flex flex-wrap items-end gap-3 rounded-md bg-snow p-4">
                <div>
                  <label htmlFor="prix-tous" className="field-label">Prix pour toutes les tailles (€)</label>
                  <input id="prix-tous" name="price" inputMode="decimal" placeholder="ex. 449,90" className="field-input w-40" />
                </div>
                <div>
                  <label htmlFor="barre-tous" className="field-label">Prix barré (€, facultatif)</label>
                  <input id="barre-tous" name="compareAt" inputMode="decimal" className="field-input w-40" />
                </div>
                <button type="submit" className="btn-primary" disabled={busy}>Appliquer à toutes les tailles</button>
              </form>
            )}
            <div className="mt-4 space-y-3">
              {product.variants.map((v) => (
                <form key={v.id} onSubmit={(e) => onSaveVariant(e, v)} className="grid items-end gap-3 rounded-md border border-line p-3 sm:grid-cols-[1fr_120px_120px_100px_auto_auto]">
                  <div>
                    <p className="font-semibold text-marine">{v.size?.label ?? 'Taille unique'}</p>
                    <p className="text-xs text-muted">{v.sku}</p>
                  </div>
                  <div>
                    <label htmlFor={`prix-${v.id}`} className="field-label text-xs">Prix (€)</label>
                    <input id={`prix-${v.id}`} name="price" inputMode="decimal" defaultValue={euros(v.priceCents)} className="field-input" />
                  </div>
                  <div>
                    <label htmlFor={`barre-${v.id}`} className="field-label text-xs">Prix barré (€)</label>
                    <input id={`barre-${v.id}`} name="compareAt" inputMode="decimal" defaultValue={euros(v.compareAtPriceCents)} className="field-input" />
                  </div>
                  <div>
                    <label htmlFor={`stock-${v.id}`} className="field-label text-xs">Stock</label>
                    <input id={`stock-${v.id}`} name="stock" type="number" min={0} defaultValue={v.stock?.quantity ?? 0} className="field-input" />
                  </div>
                  <label className="flex min-h-[44px] items-center gap-2 text-sm">
                    <input type="checkbox" name="isActive" defaultChecked={v.isActive} className="h-4 w-4 accent-deep" /> En vente
                  </label>
                  <button type="submit" className="btn-outline" disabled={busy}>Enregistrer</button>
                </form>
              ))}
            </div>
            <form onSubmit={onAddVariant} className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-5">
              <div>
                <label htmlFor="nouvelle-taille" className="field-label">Nouvelle taille</label>
                <input id="nouvelle-taille" name="sizeLabel" placeholder="ex. 172 cm, 27.5, M" className="field-input w-40" />
              </div>
              <div>
                <label htmlFor="systeme" className="field-label">Type</label>
                <select id="systeme" name="sizeSystem" className="field-input w-44">
                  <option value="SKI_LENGTH">Longueur de ski</option>
                  <option value="BOOT_MONDO">Mondopoint</option>
                  <option value="SKATE">Pointure patin</option>
                  <option value="HELMET">Casque</option>
                  <option value="APPAREL">Vêtement / gants</option>
                  <option value="STICK">Crosse</option>
                  <option value="ONE_SIZE">Taille unique</option>
                </select>
              </div>
              <div>
                <label htmlFor="nouveau-prix" className="field-label">Prix (€)</label>
                <input id="nouveau-prix" name="price" inputMode="decimal" required className="field-input w-32" />
              </div>
              <div>
                <label htmlFor="nouveau-stock" className="field-label">Stock</label>
                <input id="nouveau-stock" name="stock" type="number" min={0} defaultValue={0} className="field-input w-24" />
              </div>
              <button type="submit" className="btn-outline" disabled={busy}>Ajouter la taille</button>
            </form>
          </section>

          <section className="card p-5" aria-labelledby="images">
            <h2 id="images" className="text-lg">Images</h2>
            <ul className="mt-4 flex flex-wrap gap-4">
              {product.images.map((img) => (
                <li key={img.id} className="w-36 text-xs">
                  <div className="relative h-36 w-36 rounded-md bg-snow">
                    <Image src={img.url} alt={img.alt} fill sizes="144px" className="object-contain p-2" />
                  </div>
                  <button type="button" className="mt-2 font-semibold text-danger underline" onClick={() => act(() => api(`/api/admin/products/images/${img.id}`, { method: 'DELETE' }), 'Image supprimée.')}>
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={onUploadImage} className="mt-5 flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="image" className="field-label">Fichier (JPG, PNG, WEBP)</label>
                <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="field-input" />
              </div>
              <div>
                <label htmlFor="alt" className="field-label">Texte alternatif *</label>
                <input id="alt" name="alt" required minLength={3} className="field-input w-72" placeholder="Description de l’image" />
              </div>
              <button type="submit" className="btn-outline" disabled={busy}>Ajouter l’image</button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
