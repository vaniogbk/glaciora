'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useCart } from '@/components/providers/CartProvider';
import { Link, useI18n } from '@/i18n/client';
import { money } from '@/i18n/format';
import { colorLabel, sizeLabel } from '@/i18n/labels';
import type { PackItem } from '@/lib/types';

interface Labels {
  size: string;
  addPack: string;
  adding: string;
  added: string;
  addFailed: string;
  viewCart: string;
}

/**
 * Articles du pack avec le choix de la taille de chacun, puis ajout de tous les articles au panier.
 * La remise n'est pas calculée ici : le serveur l'applique au panier dès qu'il contient le pack complet.
 */
export function PackBuilder({ items, labels }: { items: PackItem[]; labels: Labels }) {
  const { locale, m } = useI18n();
  const { add } = useCart();
  const firstInStock = (item: PackItem) => item.variants.find((v) => v.inStock)?.id ?? '';
  const [choice, setChoice] = useState<Record<string, string>>(() => Object.fromEntries(items.map((i) => [i.reference, firstInStock(i)])));
  const [state, setState] = useState<'idle' | 'adding' | 'added' | 'failed'>('idle');

  async function addAll() {
    setState('adding');
    try {
      for (const item of items) await add(choice[item.reference]!, 1);
      setState('added');
    } catch {
      setState('failed');
    }
  }

  return (
    <div>
      <ul className="divide-y divide-line rounded-lg bg-white shadow-card">
        {items.map((item) => {
          const inStock = item.variants.filter((v) => v.inStock);
          const selected = item.variants.find((v) => v.id === choice[item.reference]);
          const single = inStock.length === 1;
          return (
            <li key={item.reference} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center">
              <div className="relative aspect-square rounded-md bg-snow">
                {item.image && <Image src={item.image.url} alt={item.image.alt} fill sizes="96px" className="object-contain p-1" />}
              </div>
              <div className="min-w-0">
                <p className="eyebrow">{item.brand} · {item.category.name}</p>
                <Link href={`/produit/${item.slug}`} className="font-bold text-marine hover:underline">{item.name}</Link>
                {selected?.color && <p className="text-xs text-muted">{colorLabel(selected.color, m.colors)}</p>}
                <p className="text-sm font-semibold">{money(selected?.priceCents ?? item.fromPriceCents, locale)}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                {single || !inStock[0]?.size ? (
                  inStock[0]?.size ? <p className="text-sm">{labels.size} : {sizeLabel(inStock[0].size, m.productClient.sizeWords)}</p> : null
                ) : (
                  <label className="block text-sm">
                    <span className="field-label">{labels.size}</span>
                    <select
                      className="field-input w-full sm:w-auto"
                      value={choice[item.reference]}
                      onChange={(e) => setChoice((c) => ({ ...c, [item.reference]: e.target.value }))}
                    >
                      {inStock.map((v) => (
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
  );
}
