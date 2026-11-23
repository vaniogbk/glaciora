import type { Metadata } from 'next';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Link } from '@/i18n/client';
import { fmt, money } from '@/i18n/format';
import { alternates, getI18n } from '@/i18n/server';
import { getPacks } from '@/lib/server-api';

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, m } = await getI18n(params);
  return { title: m.packs.title, description: m.packs.intro, alternates: alternates(locale, '/packs') };
}

export default async function PacksPage({ params }: Props) {
  const { locale, m } = await getI18n(params);
  const t = m.packs;
  const packs = await getPacks();
  const names = m.common.packNames as Record<string, string>;
  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: m.nav.packs, href: '/packs' }]} locale={locale} m={m} />
      <h1 className="mt-4 text-3xl sm:text-4xl">{t.title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t.intro}</p>
      {packs.length === 0 ? (
        <p className="mt-10 text-muted">{t.empty}</p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {packs.map((pack) => (
            <li key={pack.slug}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                <div className="grid grid-cols-2 gap-1 bg-snow p-2">
                  {pack.images.map((img, i) => (
                    <div key={img.url + i} className="relative aspect-square">
                      <Image src={img.url} alt={img.alt} fill sizes="(min-width: 1280px) 180px, (min-width: 768px) 25vw, 50vw" className="object-contain p-2" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="eyebrow">-{pack.discountPercent} %</p>
                  <h2 className="text-lg font-bold text-marine">
                    <Link href={`/packs/${pack.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                      {names[pack.slug] ?? pack.name}
                    </Link>
                  </h2>
                  <dl className="mt-auto space-y-1 text-sm">
                    <div className="flex flex-wrap justify-between gap-x-3 text-muted">
                      <dt>{t.regularPrice}</dt>
                      <dd>{money(pack.itemsTotalCents, locale)}</dd>
                    </div>
                    <div className="flex flex-wrap justify-between gap-x-3 text-lg font-extrabold text-marine">
                      <dt>{t.packPrice}</dt>
                      <dd>{money(pack.packPriceCents, locale)}</dd>
                    </div>
                  </dl>
                  <p className="text-sm font-semibold text-success">{fmt(t.save, { amount: money(pack.discountCents, locale) })}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
