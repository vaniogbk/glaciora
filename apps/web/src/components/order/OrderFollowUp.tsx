'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ORDER_STATUS_LABELS, countryName, formatPrice, type OrderStatus } from '@glaciora/shared';
import { api } from '@/lib/api-client';
import { OrderTracking } from './OrderTracking';

interface OrderView {
  reference: string;
  status: OrderStatus;
  createdAt: string;
  email: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shippingRateName: string;
  shipCountryCode: string;
  shipCity: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  items: { productName: string; productSlug: string; sizeLabel: string | null; quantity: number; lineTotalCents: number }[];
  proofReceived: boolean;
}

/**
 * Récapitulatif et suivi d'une commande : page de confirmation (après la commande) ou page de suivi (lien des e-mails,
 * signé par le paramètre « t », utilisable sans connexion).
 */
export function OrderFollowUp({ mode }: { mode: 'confirmation' | 'suivi' }) {
  const params = useSearchParams();
  const reference = params.get('ref') ?? '';
  const token = params.get('t');
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!/^GLA-\d{6}-[A-Z0-9]{5}$/.test(reference)) {
      setError(true);
      return;
    }
    const query = token ? `?t=${encodeURIComponent(token)}` : '';
    api<{ order: OrderView }>(`/api/checkout/orders/${reference}${query}`)
      .then((d) => setOrder(d.order))
      .catch(() => setError(true));
  }, [reference, token]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl">Commande introuvable</h1>
        <p className="mt-4 text-muted">Ouvrez le lien « Suivre ma commande » reçu par e-mail, ou retrouvez la commande dans votre compte.</p>
        <Link href="/compte/commandes" className="btn-primary mt-6">
          Mes commandes
        </Link>
      </div>
    );
  }
  if (!order) return <p className="text-center text-muted">Chargement de votre commande…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl bg-marine p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-brand text-glacier">{mode === 'confirmation' ? 'Merci pour votre commande' : 'Suivi de commande'}</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white" data-testid="confirmation-title">
          Commande {order.reference}
          {mode === 'confirmation' ? ' enregistrée' : ''}
        </h1>
        <p className="mt-3 text-white/85">
          Statut : <strong className="text-white" data-testid="order-status">{ORDER_STATUS_LABELS[order.status]}</strong>
        </p>
      </div>
      <div className="mt-8">
        <OrderTracking status={order.status} />
      </div>
      {order.trackingNumber && (
        <p className="mt-4 text-sm">
          Suivi du colis {order.trackingCarrier ? `(${order.trackingCarrier})` : ''} : <strong>{order.trackingNumber}</strong>
          {order.trackingUrl && (
            <>
              {' '}
              —{' '}
              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-deep underline">
                suivre le colis<span className="sr-only"> (nouvelle fenêtre)</span>
              </a>
            </>
          )}
        </p>
      )}
      <p className="mt-4 text-sm text-muted">Chaque étape vous est aussi annoncée par e-mail à {order.email}.</p>
      <section className="mt-8 rounded-lg border border-line p-5" aria-labelledby="recap">
        <h2 id="recap" className="text-lg">
          Récapitulatif
        </h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {order.items.map((item, index) => (
            <li key={index} className="flex justify-between gap-3 py-2">
              <span>
                {item.quantity} × {item.productName}
                {item.sizeLabel && <span className="text-muted"> — {item.sizeLabel}</span>}
              </span>
              <span className="font-semibold">{formatPrice(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between gap-3"><dt>Livraison ({order.shippingRateName}) — {order.shipCity}, {countryName(order.shipCountryCode)}</dt><dd>{formatPrice(order.shippingCents)}</dd></div>
          <div className="flex justify-between gap-3 text-lg font-extrabold"><dt>Total payé par virement</dt><dd>{formatPrice(order.totalCents)}</dd></div>
        </dl>
      </section>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/catalogue" className="btn-primary">
          Continuer mes achats
        </Link>
        <Link href="/compte/commandes" className="btn-outline">
          Mes commandes
        </Link>
      </div>
    </div>
  );
}
