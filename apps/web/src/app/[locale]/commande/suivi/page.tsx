'use client';

import { Suspense } from 'react';
import { OrderFollowUp } from '@/components/order/OrderFollowUp';
import { PanelSkeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/i18n/client';

/** Page ouverte depuis le lien « Suivre ma commande » des e-mails (lien signé, sans connexion). */
export default function OrderTrackingPage() {
  const { m } = useI18n();
  return (
    <div className="container py-12">
      <Suspense fallback={<PanelSkeleton label={m.followUp.loading} />}>
        <OrderFollowUp mode="suivi" />
      </Suspense>
    </div>
  );
}
