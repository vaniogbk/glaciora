'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ORDER_STATUSES, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, countryName, formatPrice, type OrderStatus } from '@glaciora/shared';
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

export default function OrderDetailPage({ params }: { params: { reference: string } }) {
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (user) api<{ order: OrderDetail }>(`/api/account/orders/${encodeURIComponent(params.reference)}`).then((d) => setOrder(d.order)).catch(() => setMissing(true));
  }, [user, params.reference]);

  return (
    <AccountShell title={`Commande ${params.reference}`}>
      {missing && <p>Commande introuvable.</p>}
      {order && (
        <div className="space-y-8">
          <OrderTracking status={order.status} />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-5 text-sm">
              <h2 className="text-base">Paiement</h2>
              <p className="mt-2">Virement bancaire — {PAYMENT_STATUS_LABELS[order.payments[0]?.status ?? ''] ?? '—'}</p>
              <p className="text-muted">Justificatif{order.proofs.length > 1 ? 's' : ''} reçu{order.proofs.length > 1 ? 's' : ''} : {order.proofs.length}</p>
            </div>
            <div className="card p-5 text-sm">
              <h2 className="text-base">Livraison</h2>
              <address className="mt-2 not-italic">
                {order.shipFirstName} {order.shipLastName}
                <br />
                {order.shipLine1}
                {order.shipLine2 ? `, ${order.shipLine2}` : ''}
                <br />
                {order.shipPostalCode} {order.shipCity}, {countryName(order.shipCountryCode)}
              </address>
              {order.trackingNumber ? (
                <p className="mt-3">
                  Suivi {order.trackingCarrier ?? ''} : <strong>{order.trackingNumber}</strong>{' '}
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-deep underline">
                      Suivre le colis<span className="sr-only"> (nouvelle fenêtre)</span>
                    </a>
                  )}
                </p>
              ) : (
                <p className="mt-3 text-muted">Le numéro de suivi apparaîtra ici à l’expédition.</p>
              )}
            </div>
          </div>
          <table className="w-full text-sm">
            <caption className="sr-only">Articles commandés</caption>
            <tbody className="divide-y divide-line">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2">
                    <Link href={`/produit/${item.productSlug}`} className="font-semibold text-marine hover:underline">
                      {item.productName}
                    </Link>
                    {item.sizeLabel && <span className="text-muted"> — {item.sizeLabel}</span>}
                  </td>
                  <td className="text-right">{item.quantity} × {formatPrice(item.unitPriceCents)}</td>
                  <td className="text-right font-semibold">{formatPrice(item.lineTotalCents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-line">
              <tr>
                <td colSpan={2} className="pt-3 text-right">Livraison ({order.shippingRateName})</td>
                <td className="pt-3 text-right">{formatPrice(order.shippingCents)}</td>
              </tr>
              <tr className="text-lg font-extrabold">
                <td colSpan={2} className="text-right">Total</td>
                <td className="text-right">{formatPrice(order.totalCents)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </AccountShell>
  );
}
