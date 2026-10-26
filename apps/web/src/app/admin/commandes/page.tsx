'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { ORDER_STATUSES, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, countryName, formatPrice, type OrderStatus } from '@glaciora/shared';
import { useAdminData } from '@/components/admin/useAdminData';

interface OrdersResponse {
  total: number;
  page: number;
  totalPages: number;
  orders: {
    id: string;
    reference: string;
    status: OrderStatus;
    totalCents: number;
    createdAt: string;
    shipFirstName: string;
    shipLastName: string;
    shipCountryCode: string;
    payments: { status: string }[];
    _count: { proofs: number; items: number };
  }[];
}

function OrdersList() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const query = new URLSearchParams();
  for (const key of ['status', 'q', 'page']) if (params.get(key)) query.set(key, params.get(key)!);
  const { data, error } = useAdminData<OrdersResponse>(`/api/admin/orders?${query}`);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    router.push(`/admin/commandes?${next}`);
  }

  return (
    <div>
      <h1 className="text-2xl">Commandes</h1>
      <form
        className="mt-6 flex flex-wrap gap-3"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          setParam('q', q.trim());
        }}
      >
        <label htmlFor="statut" className="sr-only">
          Statut
        </label>
        <select id="statut" className="field-input w-auto" value={params.get('status') ?? ''} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">Tous les statuts</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <label htmlFor="recherche-commande" className="sr-only">
          Rechercher
        </label>
        <input id="recherche-commande" className="field-input w-64" placeholder="Référence, e-mail, nom" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="btn-primary">
          Rechercher
        </button>
      </form>
      {error && <p role="alert" className="mt-4 text-danger">{error}</p>}
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th scope="col" className="p-3">Référence</th>
              <th scope="col">Client</th>
              <th scope="col">Pays</th>
              <th scope="col">Statut</th>
              <th scope="col">Paiement</th>
              <th scope="col">Justificatif</th>
              <th scope="col">Date</th>
              <th scope="col" className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data?.orders.map((o) => (
              <tr key={o.id}>
                <td className="p-3">
                  <Link href={`/admin/commandes/${o.id}`} className="font-semibold text-deep underline">
                    {o.reference}
                  </Link>
                </td>
                <td>{o.shipFirstName} {o.shipLastName}</td>
                <td>{countryName(o.shipCountryCode)}</td>
                <td>{ORDER_STATUS_LABELS[o.status]}</td>
                <td>{PAYMENT_STATUS_LABELS[o.payments[0]?.status ?? ''] ?? '—'}</td>
                <td>{o._count.proofs > 0 ? 'Oui' : 'Non'}</td>
                <td>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                <td className="p-3 text-right font-semibold">{formatPrice(o.totalCents)}</td>
              </tr>
            ))}
            {data && data.orders.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-muted">
                  Aucune commande.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" className={p === data.page ? 'btn bg-marine text-white' : 'btn-outline'} onClick={() => setParam('page', String(p))}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <OrdersList />
    </Suspense>
  );
}
