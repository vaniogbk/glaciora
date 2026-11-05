'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Field } from '@/components/ui/Field';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { ApiError } from '@/lib/api-client';
import { Link, useI18n } from '@/i18n/client';
import { localizePath } from '@/i18n/config';
import { apiErrorMessage } from '@/i18n/errors';
import { safeReturn } from '@/lib/safe-return';


function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const { refresh } = useCart();
  const { locale, m } = useI18n();
  const t = m.account;
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError('');
    try {
      const user = await login(String(data.get('email') ?? ''), String(data.get('password') ?? ''));
      await refresh();
      // « retour » est déjà dans la bonne langue (chemin complet de la page d'origine).
      router.push(safeReturn(params.get('retour')) ?? (user.role === 'ADMIN' ? '/admin' : localizePath(locale, '/compte')));
    } catch (err) {
      const badLogin = err instanceof ApiError && err.status === 401;
      setError(badLogin && locale !== 'fr' ? m.errors.codes.INVALID_CREDENTIALS! : apiErrorMessage(err, locale, m, t.loginFailed));
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl">{t.loginTitle}</h1>
      {params.get('inscrit') && <p className="mt-4 rounded-md bg-success/10 p-3 text-sm font-semibold text-success">{t.registered}</p>}
      {params.get('reinitialise') && <p className="mt-4 rounded-md bg-success/10 p-3 text-sm font-semibold text-success">{t.resetDone}</p>}
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <Field label={m.common.email} name="email" type="email" autoComplete="email" required />
        <Field label={m.common.password} name="password" type="password" autoComplete="current-password" required />
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? t.loggingIn : t.loginButton}
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-2 text-sm">
        <Link href="/compte/mot-de-passe-oublie" className="font-semibold text-deep underline">
          {t.forgotLink}
        </Link>
        <p>
          {t.noAccount}{' '}
          <Link href="/compte/inscription" className="font-semibold text-deep underline">
            {t.createAccount}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
