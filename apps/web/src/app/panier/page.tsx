'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { MAX_QUANTITY_PER_LINE, formatPrice } from '@glaciora/shared';
import { useCart } from '@/components/providers/CartProvider';
import { ApiError } from '@/lib/api-client';

export default function CartPage() {
  const { cart, loading, update, remove } = useCart();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function run(variantId: string, action: () => Promise<unknown>) {
    setBusy(variantId);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action impossible, réessayez.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl sm:text-4xl">Mon panier</h1>
      {loading ? (
        <p className="mt-6 text-muted">Chargement du panier…</p>
      ) : !cart || cart.items.length === 0 ? (
        <div className="mt-8 rounded-lg bg-snow p-10 text-center">
          <p className="font-semibold text-marine">Votre panier est vide.</p>
          <Link href="/catalogue" className="btn-primary mt-5">
            Découvrir le catalogue
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <section aria-labelledby="articles">
            <h2 id="articles" className="sr-only">
              Articles
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
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="eyebrow">{item.brand}</p>
                      <Link href={`/produit/${item.slug}`} className="font-bold text-marine hover:underline">
                        {item.productName}
                      </Link>
                      {item.sizeLabel && <p className="text-sm text-muted">Taille : {item.sizeLabel}</p>}
                      <p className="text-sm text-muted">{formatPrice(item.unitPriceCents)} l’unité</p>
                      {item.issue && (
                        <p className="mt-1 text-sm font-semibold text-danger" role="alert">
                          {item.issue.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <label className="sr-only" htmlFor={`qte-${item.variantId}`}>
                        Quantité pour {item.productName}
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
                      <p className="font-bold text-marine">{formatPrice(item.lineTotalCents)}</p>
                      <button type="button" className="text-sm font-semibold text-deep underline" disabled={busy === item.variantId} onClick={() => run(item.variantId, () => remove(item.variantId))}>
                        Supprimer<span className="sr-only"> {item.productName}</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <aside className="h-fit rounded-lg bg-snow p-6" aria-labelledby="recapitulatif">
            <h2 id="recapitulatif" className="text-lg">
              Récapitulatif
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Articles ({cart.itemCount})</dt>
                <dd className="font-semibold">{formatPrice(cart.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Livraison</dt>
                <dd>Calculée à l’étape suivante</dd>
              </div>
            </dl>
            <p className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-extrabold">
              <span>Sous-total</span>
              <span>{formatPrice(cart.subtotalCents)}</span>
            </p>
            {cart.hasIssues ? (
              <p className="mt-4 text-sm font-semibold text-danger">Corrigez les articles signalés pour continuer.</p>
            ) : (
              <Link href="/commande" className="btn-primary mt-6 w-full" data-testid="checkout-link">
                Passer la commande
              </Link>
            )}
            <Link href="/catalogue" className="mt-3 block text-center text-sm font-semibold text-deep underline">
              Continuer mes achats
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
