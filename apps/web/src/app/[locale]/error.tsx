'use client';

import { Link, useI18n } from '@/i18n/client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { m } = useI18n();
  return (
    <div className="container py-24 text-center" role="alert">
      <h1 className="text-3xl">{m.errorPage.title}</h1>
      <p className="mt-4 text-muted">{m.errorPage.text}</p>
      <div className="mt-8 flex justify-center gap-3">
        <button type="button" className="btn-primary" onClick={reset}>
          {m.errorPage.retry}
        </button>
        <Link href="/" className="btn-outline">
          {m.common.home}
        </Link>
      </div>
    </div>
  );
}
