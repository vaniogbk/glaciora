'use client';

import { Link, useI18n } from '@/i18n/client';

/** 404 dans la langue de la page (la langue vient du fournisseur de la mise en page, une page 404 ne reçoit pas de paramètres). */
export default function NotFound() {
  const { m } = useI18n();
  return (
    <div className="container py-24 text-center">
      <p className="eyebrow">{m.notFound.eyebrow}</p>
      <h1 className="mt-3 text-4xl">{m.notFound.title}</h1>
      <p className="mt-4 text-muted">{m.notFound.text}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-primary">
          {m.common.home}
        </Link>
        <Link href="/catalogue" className="btn-outline">
          {m.common.catalogue}
        </Link>
      </div>
    </div>
  );
}
