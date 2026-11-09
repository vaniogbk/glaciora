import clsx from 'clsx';

/** Bloc gris à la forme du contenu attendu (pulsation désactivée si l'utilisateur réduit les animations). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={clsx('rounded-md bg-line/70 motion-safe:animate-pulse', className)} />;
}

/** Grille de cartes produit en attente (mêmes proportions que ProductCard). */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-lg bg-white shadow-card">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Zone filtres + grille du catalogue en attente (titre de page déjà affiché). */
export function CatalogueBodySkeleton({ label }: { label: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="hidden space-y-4 rounded-lg bg-snow p-5 lg:block">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
      <div>
        <div className="mb-4 flex min-h-[44px] items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-24 rounded-full lg:hidden" />
        </div>
        <ProductGridSkeleton />
      </div>
    </div>
  );
}

/** Bloc de page admin ou de commande en attente (remplace le texte « Chargement… »). */
export function PanelSkeleton({ rows = 4, label = 'Chargement…' }: { rows?: number; label?: string }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-56" />
      <div className="space-y-3 rounded-lg bg-white p-5 shadow-card">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className={clsx('h-4', i % 3 === 2 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    </div>
  );
}
