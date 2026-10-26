import Image from 'next/image';
import clsx from 'clsx';
import homeImages from '@/data/home-images.json';

export type HomeImageKey = 'skiBanner' | 'hockeyBanner' | 'collectionSki' | 'collectionHockey' | 'essentials';

interface HomeImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

const images = homeImages as unknown as Record<HomeImageKey, HomeImage | null>;

/**
 * Visuel d'ambiance de l'accueil (dossier 05_ACCUEIL). En son absence : fond graphique
 * aux couleurs de la marque, sans image inventée.
 */
export function HomeVisual({ name, priority = false, className, position = 'center' }: { name: HomeImageKey; priority?: boolean; className?: string; position?: string }) {
  const image = images[name];
  return (
    <div className={clsx('absolute inset-0 overflow-hidden', className)} aria-hidden={image ? undefined : true}>
      {image ? (
        <Image src={image.src} alt={image.alt} fill priority={priority} sizes="100vw" className="object-cover" style={{ objectPosition: position }} />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_75%_20%,rgba(20,163,242,0.45),transparent_45%),linear-gradient(135deg,#0A1A2F_0%,#0A1A2F_45%,#0A6FAD_100%)]">
          <svg viewBox="0 0 204 100" className="absolute -bottom-6 right-[-8%] w-[70%] max-w-[760px] opacity-25" fill="none">
            <path d="M0 100 58 42l20 20 38-58 1.84 22.73-37.57 57.34L58 61.8 19.8 100Z" fill="#FFFFFF" />
            <path d="M116 4 204 100h-18.99L117.84 26.73Z" fill="#14A3F2" />
            <path d="m117.84 24.73 17.09 19-17.12 24-21.12-11Z" fill="#A9DEFB" />
          </svg>
        </div>
      )}
    </div>
  );
}

export function hasHomeImage(name: HomeImageKey): boolean {
  return Boolean(images[name]);
}
