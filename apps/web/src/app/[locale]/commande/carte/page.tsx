'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/components/providers/CartProvider';
import { PanelSkeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api-client';
import { Link, useI18n, useLocalizedRouter } from '@/i18n/client';

type CardState = 'paid' | 'pending' | 'failed';
const REFERENCE = /^GLA-\d{6}-[A-Z0-9]{5}$/;
/** Brouillon de la page de commande (même clé que /commande) : effacé une fois le paiement confirmé. */
const DRAFT_KEY = 'commande-brouillon';
/** Mollie confirme en général en quelques secondes ; au-delà, le client est prévenu par e-mail. */
const POLL_EVERY_MS = 3000;
const MAX_POLLS = 10;

/**
 * Retour de la page de paiement Mollie : l'API relit le paiement chez Mollie. Payé → page de confirmation ;
 * refusé, abandonné ou expiré → le panier est intact, le client peut réessayer ; en cours → e-mail à la confirmation.
 */
function CardReturn() {
  const { m } = useI18n();
  const t = m.checkout;
  const router = useLocalizedRouter();
  const { refresh } = useCart();
  const reference = useSearchParams().get('ref') ?? '';
  const valid = REFERENCE.test(reference);
  const [state, setState] = useState<CardState | 'checking'>(valid ? 'checking' : 'failed');
  const actions = useRef({ refresh, router });
  actions.current = { refresh, router };

  useEffect(() => {
    if (!valid) return;
    let stopped = false;
    let polls = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function check() {
      try {
        const res = await api<{ state: CardState }>(`/api/checkout/card-orders/${encodeURIComponent(reference)}`);
        if (stopped) return;
        if (res.state === 'paid') {
          try {
            window.sessionStorage.removeItem(DRAFT_KEY);
          } catch {
            /* stockage indisponible */
          }
          await actions.current.refresh();
          actions.current.router.replace(`/commande/confirmation?ref=${encodeURIComponent(reference)}`);
          return;
        }
        if (res.state === 'failed') {
          setState('failed');
          return;
        }
      } catch {
        /* réseau ou API momentanément indisponible : nouvel essai */
      }
      if (stopped) return;
      polls += 1;
      if (polls >= MAX_POLLS) setState('pending');
      else timer = setTimeout(check, POLL_EVERY_MS);
    }
    void check();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [reference, valid]);

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-line p-6 text-center" data-testid="card-return" data-state={state}>
      <h1 className="text-2xl sm:text-3xl">{state === 'failed' ? t.cardFailedTitle : t.cardReturnTitle}</h1>
      {state === 'checking' && (
        <p role="status" className="mt-4 text-muted">
          {t.cardChecking}
        </p>
      )}
      {state === 'pending' && (
        <>
          <p role="status" className="mt-4">
            {t.cardPending}
          </p>
          <p className="mt-2 font-mono font-semibold">{reference}</p>
          <Link href={`/commande/suivi?prefill=${encodeURIComponent(reference)}`} className="btn-primary mt-6">
            {m.followUp.formTitle}
          </Link>
        </>
      )}
      {state === 'failed' && (
        <>
          <p role="alert" className="mt-4">
            {t.cardFailedBody}
          </p>
          <Link href="/commande" className="btn-primary mt-6">
            {t.backToCheckout}
          </Link>
        </>
      )}
    </div>
  );
}

export default function CardReturnPage() {
  const { m } = useI18n();
  return (
    <div className="container py-12">
      <Suspense fallback={<PanelSkeleton label={m.checkout.cardChecking} />}>
        <CardReturn />
      </Suspense>
    </div>
  );
}
