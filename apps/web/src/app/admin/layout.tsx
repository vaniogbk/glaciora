'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { useAuth } from '@/components/providers/AuthProvider';

const NAV = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/commandes', label: 'Commandes' },
  { href: '/admin/produits', label: 'Produits' },
  { href: '/admin/categories', label: 'Catégories' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/livraison', label: 'Livraison' },
  { href: '/admin/banque', label: 'Coordonnées bancaires' },
  { href: '/admin/import', label: 'Import catalogue' },
  { href: '/admin/journaux', label: 'Journaux & e-mails' },
];

const isActive = (href: string, pathname: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

/** Garde d'interface : la sécurité réelle est appliquée par l'API (rôle ADMIN revérifié à chaque requête). */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.replace(`/compte/connexion?retour=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  useEffect(() => setMenuOpen(false), [pathname]);

  if (loading || !user || user.role !== 'ADMIN') {
    return <p className="container py-20 text-center text-muted">Vérification de l’accès…</p>;
  }

  const currentLabel = NAV.find((item) => isActive(item.href, pathname))?.label ?? 'Menu';

  return (
    <div className="min-h-screen bg-snow">
      <header className="bg-marine text-white">
        <div className="flex h-14 items-center gap-3 px-4 sm:gap-4">
          <Link href="/admin" aria-label="Administration GLACIORA" className="shrink-0">
            <Image src="/brand/logo-horizontal-sombre.svg" alt="GLACIORA" width={140} height={25} className="h-5 w-auto sm:h-6" />
          </Link>
          <span className="rounded-sm bg-glacier px-2 py-0.5 text-xs font-bold uppercase text-marine">Admin</span>
          <Link href="/" className="ml-auto inline-flex min-h-[44px] items-center text-sm font-semibold hover:text-glacier">
            <span className="sm:hidden">Boutique</span>
            <span className="hidden sm:inline">Voir la boutique</span>
          </Link>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-semibold hover:text-glacier"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 sm:hidden">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="sr-only sm:not-sr-only">Déconnexion</span>
          </button>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Administration" className="min-w-0 border-b border-line bg-white p-3 lg:min-h-[calc(100vh-56px)] lg:border-b-0 lg:border-r">
          <button
            type="button"
            className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-md border border-line px-3 text-left text-sm font-semibold text-marine lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-admin"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>
              <span className="sr-only">Menu d’administration, rubrique actuelle : </span>
              {currentLabel}
            </span>
            <svg aria-hidden="true" viewBox="0 0 20 20" className={clsx('h-5 w-5 shrink-0 transition-transform', menuOpen && 'rotate-180')}>
              <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <ul id="menu-admin" className={clsx('gap-1 lg:mt-0 lg:flex lg:flex-col', menuOpen ? 'mt-2 grid sm:grid-cols-2' : 'hidden')}>
            {NAV.map((item) => {
              const active = isActive(item.href, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={clsx('flex min-h-[44px] items-center rounded-md px-3 text-sm font-semibold', active ? 'bg-marine text-white' : 'text-marine hover:bg-snow')}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main className="min-w-0 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
