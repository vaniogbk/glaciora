'use client';

import Link from 'next/link';
import { useState } from 'react';
import clsx from 'clsx';
import { MAX_QUANTITY_PER_LINE, formatPrice } from '@glaciora/shared';
import { useCart } from '@/components/providers/CartProvider';
import { ApiError } from '@/lib/api-client';
import type { ProductVariant } from '@/lib/types';

export function AddToCart({ variants, productName }: { variants: ProductVariant[]; productName: string }) {
  const { add } = useCart();
  const single = variants.length === 1 ? variants[0] : undefined;
  const [selectedId, setSelectedId] = useState<string | undefined>(single?.id);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'added' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const selected = variants.find((v) => v.id === selectedId);
  const anyInStock = variants.some((v) => v.inStock);
  const needsSize = variants.some((v) => v.size && v.size.system !== 'ONE_SIZE');

  async function onAdd() {
    if (!selected) {
      setStatus('error');
      setMessage('Choisissez une taille avant d’ajouter au panier.');
      return;
    }
    setStatus('loading');
    try {
      await add(selected.id, quantity);
      setStatus('added');
      setMessage(`${productName}${selected.size ? ` (${selected.size.label})` : ''} ajouté au panier.`);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof ApiError ? err.message : 'Ajout impossible, réessayez.');
    }
  }

  if (variants.length === 0 || !anyInStock) {
    return (
      <div className="rounded-md bg-snow p-4 text-sm">
        <p className="font-semibold text-marine">Actuellement indisponible.</p>
        <p className="mt-1 text-muted">Contactez-nous pour connaître la date de réassort.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {needsSize && (
        <fieldset>
          <legend className="field-label">Taille {selected?.size ? <span className="font-normal text-muted">: {selected.size.label}</span> : null}</legend>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Choisir une taille">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={v.id === selectedId}
                disabled={!v.inStock}
                onClick={() => {
                  setSelectedId(v.id);
                  setStatus('idle');
                }}
                className={clsx(
                  'min-h-[44px] min-w-[64px] rounded-md border px-3 text-sm font-semibold transition',
                  v.id === selectedId ? 'border-deep bg-deep text-white' : 'border-line bg-white text-marine hover:border-deep',
                  !v.inStock && 'cursor-not-allowed text-muted line-through opacity-60',
                )}
              >
                {v.size?.label ?? 'Unique'}
                <span className="sr-only">{v.inStock ? '' : ' (épuisé)'}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {selected && selected.priceCents !== variants[0]?.priceCents && <p className="text-sm text-muted">Prix pour cette taille : {formatPrice(selected.priceCents)}</p>}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="quantite" className="field-label">
            Quantité
          </label>
          <select
            id="quantite"
            className="field-input w-24"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          >
            {Array.from({ length: Math.max(1, Math.min(selected?.available ?? MAX_QUANTITY_PER_LINE, MAX_QUANTITY_PER_LINE)) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn-primary flex-1 sm:flex-none sm:px-10" onClick={onAdd} disabled={status === 'loading'} data-testid="add-to-cart">
          {status === 'loading' ? 'Ajout…' : status === 'added' ? '✓ Ajouté' : 'Ajouter au panier'}
        </button>
      </div>
      {selected && selected.available > 0 && selected.available <= 3 && <p className="text-sm font-semibold text-warning">Plus que {selected.available} en stock</p>}
      <div aria-live="polite" className="min-h-[1.5rem] text-sm">
        {status === 'added' && (
          <p className="font-semibold text-success">
            {message}{' '}
            <Link href="/panier" className="underline">
              Voir le panier
            </Link>
          </p>
        )}
        {status === 'error' && <p className="font-semibold text-danger" role="alert">{message}</p>}
      </div>
    </div>
  );
}
