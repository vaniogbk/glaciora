import clsx from 'clsx';
import { TRACKING_STEPS, trackingStep, type OrderStatus } from '@glaciora/shared';

/** Suivi en 3 étapes (En préparation → En route → Livrée) : trait d'évolution et message de l'étape en cours. */
export function OrderTracking({ status }: { status: OrderStatus }) {
  const current = trackingStep(status);
  if (!current) {
    return (
      <p role="status" className="rounded-md bg-danger/10 p-4 font-semibold text-danger" data-testid="tracking-message">
        Cette commande a été annulée. Contactez-nous pour toute question.
      </p>
    );
  }
  const progress = ((current.step - 1) / (TRACKING_STEPS.length - 1)) * 100;
  return (
    <section aria-label="Suivi de la commande" className="rounded-lg border border-line p-5">
      <div className="relative px-12">
        <div className="absolute left-12 right-12 top-4 h-1 rounded-full bg-line" aria-hidden="true">
          <div className="h-full rounded-full bg-deep transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
        </div>
        <ol className="relative flex justify-between">
          {TRACKING_STEPS.map((s) => {
            const done = s.step <= current.step;
            return (
              <li key={s.step} aria-current={s.step === current.step ? 'step' : undefined} className="flex w-0 flex-col items-center">
                <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold', done ? 'border-deep bg-deep text-white' : 'border-line bg-white text-muted')}>
                  {s.step}
                </span>
                <span className={clsx('mt-2 whitespace-nowrap text-xs font-semibold sm:text-sm', done ? 'text-marine' : 'text-muted')}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <p role="status" className="mt-6 text-center text-base font-semibold text-marine" data-testid="tracking-message">
        {current.message}
      </p>
    </section>
  );
}
