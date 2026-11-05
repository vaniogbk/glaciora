import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * Apparition au défilement en CSS pur (animation liée au défilement, classe « reveal » dans globals.css) : aucun JavaScript,
 * aucune mesure de position au chargement — important sur téléphone lent, où chaque carte produit en utilisait une.
 * Navigateurs sans prise en charge ou « réduire les animations » : contenu affiché tel quel.
 */
export function Reveal({ children, className }: { children: ReactNode; delay?: number; className?: string }) {
  return <div className={clsx('reveal', className)}>{children}</div>;
}
