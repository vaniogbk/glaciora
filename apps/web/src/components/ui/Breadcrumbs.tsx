import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl } from '@/lib/site';

export interface Crumb {
  label: string;
  href: string;
}

/** Fil d'Ariane visible + données structurées BreadcrumbList. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ label: 'Accueil', href: '/' }, ...items];
  return (
    <>
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((item, index) => (
            <li key={item.href} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true">/</span>}
              {index === all.length - 1 ? (
                <span aria-current="page" className="font-semibold text-marine">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-deep hover:underline">
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
          itemListElement: all.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.label, item: absoluteUrl(item.href) })),
        }}
      />
    </>
  );
}
