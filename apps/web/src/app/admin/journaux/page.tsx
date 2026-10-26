'use client';

import Link from 'next/link';
import { useState } from 'react';
import { errorMessage, useAdminData } from '@/components/admin/useAdminData';
import { api } from '@/lib/api-client';

interface Log {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  actor: { firstName: string | null; lastName: string | null; role: string } | null;
}
interface Email {
  id: string;
  template: string;
  subject: string;
  status: string;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
  provider: string | null;
  order: { id: string; reference: string } | null;
}

export default function AdminLogsPage() {
  const [entityType, setEntityType] = useState('');
  const logs = useAdminData<{ logs: Log[] }>(`/api/admin/activity${entityType ? `?entityType=${entityType}` : ''}`);
  const emails = useAdminData<{ emails: Email[] }>('/api/admin/emails');
  const [message, setMessage] = useState('');

  async function retry(id: string) {
    try {
      await api(`/api/admin/emails/${id}/retry`, { method: 'POST' });
      setMessage('E-mail remis en file d’envoi.');
      await emails.reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="titre-emails">
        <h1 id="titre-emails" className="text-2xl">E-mails transactionnels</h1>
        <p className="mt-1 text-sm text-muted">SENT = confirmé par Brevo · LOGGED = mode développement, non envoyé · FAILED = échec après toutes les tentatives.</p>
        <p aria-live="polite" className="mt-2 text-sm font-semibold text-deep">{message}</p>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="p-3">Date</th>
                <th scope="col">Sujet</th>
                <th scope="col">Commande</th>
                <th scope="col">Statut</th>
                <th scope="col" className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {emails.data?.emails.map((m) => (
                <tr key={m.id}>
                  <td className="p-3">{new Date(m.createdAt).toLocaleString('fr-FR')}</td>
                  <td>{m.subject}</td>
                  <td>{m.order ? <Link href={`/admin/commandes/${m.order.id}`} className="text-deep underline">{m.order.reference}</Link> : '—'}</td>
                  <td className={m.status === 'FAILED' ? 'font-semibold text-danger' : ''}>
                    {m.status} ({m.attempts}){m.lastError ? ` — ${m.lastError}` : ''}
                  </td>
                  <td className="p-3 text-right">
                    {(m.status === 'FAILED' || m.status === 'LOGGED') && (
                      <button type="button" className="font-semibold text-deep underline" onClick={() => retry(m.id)}>Renvoyer</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section aria-labelledby="titre-journaux">
        <h2 id="titre-journaux" className="text-2xl">Journal d’activité</h2>
        <label htmlFor="type" className="field-label mt-4">Filtrer</label>
        <select id="type" className="field-input w-56" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          <option value="">Tout</option>
          <option value="Order">Commandes</option>
          <option value="Product">Produits</option>
          <option value="ProductVariant">Variantes et stocks</option>
          <option value="User">Comptes</option>
          <option value="ShippingRate">Livraison</option>
          <option value="ImportRun">Imports</option>
        </select>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="p-3">Date</th>
                <th scope="col">Action</th>
                <th scope="col">Objet</th>
                <th scope="col">Auteur</th>
                <th scope="col" className="p-3">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.data?.logs.map((l) => (
                <tr key={l.id}>
                  <td className="p-3">{new Date(l.createdAt).toLocaleString('fr-FR')}</td>
                  <td>{l.action}</td>
                  <td>{l.entityType}{l.entityId ? ` · ${l.entityId.slice(0, 10)}` : ''}</td>
                  <td>{l.actor ? `${l.actor.firstName ?? ''} ${l.actor.lastName ?? ''} (${l.actor.role})` : 'Système / client'}</td>
                  <td className="p-3 font-mono text-xs">{l.metadata ? JSON.stringify(l.metadata).slice(0, 120) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
