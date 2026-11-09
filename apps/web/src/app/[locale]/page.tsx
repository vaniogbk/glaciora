import type { Metadata } from 'next';
import { BRAND } from '@glaciora/shared/contact';
import { ProductGrid } from '@/components/product/ProductGrid';
import { HomeVisual } from '@/components/home/HomeVisual';
import { Reveal } from '@/components/ui/Reveal';
import { getCatalogueLocalizer } from '@/i18n/catalogue';
import { Link } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { plural } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';
import { alternates, getI18n } from '@/i18n/server';
import { getCategories, getHome } from '@/lib/server-api';
import type { ProductCard } from '@/lib/types';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, m } = await getI18n(params);
  return { title: { absolute: m.meta.homeTitle }, description: m.meta.homeDescription, alternates: alternates(locale, '/') };
}

export const revalidate = 60;

function Section({ id, eyebrow, title, href, linkLabel, products, locale, m }: { id: string; eyebrow: string; title: string; href: string; linkLabel: string; products: ProductCard[]; locale: Locale; m: Messages }) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby={id} className="cv-auto container py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={id} className="mt-2 text-2xl sm:text-3xl">
            {title}
          </h2>
        </div>
        <Link href={href} className="text-sm font-semibold text-deep hover:underline">
          {linkLabel} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ProductGrid products={products} locale={locale} m={m} />
    </section>
  );
}

const ADVANTAGE_ICONS = [
  'M3 7h11v8H3zM14 10h4l3 3v2h-7M6.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Zm-3 9 2 2 4-4',
  'm12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19l1-5.8L3.5 9.2l5.9-.9L12 3Z',
  'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
];

