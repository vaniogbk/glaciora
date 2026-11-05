'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { MAX_QUANTITY_PER_LINE } from '@glaciora/shared/cart';
import { useCart } from '@/components/providers/CartProvider';
import { Link, useI18n } from '@/i18n/client';
import { apiErrorMessage } from '@/i18n/errors';
import { fmt, money } from '@/i18n/format';
import { colorLabel } from '@/i18n/labels';
import type { ProductVariant } from '@/lib/types';
import { useColorSelection } from './ColorSelection';
import { swatchBackground, variantColors } from './color-swatch';

export function AddToCart({ variants: allVariants, productName }: { variants: ProductVariant[]; productName: string }) {
  const { add } = useCart();
  const { locale, m } = useI18n();
  const t = m.productClient;
  const { color, setColor } = useColorSelection();
  const colors = variantColors(allVariants);
  // Tailles du coloris choisi (les variantes sans coloris valent pour tous les coloris).
  const variants = colors.length && color ? allVariants.filter((v) => !v.color || v.color === color) : allVariants;
  const single = variants.length === 1 ? variants[0] : undefined;
  const [chosenId, setSelectedId] = useState<string | undefined>(single?.id);
  const selectedId = variants.some((v) => v.id === chosenId) ? chosenId : single?.id;
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'added' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const selected = variants.find((v) => v.id === selectedId);
  const anyInStock = allVariants.some((v) => v.inStock);

  function chooseColor(next: string) {
    if (next === color) return;
    // Même taille dans le nouveau coloris si elle existe, sinon nouvelle sélection.
    const sizeLabel = selected?.size?.label;
    const match = allVariants.find((v) => v.color === next && v.size?.label === sizeLabel && sizeLabel);
    setColor(next);
    setSelectedId(match?.id);
    setStatus('idle');
  }
  const needsSize = variants.some((v) => v.size && v.size.system !== 'ONE_SIZE');

  async function onAdd() {
    if (!selected) {
      setStatus('error');
      setMessage(t.chooseSizeFirst);
      return;
    }
    // Confirmation immédiate (interface optimiste) ; annulée avec le message du serveur si l'ajout est refusé.
    setStatus('added');
    setMessage(fmt(t.addedMessage, { name: `${productName}${selected.size ? ` (${selected.size.label})` : ''}` }));
    try {
      await add(selected.id, quantity);
    } catch (err) {
      setStatus('error');
      setMessage(apiErrorMessage(err, locale, m, t.addFailed));
    }
  }

  if (variants.length === 0 || !anyInStock) {
    return (
      <div className="rounded-md bg-snow p-4 text-sm">
        <p className="font-semibold text-marine">{t.unavailable}</p>
        <p className="mt-1 text-muted">{t.restock}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {colors.length > 0 && (
        <fieldset>
          <legend className="field-label">
            {t.color} <span className="font-normal text-muted">: {colorLabel(color ?? colors[0]!, m.colors)}</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t.chooseColor}>
            {colors.map((c) => {
              const checked = c === (color ?? colors[0]);
              const available = allVariants.some((v) => v.color === c && v.inStock);
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={`${colorLabel(c, m.colors)}${available ? '' : ` ${t.soldOut}`}`}
                  title={colorLabel(c, m.colors)}
                  onClick={() => chooseColor(c)}
                  data-testid="color-option"
                  className={clsx('inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-2 p-1 transition', checked ? 'border-deep' : 'border-line hover:border-deep', !available && 'opacity-50')}
                >
                  <span aria-hidden="true" className="block h-8 w-8 rounded-full border border-line" style={{ background: swatchBackground(c) }} />
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      {needsSize && (
        <fieldset>
          <legend className="field-label">{t.size} {selected?.size ? <span className="font-normal text-muted">: {selected.size.label}</span> : null}</legend>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t.chooseSize}>
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
                {v.size?.label ?? t.oneSize}
                <span className="sr-only">{v.inStock ? '' : ` ${t.soldOut}`}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {selected && selected.priceCents !== variants[0]?.priceCents && <p className="text-sm text-muted">{fmt(t.sizePrice, { price: money(selected.priceCents, locale) })}</p>}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="quantite" className="field-label">
            {t.quantity}
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
          {status === 'loading' ? t.adding : status === 'added' ? t.added : t.add}
        </button>
      </div>
      {selected && selected.available > 0 && selected.available <= 3 && <p className="text-sm font-semibold text-warning">{fmt(t.lowStock, { count: selected.available })}</p>}
      <div aria-live="polite" className="min-h-[1.5rem] text-sm">
        {status === 'added' && (
          <p className="font-semibold text-success">
            {message}{' '}
            <Link href="/panier" className="underline">
              {t.viewCart}
            </Link>
          </p>
        )}
        {status === 'error' && <p className="font-semibold text-danger" role="alert">{message}</p>}
      </div>
    </div>
  );
}
