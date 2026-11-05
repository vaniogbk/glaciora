'use client';

import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import clsx from 'clsx';
import { useAuth } from '@/components/providers/AuthProvider';
import { PanelSkeleton } from '@/components/ui/Skeleton';
import { Link, useI18n, useLocalizedRouter } from '@/i18n/client';
import { stripLocale } from '@/i18n/config';

/** Espace client : redirige vers la connexion si nécessaire (l'API refuse de toute façon sans session). */
export function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useLocalizedRouter();
  const fullPath = usePathname();
  const pathname = stripLocale(fullPath);
  const { m } = useI18n();
  const t = m.account;
  const links = [
    { href: '/compte', label: t.profile },
    { href: '/compte/adresses', label: t.addresses },
    { href: '/compte/commandes', label: t.orders },
  ];

  useEffect(() => {
    if (!loading && !user) router.replace(`/compte/connexion?retour=${encodeURIComponent(fullPath)}`);
  }, [loading, user, router, fullPath]);

  if (loading || !user) return <PanelSkeleton label={t.loading} />;

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <nav aria-label={t.nav} className="space-y-1">
        <p className="mb-3 text-sm text-muted">
          {t.hello} <strong className="text-marine">{user.firstName ?? user.email}</strong>
        </p>
        {links.map((l) => (
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
            {t.admin}
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
          {t.logout}
        </button>
      </nav>
      <section>
        <h1 className="text-3xl">{title}</h1>
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}
