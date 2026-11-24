import Image from 'next/image';
import clsx from 'clsx';
import { Link } from '@/i18n/client';
import { intlLocale, type Locale } from '@/i18n/config';
import { fmt, promoLastDay } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';
import type { ProductCard, Promotion } from '@/lib/types';
import { PinStrings } from './PinStrings';

/** Punaise : le fil rouge passe par toutes les punaises du tableau. */
function Pin() {
  return <span data-pin aria-hidden="true" className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger shadow-card ring-2 ring-white/70" />;
}

/**
 * Annonce du Black Friday en « tableau d'enquête » : fiches et notes épinglées, photos de vrais articles du catalogue
 * reliées par un fil rouge. Uniquement l'offre réelle renvoyée par l'API (pourcentage, date de fin), aucun prix inventé.
 */
export function BlackFridayBoard({ promotion, products, locale, m }: { promotion: Promotion; products: ProductCard[]; locale: Locale; m: Messages }) {
  const t = m.promo;
  const date = promoLastDay(promotion.endsAt, locale);
  const percent = new Intl.NumberFormat(intlLocale(locale), { style: 'percent' }).format(-promotion.percent / 100);
  const photos = products.filter((p) => p.image).slice(0, 2);
  const clue = (title: string, text: string, tilt: string) => (
    <div className={clsx('relative bg-paper p-5 text-marine shadow-card', tilt)}>
      <Pin />
      <h3 className="text-base font-extrabold">{title}</h3>
      <p className="mt-1 text-sm">{text}</p>
    </div>
  );
  const photo = (p: ProductCard, i: number, tilt: string) => (
    <figure key={p.id} className={clsx('relative bg-white p-3 pb-4 shadow-card', tilt)}>
      <Pin />
      <Link href={`/produit/${p.slug}`} className="block">
        <span className="relative block aspect-square">
          <Image src={p.image!.url} alt={p.image!.alt} fill sizes="(min-width: 1024px) 22vw, (min-width: 768px) 45vw, 90vw" className="object-contain" />
        </span>
        <figcaption className="mt-3 text-xs">
          <span className="block font-semibold uppercase tracking-brand text-muted">{fmt(t.evidence, { n: i + 1 })}</span>
          <span className="mt-0.5 block font-bold text-marine">
            {p.brand} {p.name}
          </span>
        </figcaption>
      </Link>
    </figure>
  );

  return (
    <section aria-labelledby="black-friday" className="container py-10" data-testid="black-friday-board">
      <div
        data-board
        className="relative overflow-hidden rounded-lg bg-marine bg-[radial-gradient(theme(colors.frost/15%)_1px,transparent_1px)] bg-[length:18px_18px] p-5 pt-8 shadow-lift sm:p-8 sm:pt-10 lg:p-10"
      >
        <PinStrings />
        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <article className="relative bg-paper p-6 text-marine shadow-card md:col-span-2 md:-rotate-1">
            <Pin />
            <span aria-hidden="true" className="absolute right-4 top-4 rotate-6 rounded-sm border-2 border-danger px-2 py-0.5 text-xs font-extrabold uppercase tracking-brand text-danger">
              Black Friday
            </span>
            <p className="pr-28 text-xs font-bold uppercase tracking-brand text-muted">{t.boardCase}</p>
            <h2 id="black-friday" className="mt-3 text-2xl font-extrabold sm:text-3xl">
              {t.boardTitle}
            </h2>
            <p className="mt-3 max-w-prose text-sm sm:text-base">{t.boardIntro}</p>
            <Link href="/catalogue" className="btn-primary mt-5">
              {t.cta} <span aria-hidden="true">→</span>
            </Link>
          </article>
          <div className="relative self-start bg-note p-6 text-marine shadow-card md:rotate-2">
            <Pin />
            <p className="text-5xl font-extrabold leading-none sm:text-6xl">{percent}</p>
            <p className="mt-3 text-lg font-bold">{t.discountLabel}</p>
          </div>
          {photos[0] && photo(photos[0], 0, 'md:-rotate-2')}
          {clue(t.autoTitle, t.autoText, 'md:rotate-1')}
          {photos[1] && photo(photos[1], 1, 'md:rotate-2')}
          {clue(t.packsTitle, fmt(t.packsText, { percent: promotion.percent }), 'md:-rotate-1')}
          {clue(t.endTitle, fmt(t.endText, { date }), 'md:rotate-1')}
        </div>
        <p className="relative z-20 mt-8 text-xs text-white/80">{t.finePrint}</p>
      </div>
    </section>
  );
}
