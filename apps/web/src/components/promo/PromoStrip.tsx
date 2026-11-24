import { Link } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { fmt, promoLastDay } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';
import type { Promotion } from '@/lib/types';

/** Bandeau en haut de chaque page pendant une promotion (affiché seulement si l'API l'applique au panier). */
export function PromoStrip({ promotion, locale, m }: { promotion: Promotion; locale: Locale; m: Messages }) {
  return (
    <aside aria-label={m.promo.boardLabel} className="bg-glacier text-marine" data-testid="promo-strip">
      <p className="container flex min-h-[44px] flex-wrap items-center justify-center gap-x-3 py-1 text-center text-sm font-bold">
        <span className="min-w-0">{fmt(m.promo.strip, { percent: promotion.percent, date: promoLastDay(promotion.endsAt, locale) })}</span>
        <Link href="/catalogue" className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:text-deep">
          {m.promo.stripLink} <span aria-hidden="true">→</span>
        </Link>
      </p>
    </aside>
  );
}
