'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
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

/** Garde d'interface : la sécurité réelle est appliquée par l'API (rôle ADMIN revérifié à chaque requête). */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.replace(`/compte/connexion?retour=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user || user.role !== 'ADMIN') {
    return <p className="container py-20 text-center text-muted">Vérification de l’accès…</p>;
  }

  return (
    <div className="min-h-screen bg-snow">
      <header className="bg-marine text-white">
        <div className="flex h-14 items-center gap-4 px-4">
          <Link href="/admin" aria-label="Administration GLACIORA">
            <Image src="/brand/logo-horizontal-sombre.svg" alt="GLACIORA" width={140} height={25} className="h-6 w-auto" />
          </Link>
          <span className="rounded-sm bg-glacier px-2 py-0.5 text-xs font-bold uppercase text-marine">Admin</span>
          <Link href="/" className="ml-auto text-sm font-semibold hover:text-glacier">
            Voir la boutique
          </Link>
          <button
            type="button"
            className="text-sm font-semibold hover:text-glacier"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>
      <div className="grid lg:grid-cols-[220px_1fr]">
        <nav aria-label="Administration" className="border-b border-line bg-white p-3 lg:min-h-[calc(100vh-56px)] lg:border-b-0 lg:border-r">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {NAV.map((item) => {
              const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={clsx('block rounded-md px-3 py-2 text-sm font-semibold', active ? 'bg-marine text-white' : 'text-marine hover:bg-snow')}
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
