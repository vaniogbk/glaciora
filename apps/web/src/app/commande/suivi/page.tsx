'use client';

import { Suspense } from 'react';
import { OrderFollowUp } from '@/components/order/OrderFollowUp';

/** Page ouverte depuis le lien « Suivre ma commande » des e-mails (lien signé, sans connexion). */
export default function OrderTrackingPage() {
  return (
    <div className="container py-12">
      <Suspense fallback={<p className="text-center text-muted">Chargement…</p>}>
        <OrderFollowUp mode="suivi" />
      </Suspense>
    </div>
  );
}
