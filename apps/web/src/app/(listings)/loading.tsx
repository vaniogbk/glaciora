import { CatalogueSkeleton } from '@/components/ui/Skeleton';

// Placé au niveau du groupe : affiché en arrivant sur le catalogue, une catégorie ou la recherche, mais pas à chaque
// changement de filtre (même segment), où les résultats actuels s'estompent pendant le chargement.
export default function Loading() {
  return <CatalogueSkeleton />;
}
