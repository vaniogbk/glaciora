'use client';

import { Suspense } from 'react';
import { OrderFollowUp } from '@/components/order/OrderFollowUp';

export default function ConfirmationPage() {
  return (
    <div className="container py-12">
      <Suspense fallback={<p className="text-center text-muted">Chargement…</p>}>
        <OrderFollowUp mode="confirmation" />
      </Suspense>
    </div>
  );
}
