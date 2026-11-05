import Link from 'next/link';
import { fontVariables } from './fonts';

/** 404 hors boutique (adresses d'administration inconnues) : la boutique a sa propre page traduite. */
export default function GlobalNotFound() {
  return (
    <html lang="fr" className={fontVariables}>
      <body>
        <div className="container py-24 text-center">
          <p className="eyebrow">Erreur 404</p>
          <h1 className="mt-3 text-4xl">Hors-piste !</h1>
          <p className="mt-4 text-muted">Cette page n’existe pas ou n’est plus disponible.</p>
          <Link href="/" className="btn-primary mt-8">
            Accueil
          </Link>
        </div>
      </body>
    </html>
  );
}
