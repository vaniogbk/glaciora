'use client';

import { useState, type ReactNode } from 'react';
import clsx from 'clsx';

/**
 * Sous 1024 px, les filtres sont masqués et s'ouvrent depuis un petit bouton « Filtrer » placé à côté du nombre de résultats.
 * Au-delà, ils restent affichés en colonne. Le panneau reste ouvert pendant l'application des filtres (navigation sans rechargement).
 */
/** Rendu dès le serveur (nombre de filtres actifs calculé par la page) : pas de bandeau qui apparaît après coup et décale la grille. */
export function FiltersPanel({ total, active, children }: { total: number; active: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <p className="text-sm text-muted" aria-live="polite">
          {total} produit{total > 1 ? 's' : ''}
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="filtres-catalogue"
          onClick={() => setOpen((o) => !o)}
          className="group inline-flex min-h-[44px] items-center"
        >
          <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition', open ? 'border-marine bg-marine text-white' : 'border-marine text-marine group-hover:bg-marine group-hover:text-white')}>
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5">
              <path d="M3 5h14M6 10h8M9 15h2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Filtrer
            {active > 0 && (
              <span className={clsx('rounded-full px-1.5 text-[10px] leading-4', open ? 'bg-white text-marine' : 'bg-marine text-white group-hover:bg-white group-hover:text-marine')}>
                {active}
                <span className="sr-only"> filtre{active > 1 ? 's' : ''} actif{active > 1 ? 's' : ''}</span>
              </span>
            )}
          </span>
        </button>
      </div>
      <div id="filtres-catalogue" className={clsx('mt-3 rounded-lg bg-snow p-4 lg:mt-0 lg:block lg:p-5', !open && 'hidden')}>
        {children}
        <button type="button" onClick={() => setOpen(false)} className="btn-primary mt-6 w-full lg:hidden">
          Voir les {total} produit{total > 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}
