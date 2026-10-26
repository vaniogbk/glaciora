import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CatalogueView, pickParams, type SearchParams } from '@/components/catalogue/CatalogueView';

export const metadata: Metadata = {
  title: 'Catalogue ski et hockey sur glace',
  description: 'Tout le catalogue GLACIORA : skis, chaussures de ski, casques, masques, DVA, patins et crosses de hockey. Filtrez par sport, taille, marque, prix et disponibilité.',
  alternates: { canonical: '/catalogue' },
};

export default function CataloguePage({ searchParams }: { searchParams: SearchParams }) {
  const params = pickParams(searchParams);
  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: 'Catalogue', href: '/catalogue' }]} />
      <h1 className="mt-4 text-3xl sm:text-4xl">Catalogue</h1>
      <p className="mt-2 max-w-2xl text-muted">Ski, hockey sur glace et accessoires de montagne : filtrez pour trouver le bon équipement.</p>
      <div className="mt-8">
        <CatalogueView basePath="/catalogue" params={params} />
      </div>
    </div>
  );
}
