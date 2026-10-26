'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import clsx from 'clsx';
import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';

const NAV = [
  { href: '/categorie/skis', label: 'Skis' },
  { href: '/categorie/bottes', label: 'Bottes' },
  { href: '/categorie/hockey', label: 'Hockey' },
  { href: '/categorie/accessoires', label: 'Accessoires' },
  { href: '/catalogue', label: 'Tout le catalogue' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, pulse } = useCart();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => setOpen(false), [pathname]);

  if (pathname.startsWith('/admin')) return null;

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/recherche?q=${encodeURIComponent(q)}`);
  }

  const count = cart?.itemCount ?? 0;

  return (
    <header className="sticky top-0 z-40 bg-marine text-white shadow-lift">
      <div className="container flex h-16 items-center gap-4 lg:h-20">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md lg:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
        <Link href="/" className="shrink-0" aria-label="GLACIORA, retour à l'accueil">
          <Image src="/brand/logo-horizontal-sombre.svg" alt="GLACIORA" width={170} height={30} priority className="h-7 w-auto lg:h-8" />
        </Link>
        <nav aria-label="Navigation principale" className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-6 text-sm font-semibold">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx('py-2 transition hover:text-glacier', pathname.startsWith(item.href) && 'text-glacier')}
                  aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form onSubmit={onSearch} role="search" className="ml-auto hidden md:block">
          <label htmlFor="recherche-entete" className="sr-only">
            Rechercher un produit
          </label>
          <input
            id="recherche-entete"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (ski, patins, casque…)"
            className="h-10 w-56 rounded-md border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/70 focus:bg-white focus:text-ink focus:outline-none xl:w-72"
          />
        </form>
        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Link href={user ? (user.role === 'ADMIN' ? '/admin' : '/compte') : '/compte/connexion'} className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold hover:text-glacier">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
            </svg>
            <span className="hidden sm:inline">{user ? user.firstName ?? 'Mon compte' : 'Connexion'}</span>
          </Link>
          <Link href="/panier" className="relative inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold hover:text-glacier" aria-label={`Panier, ${count} article${count > 1 ? 's' : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
              <circle cx="10" cy="20" r="1.4" />
              <circle cx="17" cy="20" r="1.4" />
            </svg>
            {count > 0 && (
              <span key={pulse} data-testid="cart-count" className="absolute right-0 top-1 min-w-[20px] animate-pop rounded-full bg-glacier px-1.5 text-center text-xs font-bold text-marine">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      <div id="menu-mobile" hidden={!open} className="border-t border-white/10 lg:hidden">
        <form onSubmit={onSearch} role="search" className="container pt-4 md:hidden">
          <label htmlFor="recherche-mobile" className="sr-only">
            Rechercher un produit
          </label>
          <input
            id="recherche-mobile"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit"
            className="h-11 w-full rounded-md border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/70"
          />
        </form>
        <nav aria-label="Navigation mobile" className="container py-4">
          <ul className="grid gap-1 text-base font-semibold">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded-md px-2 py-3 hover:bg-white/10">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
