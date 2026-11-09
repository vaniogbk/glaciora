import { JsonLd } from '@/components/seo/JsonLd';
import { Link } from '@/i18n/client';
import { localizePath, type Locale } from '@/i18n/config';
import type { Messages } from '@/i18n/messages';
import { absoluteUrl } from '@/lib/site';

export interface Crumb {
  label: string;
  href: string;
}

/**
 * Fil d'Ariane visible + données structurées BreadcrumbList.
 * Toujours sur une seule ligne (dernier élément tronqué) : sur téléphone, un retour à la ligne qui dépendait de la largeur
 * du texte décalait toute la fiche produit à l'arrivée de la police (CLS 0,3).
 */
export function Breadcrumbs({ items, locale, m }: { items: Crumb[]; locale: Locale; m: Messages }) {
  const all = [{ label: m.common.home, href: '/' }, ...items];
  return (
    <>
      <nav aria-label={m.breadcrumbs.label} className="text-sm text-muted">
        {/* Noms longs (catégories en finnois, polonais, islandais…) raccourcis par « … » au lieu d'élargir la page. */}
        <ol className="flex min-w-0 items-center gap-1 whitespace-nowrap">
          {all.map((item, index) => (
            <li key={item.href} className={index === 0 ? 'flex shrink-0 items-center gap-1' : 'flex min-w-0 items-center gap-1'}>
              {index > 0 && (
                <span aria-hidden="true" className="shrink-0">
                  /
                </span>
              )}
              {index === all.length - 1 ? (
                <span aria-current="page" className="min-w-0 truncate font-semibold text-marine">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="min-w-0 truncate hover:text-deep hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: all.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.label, item: absoluteUrl(localizePath(locale, item.href)) })),
        }}
      />
    </>
  );
}
