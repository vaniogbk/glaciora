'use client';

import Link from 'next/link';
import { ORDER_STATUS_LABELS, formatPrice, type OrderStatus } from '@glaciora/shared';
import { useAdminData } from '@/components/admin/useAdminData';

interface Dashboard {
  pendingVerification: number;
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  revenue30dCents: number;
  productsByStatus: Record<string, number>;
  lowStockVariants: number;
  failedEmails: number;
  recentOrders: { id: string; reference: string; status: OrderStatus; totalCents: number; createdAt: string; shipLastName: string }[];
}

export default function AdminDashboard() {
  const { data, error } = useAdminData<Dashboard>('/api/admin/dashboard');
  if (error) return <p role="alert" className="text-danger">{error}</p>;
  if (!data) return <p className="text-muted">Chargement…</p>;
  const tiles = [
    { label: 'Virements à vérifier', value: data.pendingVerification, href: '/admin/commandes?status=PENDING_PAYMENT_VERIFICATION', alert: data.pendingVerification > 0 },
    { label: 'CA encaissé (30 j)', value: formatPrice(data.revenue30dCents), href: '/admin/commandes?status=PAID' },
    { label: 'Produits publiés', value: data.productsByStatus.ACTIVE ?? 0, href: '/admin/produits?status=ACTIVE' },
    { label: 'Produits en brouillon', value: data.productsByStatus.DRAFT ?? 0, href: '/admin/produits?status=DRAFT' },
    { label: 'Variantes en stock faible (≤ 1)', value: data.lowStockVariants, href: '/admin/produits', alert: data.lowStockVariants > 0 },
    { label: 'E-mails en échec', value: data.failedEmails, href: '/admin/journaux', alert: data.failedEmails > 0 },
  ];
  return (
    <div>
      <h1 className="text-2xl">Tableau de bord</h1>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="card block p-5 hover:shadow-lift">
              <p className="text-sm text-muted">{t.label}</p>
              <p className={t.alert ? 'mt-1 text-3xl font-extrabold text-danger' : 'mt-1 text-3xl font-extrabold text-marine'}>{t.value}</p>
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 text-lg">Dernières commandes</h2>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th scope="col" className="p-3">Référence</th>
              <th scope="col">Client</th>
              <th scope="col">Statut</th>
              <th scope="col">Date</th>
              <th scope="col" className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.recentOrders.map((o) => (
              <tr key={o.id}>
                <td className="p-3">
                  <Link href={`/admin/commandes/${o.id}`} className="font-semibold text-deep underline">
                    {o.reference}
                  </Link>
                </td>
                <td>{o.shipLastName}</td>
                <td>{ORDER_STATUS_LABELS[o.status]}</td>
                <td>{new Date(o.createdAt).toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right font-semibold">{formatPrice(o.totalCents)}</td>
              </tr>
            ))}
            {data.recentOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-muted">
                  Aucune commande.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
