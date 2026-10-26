'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import clsx from 'clsx';
import { useAuth } from '@/components/providers/AuthProvider';

const LINKS = [
  { href: '/compte', label: 'Profil' },
  { href: '/compte/adresses', label: 'Adresses' },
  { href: '/compte/commandes', label: 'Commandes' },
];

/** Espace client : redirige vers la connexion si nécessaire (l'API refuse de toute façon sans session). */
export function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/compte/connexion?retour=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) return <p className="text-muted">Chargement…</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Mon compte" className="space-y-1">
        <p className="mb-3 text-sm text-muted">
          Bonjour <strong className="text-marine">{user.firstName ?? user.email}</strong>
        </p>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={pathname === l.href ? 'page' : undefined}
            className={clsx('block rounded-md px-3 py-2.5 text-sm font-semibold', pathname === l.href ? 'bg-marine text-white' : 'text-marine hover:bg-snow')}
          >
            {l.label}
          </Link>
        ))}
        {user.role === 'ADMIN' && (
          <Link href="/admin" className="block rounded-md px-3 py-2.5 text-sm font-semibold text-deep hover:bg-snow">
            Administration
          </Link>
        )}
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push('/');
          }}
          className="block w-full rounded-md px-3 py-2.5 text-left text-sm font-semibold text-muted hover:bg-snow"
        >
          Se déconnecter
        </button>
      </nav>
      <section>
        <h1 className="text-3xl">{title}</h1>
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}
