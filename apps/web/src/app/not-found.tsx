import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container py-24 text-center">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="mt-3 text-4xl">Hors-piste !</h1>
      <p className="mt-4 text-muted">Cette page n’existe pas ou n’est plus disponible.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-primary">
          Accueil
        </Link>
        <Link href="/catalogue" className="btn-outline">
          Catalogue
        </Link>
      </div>
    </div>
  );
}
