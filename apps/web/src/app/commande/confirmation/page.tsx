'use client';

import { Suspense } from 'react';
import { OrderFollowUp } from '@/components/order/OrderFollowUp';
import { PanelSkeleton } from '@/components/ui/Skeleton';

export default function ConfirmationPage() {
  return (
    <div className="container py-12">
      <Suspense fallback={<PanelSkeleton label="Chargement de votre commande…" />}>
        <OrderFollowUp mode="confirmation" />
      </Suspense>
    </div>
  );
}
