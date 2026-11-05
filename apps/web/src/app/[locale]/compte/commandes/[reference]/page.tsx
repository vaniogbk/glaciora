'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { OrderStatus } from '@glaciora/shared/order';
import { Link, useI18n } from '@/i18n/client';
import { countryName, fmt, money, plural } from '@/i18n/format';
import { sizeLabel } from '@/i18n/labels';
import { AccountShell } from '@/components/account/AccountShell';
import { useAuth } from '@/components/providers/AuthProvider';
import { api } from '@/lib/api-client';
import { OrderTracking } from '@/components/order/OrderTracking';

interface OrderDetail {
  reference: string;
  status: OrderStatus;
  createdAt: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shippingRateName: string;
  shipFirstName: string;
  shipLastName: string;
  shipLine1: string;
  shipLine2: string | null;
  shipPostalCode: string;
  shipCity: string;
  shipCountryCode: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  items: { id: string; productName: string; productSlug: string; sizeLabel: string | null; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
  payments: { method: string; status: string; amountCents: number; verifiedAt: string | null }[];
  proofs: { createdAt: string; originalName: string }[];
}

export default function OrderDetailPage() {
  const { reference } = useParams<{ reference: string }>();
  const { user } = useAuth();
  const { locale, m } = useI18n();
  const t = m.account;
  const price = (cents: number) => money(cents, locale);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (user) api<{ order: OrderDetail }>(`/api/account/orders/${encodeURIComponent(reference)}`).then((d) => setOrder(d.order)).catch(() => setMissing(true));
  }, [user, reference]);

  return (
    <AccountShell title={fmt(t.orderTitle, { reference })}>
      {missing && <p>{t.orderNotFound}</p>}
      {order && (
        <div className="space-y-8">
          <OrderTracking status={order.status} />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-5 text-sm">
              <h2 className="text-base">{t.payment}</h2>
              <p className="mt-2">{t.bankTransfer} — {m.paymentStatus[order.payments[0]?.status ?? ''] ?? '—'}</p>
              <p className="text-muted">{plural(locale, order.proofs.length, t.proofsReceived)}</p>
            </div>
            <div className="card p-5 text-sm">
              <h2 className="text-base">{t.delivery}</h2>
              <address className="mt-2 not-italic">
                {order.shipFirstName} {order.shipLastName}
                <br />
                {order.shipLine1}
                {order.shipLine2 ? `, ${order.shipLine2}` : ''}
                <br />
                {order.shipPostalCode} {order.shipCity}, {countryName(order.shipCountryCode, locale)}
              </address>
              {order.trackingNumber ? (
                <p className="mt-3">
                  {fmt(t.tracking, { carrier: order.trackingCarrier ?? '' })} <strong>{order.trackingNumber}</strong>{' '}
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-deep underline">
                      {t.trackParcel}<span className="sr-only"> {m.common.newWindow}</span>
                    </a>
                  )}
                </p>
              ) : (
                <p className="mt-3 text-muted">{t.trackingSoon}</p>
              )}
            </div>
          </div>
          <table className="w-full text-sm">
            <caption className="sr-only">{t.itemsCaption}</caption>
            <tbody className="divide-y divide-line">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2">
                    <Link href={`/produit/${item.productSlug}`} className="font-semibold text-marine hover:underline">
                      {item.productName}
                    </Link>
                    {item.sizeLabel && <span className="text-muted"> — {sizeLabel(item.sizeLabel, m.productClient.sizeWords)}</span>}
                  </td>
                  <td className="text-right">{item.quantity} × {price(item.unitPriceCents)}</td>
                  <td className="text-right font-semibold">{price(item.lineTotalCents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-line">
              <tr>
                <td colSpan={2} className="pt-3 text-right">{fmt(t.shippingRate, { rate: order.shippingRateName })}</td>
                <td className="pt-3 text-right">{price(order.shippingCents)}</td>
              </tr>
              <tr className="text-lg font-extrabold">
                <td colSpan={2} className="text-right">{m.common.total}</td>
                <td className="text-right">{price(order.totalCents)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </AccountShell>
  );
}
