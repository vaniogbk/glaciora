import { formatPrice } from '@glaciora/shared';
import clsx from 'clsx';

interface PriceProps {
  cents: number | null;
  compareAtCents?: number | null;
  from?: boolean;
  size?: 'sm' | 'lg';
  tone?: 'dark' | 'light';
}

export function Price({ cents, compareAtCents, from, size = 'sm', tone = 'dark' }: PriceProps) {
  if (cents == null || cents <= 0) {
    return <p className={clsx('font-semibold', tone === 'dark' ? 'text-muted' : 'text-white/80', size === 'lg' ? 'text-lg' : 'text-sm')}>Prix bientôt disponible</p>;
  }
  const discounted = compareAtCents != null && compareAtCents > cents;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      {from && <span className={clsx('text-xs font-medium', tone === 'dark' ? 'text-muted' : 'text-white/80')}>À partir de</span>}
      <span className={clsx('font-extrabold', tone === 'dark' ? 'text-marine' : 'text-white', size === 'lg' ? 'text-3xl' : 'text-lg')}>{formatPrice(cents)}</span>
      {discounted && (
        <>
          <span className="sr-only">au lieu de</span>
          <s className={clsx('text-sm', tone === 'dark' ? 'text-muted' : 'text-white/70')}>{formatPrice(compareAtCents)}</s>
          <span className="rounded-sm bg-glacier px-1.5 py-0.5 text-xs font-bold text-marine">-{Math.round((1 - cents / compareAtCents) * 100)} %</span>
        </>
      )}
    </p>
  );
}
