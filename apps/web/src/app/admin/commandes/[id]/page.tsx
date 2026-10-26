'use client';

import { useState, type FormEvent } from 'react';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, countryName, formatPrice, type OrderStatus } from '@glaciora/shared';
import { errorMessage, useAdminData } from '@/components/admin/useAdminData';
import { api } from '@/lib/api-client';

interface AdminOrder {
  order: {
    id: string;
    reference: string;
    status: OrderStatus;
    email: string;
    createdAt: string;
    shipFirstName: string;
    shipLastName: string;
    shipCompany: string | null;
    shipLine1: string;
    shipLine2: string | null;
    shipPostalCode: string;
    shipCity: string;
    shipRegion: string | null;
    shipCountryCode: string;
    shipPhone: string;
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
    shippingRateName: string;
    customerNote: string | null;
    adminNote: string | null;
    trackingCarrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    items: { id: string; productName: string; productReference: string; variantSku: string; sizeLabel: string | null; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
    payments: { id: string; method: string; status: string; amountCents: number; transferReference: string | null; receivingAccount: string | null; verifiedAt: string | null; rejectionReason: string | null; verifiedBy: { firstName: string | null; lastName: string | null } | null }[];
    proofs: { id: string; originalName: string; mimeType: string; sizeBytes: number; createdAt: string; deletedAt: string | null }[];
    emails: { id: string; template: string; status: string; attempts: number; sentAt: string | null; lastError: string | null }[];
  };
  activity: { id: string; action: string; createdAt: string; metadata: unknown; actor: { firstName: string | null; lastName: string | null } | null }[];
  allowedTransitions: OrderStatus[];
}

export default function AdminOrderPage({ params }: { params: { id: string } }) {
  const { data, error, reload } = useAdminData<AdminOrder>(`/api/admin/orders/${params.id}`);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function act(fn: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage('');
    try {
      await fn();
      setMessage(success);
      await reload();
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function onStatus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const json = {
      status: f.get('status'),
      trackingCarrier: String(f.get('trackingCarrier') ?? '') || undefined,
      trackingNumber: String(f.get('trackingNumber') ?? '') || undefined,
      trackingUrl: String(f.get('trackingUrl') ?? ''),
      adminNote: String(f.get('adminNote') ?? '') || undefined,
      notifyCustomer: f.get('notifyCustomer') === 'on',
    };
    if (json.status === 'CANCELLED' && !window.confirm('Annuler la commande ? Le stock sera remis en vente.')) return;
    void act(() => api(`/api/admin/orders/${params.id}/status`, { method: 'PATCH', json }), 'Statut mis à jour.');
  }

  if (error) return <p role="alert" className="text-danger">{error}</p>;
  if (!data) return <p className="text-muted">Chargement…</p>;
  const { order } = data;
  const payment = order.payments[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">Commande {order.reference}</h1>
        <span className="rounded-sm bg-marine px-2 py-1 text-xs font-bold text-white" data-testid="admin-order-status">
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>
      <p aria-live="polite" className="text-sm font-semibold text-deep">
        {message}
      </p>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-5 text-sm xl:col-span-2" aria-labelledby="paiement">
          <h2 id="paiement" className="text-lg">
            Paiement et justificatif
          </h2>
          {payment && (
            <dl className="mt-3 grid grid-cols-2 gap-2">
              <dt className="text-muted">Montant attendu</dt>
              <dd className="font-bold">{formatPrice(payment.amountCents)}</dd>
              <dt className="text-muted">Référence de virement</dt>
              <dd className="font-mono font-bold">{payment.transferReference}</dd>
              <dt className="text-muted">Compte de réception</dt>
              <dd>{payment.receivingAccount ?? '—'}</dd>
              <dt className="text-muted">Statut</dt>
              <dd>{PAYMENT_STATUS_LABELS[payment.status]}</dd>
              {payment.verifiedAt && (
                <>
                  <dt className="text-muted">Vérifié le</dt>
                  <dd>
                    {new Date(payment.verifiedAt).toLocaleString('fr-FR')} par {payment.verifiedBy?.firstName} {payment.verifiedBy?.lastName}
                  </dd>
                </>
              )}
              {payment.rejectionReason && (
                <>
                  <dt className="text-muted">Motif du refus</dt>
                  <dd>{payment.rejectionReason}</dd>
                </>
              )}
            </dl>
          )}
          <h3 className="mt-5 text-base">Confirmation(s) de virement</h3>
          <ul className="mt-2 space-y-2">
            {order.proofs.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-md bg-snow p-3">
                <span className="font-semibold">{p.originalName}</span>
                <span className="text-muted">
                  {p.mimeType} · {Math.round(p.sizeBytes / 1024)} Ko · {new Date(p.createdAt).toLocaleString('fr-FR')}
                </span>
                {p.deletedAt ? (
                  <span className="text-muted">Supprimé (conservation expirée)</span>
                ) : (
                  <span className="ml-auto flex gap-3">
                    <a href={`/api/admin/orders/${order.id}/proofs/${p.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-deep underline" data-testid="view-proof">
                      Ouvrir
                    </a>
                    <a href={`/api/admin/orders/${order.id}/proofs/${p.id}?download=1`} className="font-semibold text-deep underline">
                      Télécharger
                    </a>
                  </span>
                )}
              </li>
            ))}
          </ul>
          {order.status === 'PENDING_PAYMENT_VERIFICATION' && payment && (
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                data-testid="mark-paid"
                onClick={() => act(() => api(`/api/admin/orders/${order.id}/status`, { method: 'PATCH', json: { status: 'PAID', notifyCustomer: true } }), 'Virement vérifié : commande marquée payée.')}
              >
                Virement reçu : marquer payée
              </button>
              <button
                type="button"
                className="btn-outline"
                disabled={busy}
                onClick={() => {
                  const reason = window.prompt('Motif du refus du justificatif ?');
                  if (reason) void act(() => api(`/api/admin/orders/${order.id}/payments/${payment.id}/reject`, { method: 'POST', json: { reason } }), 'Justificatif refusé.');
                }}
              >
                Refuser le justificatif
              </button>
            </div>
          )}
        </section>

        <section className="card p-5 text-sm" aria-labelledby="client">
          <h2 id="client" className="text-lg">
            Client et livraison
          </h2>
          <address className="mt-3 not-italic">
            {order.shipFirstName} {order.shipLastName}
            {order.shipCompany && <><br />{order.shipCompany}</>}
            <br />
            {order.shipLine1}
            {order.shipLine2 && <><br />{order.shipLine2}</>}
            <br />
            {order.shipPostalCode} {order.shipCity} {order.shipRegion ?? ''}
            <br />
            {countryName(order.shipCountryCode)}
            <br />
            <a href={`tel:${order.shipPhone}`} className="text-deep underline">{order.shipPhone}</a>
            <br />
            <a href={`mailto:${order.email}`} className="text-deep underline">{order.email}</a>
          </address>
          <p className="mt-3 text-muted">Livraison : {order.shippingRateName}</p>
          {order.customerNote && <p className="mt-3 rounded-md bg-snow p-3">Note client : {order.customerNote}</p>}
        </section>
      </div>

      <section className="card overflow-x-auto p-5" aria-labelledby="articles">
        <h2 id="articles" className="text-lg">
          Articles
        </h2>
        <table className="mt-3 w-full min-w-[560px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th scope="col">Produit</th>
              <th scope="col">SKU</th>
              <th scope="col">Taille</th>
              <th scope="col" className="text-right">Qté</th>
              <th scope="col" className="text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.items.map((i) => (
              <tr key={i.id}>
                <td className="py-2">{i.productName} <span className="text-muted">({i.productReference})</span></td>
                <td>{i.variantSku}</td>
                <td>{i.sizeLabel ?? '—'}</td>
                <td className="text-right">{i.quantity}</td>
                <td className="text-right font-semibold">{formatPrice(i.lineTotalCents)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="pt-3 text-right">Livraison</td>
              <td className="pt-3 text-right">{formatPrice(order.shippingCents)}</td>
            </tr>
            <tr className="font-extrabold">
              <td colSpan={4} className="text-right">Total</td>
              <td className="text-right">{formatPrice(order.totalCents)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="card p-5" aria-labelledby="statut-commande">
        <h2 id="statut-commande" className="text-lg">
          Statut et suivi de livraison
        </h2>
        {data.allowedTransitions.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Aucun changement de statut possible.</p>
        ) : (
          <form onSubmit={onStatus} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="status" className="field-label">Nouveau statut</label>
              <select id="status" name="status" className="field-input">
                {data.allowedTransitions.map((s) => (
                  <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="trackingCarrier" className="field-label">Transporteur</label>
              <input id="trackingCarrier" name="trackingCarrier" defaultValue={order.trackingCarrier ?? ''} className="field-input" />
            </div>
            <div>
              <label htmlFor="trackingNumber" className="field-label">Numéro de suivi</label>
              <input id="trackingNumber" name="trackingNumber" defaultValue={order.trackingNumber ?? ''} className="field-input" />
            </div>
            <div>
              <label htmlFor="trackingUrl" className="field-label">Lien de suivi</label>
              <input id="trackingUrl" name="trackingUrl" type="url" defaultValue={order.trackingUrl ?? ''} className="field-input" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="adminNote" className="field-label">Note interne</label>
              <input id="adminNote" name="adminNote" defaultValue={order.adminNote ?? ''} className="field-input" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="notifyCustomer" defaultChecked className="h-4 w-4 accent-deep" /> Prévenir le client par e-mail
            </label>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary" disabled={busy}>Mettre à jour</button>
            </div>
          </form>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5 text-sm" aria-labelledby="emails">
          <h2 id="emails" className="text-lg">E-mails</h2>
          <ul className="mt-3 space-y-2">
            {order.emails.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-2">
                <span>{m.template}</span>
                <span className={m.status === 'FAILED' ? 'font-semibold text-danger' : 'text-muted'}>
                  {m.status} ({m.attempts} tentative{m.attempts > 1 ? 's' : ''}){m.lastError ? ` — ${m.lastError}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5 text-sm" aria-labelledby="historique">
          <h2 id="historique" className="text-lg">Historique</h2>
          <ul className="mt-3 space-y-2">
            {data.activity.map((a) => (
              <li key={a.id}>
                <span className="text-muted">{new Date(a.createdAt).toLocaleString('fr-FR')}</span> — {a.action}
                {a.actor && ` par ${a.actor.firstName ?? ''} ${a.actor.lastName ?? ''}`}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
