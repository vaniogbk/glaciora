'use client';

import { Suspense } from 'react';
import { OrderFollowUp } from '@/components/order/OrderFollowUp';
import { PanelSkeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/i18n/client';

export default function ConfirmationPage() {
  const { m } = useI18n();
  return (
    <div className="container py-12">
      <Suspense fallback={<PanelSkeleton label={m.followUp.loading} />}>
        <OrderFollowUp mode="confirmation" />
      </Suspense>
    </div>
  );
}
