'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, formatPrice, type OrderStatus } from '@glaciora/shared';
import { AccountShell } from '@/components/account/AccountShell';
import { useAuth } from '@/components/providers/AuthProvider';
import { api } from '@/lib/api-client';

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
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);

  useEffect(() => {
    if (user) api<{ orders: OrderSummary[] }>('/api/account/orders').then((d) => setOrders(d.orders)).catch(() => setOrders([]));
  }, [user]);

  return (
    <AccountShell title="Mes commandes">
      {!orders ? (
        <p className="text-muted">Chargement…</p>
      ) : orders.length === 0 ? (
        <p className="rounded-lg bg-snow p-6">
          Aucune commande pour le moment.{' '}
          <Link href="/catalogue" className="font-semibold text-deep underline">
            Découvrir le catalogue
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Historique des commandes</caption>
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="py-2">Référence</th>
                <th scope="col">Date</th>
                <th scope="col">Statut</th>
                <th scope="col">Paiement</th>
                <th scope="col" className="text-right">Total</th>
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
                  <td>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>{ORDER_STATUS_LABELS[o.status]}</td>
                  <td>{PAYMENT_STATUS_LABELS[o.payments[0]?.status ?? ''] ?? '—'}</td>
                  <td className="text-right font-semibold">{formatPrice(o.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccountShell>
  );
}
