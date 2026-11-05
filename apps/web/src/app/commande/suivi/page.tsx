'use client';

import { Suspense } from 'react';
import { OrderFollowUp } from '@/components/order/OrderFollowUp';
import { PanelSkeleton } from '@/components/ui/Skeleton';

/** Page ouverte depuis le lien « Suivre ma commande » des e-mails (lien signé, sans connexion). */
export default function OrderTrackingPage() {
  return (
    <div className="container py-12">
      <Suspense fallback={<PanelSkeleton label="Chargement de votre commande…" />}>
        <OrderFollowUp mode="suivi" />
      </Suspense>
    </div>
  );
}
