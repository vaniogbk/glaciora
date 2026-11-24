'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Fil rouge du tableau d'enquête : relie les punaises ([data-pin]) du tableau parent ([data-board]) dans l'ordre de la page.
 * Positions mesurées dans le navigateur (et à chaque redimensionnement) : le fil suit la mise en page, du téléphone au grand écran.
 */
export function PinStrings() {
  const ref = useRef<SVGSVGElement>(null);
  const [points, setPoints] = useState('');

  useEffect(() => {
    const board = ref.current?.closest<HTMLElement>('[data-board]');
    if (!board) return;
    const update = () => {
      const b = board.getBoundingClientRect();
      const pins = [...board.querySelectorAll<HTMLElement>('[data-pin]')].map((pin) => {
        const r = pin.getBoundingClientRect();
        return `${(r.left + r.width / 2 - b.left).toFixed(1)},${(r.top + r.height / 2 - b.top).toFixed(1)}`;
      });
      setPoints(pins.join(' '));
    };
    update();
    // Navigateurs sans ResizeObserver : recalcul au redimensionnement de la fenêtre.
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  return (
    <svg ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 h-full w-full">
      {points && <polyline points={points} fill="none" className="stroke-danger" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
    </svg>
  );
}
