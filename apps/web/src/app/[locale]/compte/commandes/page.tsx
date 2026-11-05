'use client';

import { useEffect, useState } from 'react';
import type { OrderStatus } from '@glaciora/shared/order';
import { Link, useI18n } from '@/i18n/client';
import { formatDate, money } from '@/i18n/format';
import { AccountShell } from '@/components/account/AccountShell';
import { useAuth } from '@/components/providers/AuthProvider';
import { api } from '@/lib/api-client';
import { PanelSkeleton } from '@/components/ui/Skeleton';

interface OrderSummary {
  reference: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  trackingNumber: string | null;
  _count: { items: number };
  payments: { status: string }[];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { locale, m } = useI18n();
  const t = m.account;
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);

  useEffect(() => {
    if (user) api<{ orders: OrderSummary[] }>('/api/account/orders').then((d) => setOrders(d.orders)).catch(() => setOrders([]));
  }, [user]);

  return (
    <AccountShell title={t.ordersTitle}>
      {!orders ? (
        <PanelSkeleton label={t.ordersLoading} />
      ) : orders.length === 0 ? (
        <p className="rounded-lg bg-snow p-6">
          {t.noOrders}{' '}
          <Link href="/catalogue" className="font-semibold text-deep underline">
            {m.common.discoverCatalogue}
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">{t.ordersCaption}</caption>
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="py-2">{t.reference}</th>
                <th scope="col">{t.date}</th>
                <th scope="col">{t.status}</th>
                <th scope="col">{t.payment}</th>
                <th scope="col" className="text-right">{m.common.total}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.reference}>
                  <td className="py-3">
                    <Link href={`/compte/commandes/${o.reference}`} className="font-semibold text-deep underline">
                      {o.reference}
                    </Link>
                  </td>
                  <td>{formatDate(o.createdAt, locale, { dateStyle: 'short' })}</td>
                  <td>{m.orderStatus[o.status]}</td>
                  <td>{m.paymentStatus[o.payments[0]?.status ?? ''] ?? '—'}</td>
                  <td className="text-right font-semibold">{money(o.totalCents, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccountShell>
  );
}
