'use client';

import Image from 'next/image';
import { useState } from 'react';
import clsx from 'clsx';
import { useI18n } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { useColorSelection } from './ColorSelection';

interface GalleryImage {
  url: string;
  alt: string;
  color?: string | null;
}

/** Photos du coloris choisi (sinon photos communes, sinon toutes) ; revient à la première vue à chaque changement de coloris. */
function imagesForColor(images: GalleryImage[], color: string | null): GalleryImage[] {
  const ofColor = color ? images.filter((i) => i.color === color) : [];
  if (ofColor.length) return ofColor;
  const common = images.filter((i) => !i.color);
  return common.length ? common : images;
}

export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const { color } = useColorSelection();
  const { m } = useI18n();
  const shown = imagesForColor(images, color);
  const [view, setView] = useState({ color, index: 0 });
  const active = view.color === color ? Math.min(view.index, shown.length - 1) : 0;
  const current = shown[active];
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-snow">
        {current ? (
          <Image key={current.url} src={current.url} alt={current.alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain p-6" data-testid="product-photo" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">{m.productClient.visualSoon}</div>
        )}
      </div>
      {shown.length > 1 && (
        <ul className="mt-4 flex gap-3" aria-label={fmt(m.productClient.otherViews, { name })}>
          {shown.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setView({ color, index })}
                aria-label={fmt(m.productClient.showView, { n: index + 1 })}
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
