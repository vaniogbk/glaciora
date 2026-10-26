'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ORDER_STATUS_LABELS, formatPrice, type OrderStatus } from '@glaciora/shared';
import { errorMessage, useAdminData } from '@/components/admin/useAdminData';
import { api } from '@/lib/api-client';

interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { orders: number };
}
interface CustomerDetail {
  customer: Customer & { phone: string | null; orders: { id: string; reference: string; status: OrderStatus; totalCents: number; createdAt: string }[] };
}

/** Permissions limitées : consultation et activation/désactivation, pas de modification d'identité ni de mot de passe. */
export default function AdminCustomersPage() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const { data, reload } = useAdminData<{ customers: Customer[]; total: number }>(`/api/admin/customers${search ? `?q=${encodeURIComponent(search)}` : ''}`);
  const detail = useAdminData<CustomerDetail>(selected ? `/api/admin/customers/${selected}` : null);

  async function toggle(c: Customer) {
    setMessage('');
    try {
      await api(`/api/admin/customers/${c.id}`, { method: 'PATCH', json: { isActive: !c.isActive } });
      setMessage(c.isActive ? 'Compte désactivé (sessions fermées).' : 'Compte réactivé.');
      await reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  }

  return (
    <div>
      <h1 className="text-2xl">Clients</h1>
      <form className="mt-6 flex gap-3" onSubmit={(e: FormEvent) => { e.preventDefault(); setSearch(q.trim()); }}>
        <label htmlFor="client-q" className="sr-only">Rechercher un client</label>
        <input id="client-q" className="field-input w-64" placeholder="E-mail ou nom" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="btn-primary">Rechercher</button>
      </form>
      <p aria-live="polite" className="mt-3 text-sm font-semibold text-deep">{message}</p>
      <div className="mt-3 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="p-3">Client</th>
                <th scope="col">Inscription</th>
                <th scope="col">Commandes</th>
                <th scope="col">Statut</th>
                <th scope="col" className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data?.customers.map((c) => (
                <tr key={c.id}>
                  <td className="p-3">
                    <button type="button" className="text-left font-semibold text-deep underline" onClick={() => setSelected(c.id)}>
                      {c.firstName} {c.lastName}
                    </button>
                    <p className="text-xs text-muted">{c.email}</p>
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>{c._count.orders}</td>
                  <td>{c.isActive ? 'Actif' : 'Désactivé'}</td>
                  <td className="p-3 text-right">
                    <button type="button" className={c.isActive ? 'font-semibold text-danger underline' : 'font-semibold text-success underline'} onClick={() => toggle(c)}>
                      {c.isActive ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              ))}
              {data && data.customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-muted">Aucun client.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {detail.data && (
          <aside className="card h-fit p-5 text-sm" aria-label="Fiche client">
            <h2 className="text-lg">{detail.data.customer.firstName} {detail.data.customer.lastName}</h2>
            <p className="text-muted">{detail.data.customer.email}{detail.data.customer.phone ? ` · ${detail.data.customer.phone}` : ''}</p>
            <h3 className="mt-4 text-base">Commandes</h3>
            <ul className="mt-2 space-y-1">
              {detail.data.customer.orders.map((o) => (
                <li key={o.id} className="flex justify-between gap-2">
                  <Link href={`/admin/commandes/${o.id}`} className="text-deep underline">{o.reference}</Link>
                  <span className="text-muted">{ORDER_STATUS_LABELS[o.status]}</span>
                  <span>{formatPrice(o.totalCents)}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
