import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CatalogueView, pickParams, type SearchParams } from '@/components/catalogue/CatalogueView';

export const metadata: Metadata = {
  title: 'Recherche',
  description: 'Recherchez un ski, une chaussure, un patin, une crosse ou un accessoire dans le catalogue GLACIORA.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/recherche' },
};

export default function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = pickParams(searchParams);
  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: 'Recherche', href: '/recherche' }]} />
      <h1 className="mt-4 text-3xl sm:text-4xl">{params.q ? `Résultats pour « ${params.q} »` : 'Recherche'}</h1>
      <form action="/recherche" role="search" className="mt-6 flex max-w-xl gap-2">
        <label htmlFor="recherche-page" className="sr-only">
          Rechercher un produit
        </label>
        <input id="recherche-page" name="q" type="search" defaultValue={params.q ?? ''} placeholder="Ski, patins, casque, Völkl…" className="field-input" />
        <button type="submit" className="btn-primary">
          Rechercher
        </button>
      </form>
      <div className="mt-8">
        <CatalogueView basePath="/recherche" params={params} />
      </div>
    </div>
  );
}
