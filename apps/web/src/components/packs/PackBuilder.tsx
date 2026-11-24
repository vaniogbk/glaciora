'use client';

import Image from 'next/image';
import { useState } from 'react';
import { packDiscountCents } from '@glaciora/shared/packs';
import { useCart } from '@/components/providers/CartProvider';
import { Link, useI18n } from '@/i18n/client';
import { fmt, money } from '@/i18n/format';
import { colorLabel, sizeLabel } from '@/i18n/labels';
import type { PackItem } from '@/lib/types';

interface Labels {
  size: string;
  color: string;
  addPack: string;
  adding: string;
  added: string;
  addFailed: string;
  viewCart: string;
  regularPrice: string;
  packPrice: string;
  /** « Vous économisez {amount} » */
  save: string;
}

type Variant = PackItem['variants'][number];

/** Variante en stock la moins chère : sélection par défaut (c'est le prix « à partir de » du pack). */
const cheapest = (variants: Variant[]) => [...variants].sort((a, b) => a.priceCents - b.priceCents)[0];

/**
 * Articles du pack avec le choix du coloris (s'il y en a plusieurs) et de la taille de chacun, le prix du pack
 * pour cette sélection, puis l'ajout de tous les articles au panier.
 * Le total affiché suit la même règle que le serveur (remise du pack sur la somme des articles choisis) ;
 * c'est le serveur qui applique la remise au panier dès qu'il contient le pack complet.
 */
export function PackBuilder({ items, discountPercent, labels }: { items: PackItem[]; discountPercent: number; labels: Labels }) {
  const { locale, m } = useI18n();
  const { add } = useCart();
  const [choice, setChoice] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((i) => [i.reference, cheapest(i.variants.filter((v) => v.inStock))?.id ?? ''])),
  );
  const [state, setState] = useState<'idle' | 'adding' | 'added' | 'failed'>('idle');

  const selected = (item: PackItem) => item.variants.find((v) => v.id === choice[item.reference]);
  const itemsTotal = items.reduce((sum, i) => sum + (selected(i)?.priceCents ?? i.fromPriceCents), 0);
  const discount = packDiscountCents(itemsTotal, discountPercent);

  async function addAll() {
    setState('adding');
    try {
      for (const item of items) await add(choice[item.reference]!, 1);
      setState('added');
    } catch {
      setState('failed');
    }
  }

  function chooseColor(item: PackItem, color: string) {
    const current = selected(item);
    const inColor = item.variants.filter((v) => v.inStock && v.color === color);
    // Même taille dans le nouveau coloris si elle existe, sinon la moins chère de ce coloris.
    const next = inColor.find((v) => v.size === current?.size) ?? cheapest(inColor);
    if (next) setChoice((c) => ({ ...c, [item.reference]: next.id }));
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="min-w-0">
        <ul className="divide-y divide-line rounded-lg bg-white shadow-card">
          {items.map((item) => {
            const inStock = item.variants.filter((v) => v.inStock);
            const current = selected(item);
            const colors = [...new Set(inStock.map((v) => v.color).filter((c): c is string => Boolean(c)))];
            const sizes = colors.length > 1 && current?.color ? inStock.filter((v) => v.color === current.color) : inStock;
            const photo = (current?.color && item.images?.find((i) => i.color === current.color)) || item.image;
            return (
              <li key={item.reference} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center">
                <div className="relative aspect-square rounded-md bg-snow">
                  {photo && <Image src={photo.url} alt={photo.alt} fill sizes="96px" className="object-contain p-1" />}
                </div>
                <div className="min-w-0">
                  <p className="eyebrow">{item.brand} · {item.category.name}</p>
                  <Link href={`/produit/${item.slug}`} className="font-bold text-marine hover:underline">{item.name}</Link>
                  {colors.length <= 1 && current?.color && <p className="text-xs text-muted">{colorLabel(current.color, m.colors)}</p>}
                  <p className="text-sm font-semibold">{money(current?.priceCents ?? item.fromPriceCents, locale)}</p>
                </div>
                <div className="col-span-2 flex flex-wrap gap-3 sm:col-span-1 sm:justify-end">
                  {colors.length > 1 && (
                    <label className="block text-sm">
                      <span className="field-label">{labels.color}</span>
                      <select className="field-input w-full sm:w-auto" value={current?.color ?? ''} onChange={(e) => chooseColor(item, e.target.value)} data-testid="pack-color">
                        {colors.map((c) => (
                          <option key={c} value={c}>
                            {colorLabel(c, m.colors)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {sizes.length === 1 || !sizes[0]?.size ? (
                    sizes[0]?.size ? <p className="self-end text-sm">{labels.size} : {sizeLabel(sizes[0].size, m.productClient.sizeWords)}</p> : null
                  ) : (
                    <label className="block text-sm">
                      <span className="field-label">{labels.size}</span>
                      <select
                        className="field-input w-full sm:w-auto"
                        value={choice[item.reference]}
                        onChange={(e) => setChoice((c) => ({ ...c, [item.reference]: e.target.value }))}
                      >
                        {sizes.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.size ? sizeLabel(v.size, m.productClient.sizeWords) : '—'}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="button" className="btn-primary" onClick={addAll} disabled={state === 'adding'} data-testid="add-pack">
            {state === 'adding' ? labels.adding : labels.addPack}
          </button>
          <p aria-live="polite" className="text-sm font-semibold">
            {state === 'added' && (
              <>
                <span className="text-success">{labels.added}</span>{' '}
                <Link href="/panier" className="text-deep underline">{labels.viewCart}</Link>
              </>
            )}
            {state === 'failed' && <span className="text-danger">{labels.addFailed}</span>}
          </p>
        </div>
      </div>
      <aside className="card h-fit p-5 lg:sticky lg:top-24">
        <dl className="space-y-1 text-sm">
          <div className="flex flex-wrap justify-between gap-x-3 text-muted">
            <dt>{labels.regularPrice}</dt>
            <dd>{money(itemsTotal, locale)}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-3 text-2xl font-extrabold text-marine">
            <dt>{labels.packPrice}</dt>
            <dd data-testid="pack-price">{money(itemsTotal - discount, locale)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-sm font-semibold text-success">{fmt(labels.save, { amount: money(discount, locale) })}</p>
      </aside>
    </div>
  );
}
