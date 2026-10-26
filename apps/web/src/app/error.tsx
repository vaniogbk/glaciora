'use client';

import Link from 'next/link';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container py-24 text-center" role="alert">
      <h1 className="text-3xl">Une erreur est survenue</h1>
      <p className="mt-4 text-muted">Merci de réessayer. Si le problème persiste, contactez-nous.</p>
      <div className="mt-8 flex justify-center gap-3">
        <button type="button" className="btn-primary" onClick={reset}>
          Réessayer
        </button>
        <Link href="/" className="btn-outline">
          Accueil
        </Link>
      </div>
    </div>
  );
}
