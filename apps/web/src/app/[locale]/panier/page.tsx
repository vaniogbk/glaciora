'use client';

import Image from 'next/image';
import { useState } from 'react';
import { MAX_QUANTITY_PER_LINE } from '@glaciora/shared/cart';
import { useCart } from '@/components/providers/CartProvider';
import { Link, useI18n } from '@/i18n/client';
import { apiErrorMessage } from '@/i18n/errors';
import { fmt, money } from '@/i18n/format';
import { sizeLabel } from '@/i18n/labels';

export default function CartPage() {
  const { cart, loading, update, remove } = useCart();
  const { locale, m } = useI18n();
  const t = m.cart;
  const price = (cents: number) => money(cents, locale);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function run(variantId: string, action: () => Promise<unknown>) {
    setBusy(variantId);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(apiErrorMessage(err, locale, m, t.actionFailed));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl sm:text-4xl">{t.title}</h1>
      {loading ? (
        <p className="mt-6 text-muted">{t.loading}</p>
      ) : !cart || cart.items.length === 0 ? (
        <div className="mt-8 rounded-lg bg-snow p-10 text-center">
          <p className="font-semibold text-marine">{t.empty}</p>
          <Link href="/catalogue" className="btn-primary mt-5">
            {m.common.discoverCatalogue}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section aria-labelledby="articles">
            <h2 id="articles" className="sr-only">
              {t.items}
            </h2>
            {error && (
              <p role="alert" className="mb-4 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
                {error}
              </p>
            )}
            <ul className="divide-y divide-line rounded-lg border border-line">
              {cart.items.map((item) => (
                <li key={item.variantId} className="flex gap-4 p-4" data-testid="cart-line">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-snow">
                    {item.image && <Image src={item.image.url} alt={item.image.alt} fill sizes="96px" className="object-contain p-1" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="eyebrow">{item.brand}</p>
                      <Link href={`/produit/${item.slug}`} className="font-bold text-marine hover:underline">
                        {item.productName}
                      </Link>
                      {item.sizeLabel && <p className="text-sm text-muted">{fmt(m.common.sizeValue, { size: sizeLabel(item.sizeLabel, m.productClient.sizeWords) })}</p>}
                      <p className="text-sm text-muted">{fmt(t.unitPrice, { price: price(item.unitPriceCents) })}</p>
                      {item.issue && (
                        <p className="mt-1 text-sm font-semibold text-danger" role="alert">
                          {locale === 'fr' ? item.issue.message : (m.errors.codes[item.issue.code] ?? m.errors.generic)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:flex-col sm:flex-nowrap sm:items-end">
                      <label className="sr-only" htmlFor={`qte-${item.variantId}`}>
                        {fmt(t.quantityFor, { name: item.productName })}
                      </label>
                      <select
                        id={`qte-${item.variantId}`}
                        className="field-input w-20"
                        value={item.quantity}
                        disabled={busy === item.variantId}
                        onChange={(e) => run(item.variantId, () => update(item.variantId, Number(e.target.value)))}
                      >
                        {Array.from({ length: Math.max(item.quantity, Math.min(Math.max(item.available, 1), MAX_QUANTITY_PER_LINE)) }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <p className="font-bold text-marine">{price(item.lineTotalCents)}</p>
                      <button type="button" className="text-sm font-semibold text-deep underline" disabled={busy === item.variantId} onClick={() => run(item.variantId, () => remove(item.variantId))}>
                        {t.remove}<span className="sr-only"> {item.productName}</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <aside className="h-fit rounded-lg bg-snow p-6" aria-labelledby="recapitulatif">
            <h2 id="recapitulatif" className="text-lg">
              {m.common.summary}
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt>{fmt(t.itemsCount, { count: cart.itemCount })}</dt>
                <dd className="font-semibold">{price(cart.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-muted">
                <dt>{m.common.shipping}</dt>
                <dd className="text-right">{t.shippingNext}</dd>
              </div>
            </dl>
            <p className="mt-4 flex justify-between gap-4 border-t border-line pt-4 text-lg font-extrabold">
              <span>{m.common.subtotal}</span>
              <span>{price(cart.subtotalCents)}</span>
            </p>
            {cart.hasIssues ? (
              <p className="mt-4 text-sm font-semibold text-danger">{t.fixIssues}</p>
            ) : (
              <Link href="/commande" className="btn-primary mt-6 w-full" data-testid="checkout-link">
                {t.checkout}
              </Link>
            )}
            <Link href="/catalogue" className="mt-3 block text-center text-sm font-semibold text-deep underline">
              {m.common.continueShopping}
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