export default async function HomePage({ params }: Params) {
  const { locale, m } = await getI18n(params);
  const h = m.home;
  const [raw, rawCategories, l10n] = await Promise.all([getHome(), getCategories(), getCatalogueLocalizer(locale, m)]);
  const home = { featured: raw.featured.map(l10n.card), ski: raw.ski.map(l10n.card), hockey: raw.hockey.map(l10n.card), accessories: raw.accessories.map(l10n.card), newest: raw.newest.map(l10n.card) };
  const tiles = l10n.categories(rawCategories).filter((c) => !c.parentId && c.productCount > 0);
  const section = { locale, m };

  return (
    <>
      <section className="relative isolate overflow-hidden bg-marine text-white" aria-labelledby="titre-accueil">
        <HomeVisual name="skiBanner" priority position="70% center" />
        <div className="absolute inset-0 bg-gradient-to-r from-marine via-marine/80 to-transparent" aria-hidden="true" />
        <div className="container relative py-20 sm:py-28 lg:py-36">
          <p className="text-xs font-semibold uppercase tracking-brand text-glacier">{h.eyebrow}</p>
          <h1 id="titre-accueil" className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Born for ice.
            <span className="block text-glacier">Made for adventure.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/85 sm:text-lg">{h.heroText}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/categorie/skis" className="btn-accent">
              {h.discoverSki} <span aria-hidden="true">→</span>
            </Link>
            <Link href="/categorie/hockey" className="btn-ghost-light">
              {h.discoverHockey} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {tiles.length > 0 && (
        <nav aria-label={h.categories} className="container -mt-8 relative z-10">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((c) => (
              <li key={c.id}>
                <Reveal>
                  <Link href={`/categorie/${c.slug}`} className="card flex h-full flex-col justify-between p-5 transition hover:-translate-y-1 hover:shadow-lift">
                    <span className="text-lg font-extrabold text-marine">{c.name}</span>
                    <span className="mt-2 text-sm text-muted">
                      {plural(locale, c.productCount, h.productCount)} <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <Section id="produits-phares" eyebrow={h.featuredEyebrow} title={h.featuredTitle} href="/catalogue" linkLabel={h.featuredLink} products={home.featured} {...section} />

      <section className="cv-auto container grid grid-cols-1 gap-4 py-6 md:grid-cols-2" aria-label={h.collections}>
        <Link href="/categorie/skis" className="group relative isolate flex min-h-[280px] overflow-hidden rounded-xl bg-marine p-8 text-white">
          <HomeVisual name="collectionSki" className="transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-marine/90 via-marine/40 to-transparent" aria-hidden="true" />
          <div className="relative mt-auto">
            <p className="text-xs font-semibold uppercase tracking-brand text-glacier">{h.collection}</p>
            <h2 className="mt-1 text-4xl font-extrabold text-white">SKI</h2>
            <p className="mt-2 text-sm text-white/85">{h.skiCollectionText}</p>
            <span className="btn mt-5 bg-white text-marine group-hover:bg-glacier">{h.seeCollection} <span aria-hidden="true">→</span></span>
          </div>
        </Link>
        <Link href="/categorie/hockey" className="group relative isolate flex min-h-[280px] overflow-hidden rounded-xl bg-marine p-8 text-white">
          <HomeVisual name="collectionHockey" className="transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-marine/90 via-marine/40 to-transparent" aria-hidden="true" />
          <div className="relative mt-auto">
            <p className="text-xs font-semibold uppercase tracking-brand text-glacier">{h.collection}</p>
            <h2 className="mt-1 text-4xl font-extrabold text-white">HOCKEY</h2>
            <p className="mt-2 text-sm text-white/85">{h.hockeyCollectionText}</p>
            <span className="btn mt-5 bg-white text-marine group-hover:bg-glacier">{h.seeCollection} <span aria-hidden="true">→</span></span>
          </div>
        </Link>
      </section>

      <Section id="bloc-ski" eyebrow={h.skiEyebrow} title={h.skiTitle} href="/categorie/skis" linkLabel={h.skiLink} products={home.ski} {...section} />
      <section className="cv-auto relative isolate overflow-hidden bg-marine text-white" aria-labelledby="banniere-hockey">
        <HomeVisual name="hockeyBanner" position="75% center" />
        <div className="absolute inset-0 bg-gradient-to-r from-marine via-marine/75 to-transparent" aria-hidden="true" />
        <div className="container relative py-20 sm:py-24">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-brand text-glacier">{h.hockeyBannerEyebrow}</p>
            <h2 id="banniere-hockey" className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              {h.hockeyBannerTitle}
            </h2>
            <p className="mt-3 text-white/85">{h.hockeyBannerText}</p>
            <Link href="/categorie/hockey" className="btn-accent mt-6">
              {h.discoverHockey} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <Section id="bloc-hockey" eyebrow={h.hockeyEyebrow} title={h.hockeyTitle} href="/categorie/hockey" linkLabel={h.hockeyLink} products={home.hockey} {...section} />
      <Section id="bloc-accessoires" eyebrow={h.accessoriesEyebrow} title={h.accessoriesTitle} href="/categorie/accessoires" linkLabel={h.accessoriesLink} products={home.accessories} {...section} />
      <Section id="nouveautes" eyebrow={h.newEyebrow} title={h.newTitle} href="/catalogue?sort=newest" linkLabel={h.newLink} products={home.newest} {...section} />

      <section aria-labelledby="avantages" className="cv-auto bg-snow py-14">
        <div className="container">
          <h2 id="avantages" className="sr-only">
            {h.whyHeading}
          </h2>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {h.advantages.map((a, index) => (
              <li key={a.title}>
                <Reveal className="flex gap-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A6FAD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                    <path d={ADVANTAGE_ICONS[index]} />
                  </svg>
                  <div>
                    <h3 className="text-base font-bold">{a.title}</h3>
                    <p className="mt-1 text-sm text-muted">{a.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="contact" className="cv-auto relative isolate overflow-hidden bg-marine py-16 text-white">
        <HomeVisual name="essentials" />
        <div className="absolute inset-0 bg-marine/80" aria-hidden="true" />
        <div className="container relative grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-brand text-glacier">{h.contactEyebrow}</p>
            <h2 id="contact" className="mt-2 text-3xl font-extrabold text-white">
              {h.contactTitle}
            </h2>
            <p className="mt-3 max-w-md text-white/85">{h.contactText}</p>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            <li>
              <a href={BRAND.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-accent w-full">
                WhatsApp<span className="sr-only"> {m.common.newWindow}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${BRAND.email}`} className="btn-ghost-light w-full">
                {m.common.email}
              </a>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
