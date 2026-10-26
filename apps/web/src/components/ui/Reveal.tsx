'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';

/**
 * Apparition progressive au défilement. Le rendu serveur reste visible (pas de contenu caché sans JS) ;
 * seuls les éléments encore sous la ligne de flottaison sont masqués puis animés.
 * Rien n'est animé si l'utilisateur a demandé à réduire les animations.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'static' | 'hidden' | 'visible'>('static');

  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (node.getBoundingClientRect().top < window.innerHeight) return;
    setState('hidden');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setState('visible');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={clsx(className, state === 'hidden' && 'opacity-0', state === 'visible' && 'animate-fade-up')}
      style={state === 'visible' ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
