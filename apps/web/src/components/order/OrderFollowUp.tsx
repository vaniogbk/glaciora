'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { OrderStatus } from '@glaciora/shared/order';
import { Link, useI18n } from '@/i18n/client';
import { countryName, fmt, money } from '@/i18n/format';
import { sizeLabel } from '@/i18n/labels';
import { api } from '@/lib/api-client';
import { OrderTracking } from './OrderTracking';
import { PanelSkeleton } from '@/components/ui/Skeleton';

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
  const { locale, m } = useI18n();
  const t = m.followUp;
  const price = (cents: number) => money(cents, locale);
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
        <h1 className="text-3xl">{t.notFoundTitle}</h1>
        <p className="mt-4 text-muted">{t.notFoundText}</p>
        <Link href="/compte/commandes" className="btn-primary mt-6">
          {m.common.myOrders}
        </Link>
      </div>
    );
  }
  if (!order) return <div className="mx-auto max-w-2xl"><PanelSkeleton rows={6} label={t.loading} /></div>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl bg-marine p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-brand text-glacier">{mode === 'confirmation' ? t.thanks : t.trackingEyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white" data-testid="confirmation-title">
          {fmt(mode === 'confirmation' ? t.orderRegistered : t.orderTitle, { reference: order.reference })}
        </h1>
        <p className="mt-3 text-white/85">
          {t.status} <strong className="text-white" data-testid="order-status">{m.orderStatus[order.status]}</strong>
        </p>
      </div>
      <div className="mt-8">
        <OrderTracking status={order.status} />
      </div>
      {order.trackingNumber && (
        <p className="mt-4 text-sm">
          {fmt(t.parcel, { carrier: order.trackingCarrier ? `(${order.trackingCarrier})` : '' })} <strong>{order.trackingNumber}</strong>
          {order.trackingUrl && (
            <>
              {' '}
              —{' '}
              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-deep underline">
                {t.trackParcel}<span className="sr-only"> {m.common.newWindow}</span>
              </a>
            </>
          )}
        </p>
      )}
      <p className="mt-4 text-sm text-muted">{fmt(t.emailNotice, { email: order.email })}</p>
      <section className="mt-8 rounded-lg border border-line p-5" aria-labelledby="recap">
        <h2 id="recap" className="text-lg">
          {m.common.summary}
        </h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {order.items.map((item, index) => (
            <li key={index} className="flex justify-between gap-3 py-2">
              <span>
                {item.quantity} × {item.productName}
                {item.sizeLabel && <span className="text-muted"> — {sizeLabel(item.sizeLabel, m.productClient.sizeWords)}</span>}
              </span>
              <span className="font-semibold">{price(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between gap-3"><dt>{fmt(t.shippingLine, { rate: order.shippingRateName, city: order.shipCity, country: countryName(order.shipCountryCode, locale) })}</dt><dd>{price(order.shippingCents)}</dd></div>
          <div className="flex justify-between gap-3 text-lg font-extrabold"><dt>{t.totalPaid}</dt><dd>{price(order.totalCents)}</dd></div>
        </dl>
      </section>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/catalogue" className="btn-primary">
          {m.common.continueShopping}
        </Link>
        <Link href="/compte/commandes" className="btn-outline">
          {m.common.myOrders}
        </Link>
      </div>
    </div>
  );
}
