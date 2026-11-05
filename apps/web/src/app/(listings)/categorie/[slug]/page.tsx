import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CatalogueView, pickParams, type SearchParams } from '@/components/catalogue/CatalogueView';
import { getCategories } from '@/lib/server-api';

const INTROS: Record<string, string> = {
  skis: 'Skis all-mountain, freeride, randonnée et junior des marques Völkl et Zag.',
  bottes: 'Chaussures de ski confort et performance Salomon, Nordica et Lange, en pointures Mondopoint.',
  hockey: 'Patins, crosses, casques et équipement d’entraînement pour le hockey sur glace.',
  accessoires: 'Casques, masques, gants et détecteurs de victimes d’avalanche pour skier en sécurité.',
};

async function findCategory(slug: string) {
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  return { category, categories };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { category } = await findCategory(params.slug);
  if (!category) return { title: 'Catégorie introuvable' };
  return {
    title: `${category.name} — ski et hockey`,
    description: `${category.name} chez GLACIORA : ${INTROS[category.slug] ?? `découvrez notre sélection ${category.name.toLowerCase()}.`} Livraison en Europe.`,
    alternates: { canonical: `/categorie/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: { params: { slug: string }; searchParams: SearchParams }) {
  const { category, categories } = await findCategory(params.slug);
  if (!category) notFound();
  const parent = category.parentId ? categories.find((c) => c.id === category.parentId) : undefined;
  const children = categories.filter((c) => c.parentId === category.id && c.productCount > 0);
  const crumbs = [...(parent ? [{ label: parent.name, href: `/categorie/${parent.slug}` }] : []), { label: category.name, href: `/categorie/${category.slug}` }];

  return (
    <div className="container py-10">
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-4 text-3xl sm:text-4xl">{category.name}</h1>
      <p className="mt-2 max-w-2xl text-muted">{INTROS[category.slug] ?? category.description ?? ''}</p>
      {children.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Sous-catégories">
          {children.map((c) => (
            <li key={c.id}>
              <Link href={`/categorie/${c.slug}`} className="inline-flex min-h-[40px] items-center rounded-full border border-line px-4 text-sm font-semibold text-marine hover:border-deep hover:text-deep">
                {c.name} <span className="ml-2 text-muted">({c.productCount})</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        {category.productCount === 0 ? (
          <p className="rounded-lg bg-snow p-8 text-center font-semibold text-marine">Cette collection arrive bientôt.</p>
        ) : (
          <CatalogueView basePath={`/categorie/${category.slug}`} params={pickParams(searchParams, { category: category.slug })} fixedCategory={category.slug} />
        )}
      </div>
    </div>
  );
}
