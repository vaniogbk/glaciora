import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PackBuilder } from '@/components/packs/PackBuilder';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getCatalogueLocalizer } from '@/i18n/catalogue';
import { fmt, money } from '@/i18n/format';
import { alternates, getI18n } from '@/i18n/server';
import { getPack } from '@/lib/server-api';

type Props = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, m } = await getI18n(params);
  const { slug } = await params;
  const pack = await getPack(slug);
  if (!pack) return { title: m.packs.title };
  const name = (m.common.packNames as Record<string, string>)[pack.slug] ?? pack.name;
  return { title: name, description: fmt(m.packs.howItWorks, { percent: pack.discountPercent }), alternates: alternates(locale, `/packs/${pack.slug}`) };
}

export default async function PackPage({ params }: Props) {
  const { locale, m } = await getI18n(params);
  const { slug } = await params;
  const [pack, l10n] = await Promise.all([getPack(slug), getCatalogueLocalizer(locale, m)]);
  if (!pack) notFound();
  const t = m.packs;
  const name = (m.common.packNames as Record<string, string>)[pack.slug] ?? pack.name;
  const items = pack.items.map((item) => ({ ...item, name: l10n.name(item.slug, item.name), category: { ...item.category, name: l10n.category(item.category.slug, item.category.name) } }));
  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: m.nav.packs, href: '/packs' }, { label: name, href: `/packs/${pack.slug}` }]} locale={locale} m={m} />
      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="min-w-0">
          <p className="eyebrow">-{pack.discountPercent} %</p>
          <h1 className="mt-1 text-3xl sm:text-4xl">{name}</h1>
          <p className="mt-2 max-w-2xl text-muted">{fmt(t.howItWorks, { percent: pack.discountPercent })}</p>
          <h2 className="mt-8 text-xl">{t.includes}</h2>
        </div>
        <aside className="card h-fit p-5 lg:row-span-2">
          <dl className="space-y-1 text-sm">
            <div className="flex flex-wrap justify-between gap-x-3 text-muted">
              <dt>{t.regularPrice}</dt>
              <dd>{money(pack.itemsTotalCents, locale)}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-x-3 text-2xl font-extrabold text-marine">
              <dt>{t.packPrice}</dt>
              <dd data-testid="pack-price">{money(pack.packPriceCents, locale)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-sm font-semibold text-success">{fmt(t.save, { amount: money(pack.discountCents, locale) })}</p>
        </aside>
        <div className="min-w-0">
          <PackBuilder items={items} labels={{ size: t.size, addPack: t.addPack, adding: t.adding, added: t.added, addFailed: t.addFailed, viewCart: m.productClient.viewCart }} />
        </div>
      </div>
    </div>
  );
}
