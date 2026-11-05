import clsx from 'clsx';
import type { Locale } from '@/i18n/config';
import { money } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';

interface PriceProps {
  cents: number | null;
  compareAtCents?: number | null;
  from?: boolean;
  size?: 'sm' | 'lg';
  tone?: 'dark' | 'light';
  locale: Locale;
  labels: Messages['price'];
}

export function Price({ cents, compareAtCents, from, size = 'sm', tone = 'dark', locale, labels }: PriceProps) {
  if (cents == null || cents <= 0) {
    return <p className={clsx('font-semibold', tone === 'dark' ? 'text-muted' : 'text-white/80', size === 'lg' ? 'text-lg' : 'text-sm')}>{labels.soon}</p>;
  }
  const discounted = compareAtCents != null && compareAtCents > cents;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      {from && <span className={clsx('text-xs font-medium', tone === 'dark' ? 'text-muted' : 'text-white/80')}>{labels.from}</span>}
      <span className={clsx('font-extrabold', tone === 'dark' ? 'text-marine' : 'text-white', size === 'lg' ? 'text-3xl' : 'text-lg')}>{money(cents, locale)}</span>
      {discounted && (
        <>
          <span className="sr-only">{labels.insteadOf}</span>
          <s className={clsx('text-sm', tone === 'dark' ? 'text-muted' : 'text-white/70')}>{money(compareAtCents, locale)}</s>
          <span className="rounded-sm bg-glacier px-1.5 py-0.5 text-xs font-bold text-marine">-{Math.round((1 - cents / compareAtCents) * 100)} %</span>
        </>
      )}
    </p>
  );
}
