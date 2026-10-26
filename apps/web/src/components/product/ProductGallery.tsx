'use client';

import Image from 'next/image';
import { useState } from 'react';
import clsx from 'clsx';

interface GalleryImage {
  url: string;
  alt: string;
}

export function ProductGallery({ images, name, isIllustration }: { images: GalleryImage[]; name: string; isIllustration: boolean }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-snow">
        {current ? (
          <Image src={current.url} alt={current.alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain p-6" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">Visuel à venir</div>
        )}
      </div>
      {isIllustration && (
        <p className="mt-2 text-xs text-muted">Visuel d&apos;illustration non contractuel : coloris et détails peuvent différer du produit livré.</p>
      )}
      {images.length > 1 && (
        <ul className="mt-4 flex gap-3" aria-label={`Autres vues de ${name}`}>
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Afficher la vue ${index + 1}`}
                aria-pressed={index === active}
                className={clsx('relative block h-20 w-20 overflow-hidden rounded-md border-2 bg-snow transition', index === active ? 'border-deep' : 'border-transparent hover:border-line')}
              >
                <Image src={image.url} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
