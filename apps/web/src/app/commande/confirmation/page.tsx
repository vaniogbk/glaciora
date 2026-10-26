'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ORDER_STATUS_LABELS, countryName, formatPrice, type OrderStatus } from '@glaciora/shared';
import { api } from '@/lib/api-client';

interface Confirmation {
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
  items: { productName: string; productSlug: string; sizeLabel: string | null; quantity: number; lineTotalCents: number }[];
  proofReceived: boolean;
}

function ConfirmationContent() {
  const params = useSearchParams();
  const reference = params.get('ref') ?? '';
  const [order, setOrder] = useState<Confirmation | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!/^GLA-\d{6}-[A-Z0-9]{5}$/.test(reference)) {
      setError(true);
      return;
    }
    api<{ order: Confirmation }>(`/api/checkout/orders/${reference}`)
      .then((d) => setOrder(d.order))
      .catch(() => setError(true));
  }, [reference]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl">Commande introuvable</h1>
        <p className="mt-4 text-muted">Ce récapitulatif n’est accessible que depuis le navigateur ayant passé la commande, ou depuis votre compte.</p>
        <Link href="/compte/commandes" className="btn-primary mt-6">
          Mes commandes
        </Link>
      </div>
    );
  }
  if (!order) return <p className="text-center text-muted">Chargement de votre commande…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl bg-marine p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-brand text-glacier">Merci pour votre commande</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white" data-testid="confirmation-title">
          Commande {order.reference} enregistrée
        </h1>
        <p className="mt-3 text-white/85">
          Statut : <strong className="text-white" data-testid="order-status">{ORDER_STATUS_LABELS[order.status]}</strong>
        </p>
      </div>
      <ol className="mt-8 space-y-4 text-sm">
        <li className="flex gap-3"><span className="font-bold text-deep">1.</span> Votre confirmation de virement {order.proofReceived ? 'a bien été reçue' : 'est en attente'}.</li>
        <li className="flex gap-3"><span className="font-bold text-deep">2.</span> Nous vérifions la réception du virement sur notre compte.</li>
        <li className="flex gap-3"><span className="font-bold text-deep">3.</span> Nous préparons puis expédions votre commande, avec un numéro de suivi par e-mail à {order.email}.</li>
      </ol>
      <section className="mt-8 rounded-lg border border-line p-5" aria-labelledby="recap">
        <h2 id="recap" className="text-lg">
          Récapitulatif
        </h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {order.items.map((item, index) => (
            <li key={index} className="flex justify-between py-2">
              <span>
                {item.quantity} × {item.productName}
                {item.sizeLabel && <span className="text-muted"> — {item.sizeLabel}</span>}
              </span>
              <span className="font-semibold">{formatPrice(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt>Livraison ({order.shippingRateName}) — {countryName(order.shipCountryCode)}</dt><dd>{formatPrice(order.shippingCents)}</dd></div>
          <div className="flex justify-between text-lg font-extrabold"><dt>Total payé par virement</dt><dd>{formatPrice(order.totalCents)}</dd></div>
        </dl>
      </section>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/catalogue" className="btn-primary">
          Continuer mes achats
        </Link>
        <Link href="/compte/commandes" className="btn-outline">
          Suivre mes commandes
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <div className="container py-12">
      <Suspense fallback={<p className="text-center text-muted">Chargement…</p>}>
        <ConfirmationContent />
      </Suspense>
    </div>
  );
}
