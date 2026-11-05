'use client';

import { useState, type FormEvent } from 'react';
import { Field } from '@/components/ui/Field';
import { api } from '@/lib/api-client';
import { useI18n } from '@/i18n/client';
import { apiErrorMessage } from '@/i18n/errors';

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const { locale, m } = useI18n();
  const t = m.account;
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') ?? '');
    setPending(true);
    setError('');
    try {
      const res = await api<{ message: string }>('/api/auth/password/forgot', { method: 'POST', json: { email, locale } });
      setMessage(locale === 'fr' ? res.message : t.forgotSent);
    } catch (err) {
      setError(apiErrorMessage(err, locale, m, t.requestFailed));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl">{t.forgotTitle}</h1>
      <p className="mt-2 text-sm text-muted">{t.forgotText}</p>
      {message ? (
        <p role="status" className="mt-6 rounded-md bg-success/10 p-4 text-sm font-semibold text-success">
          {message}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <Field label={m.common.email} name="email" type="email" autoComplete="email" required />
          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {t.forgotButton}
          </button>
        </form>
      )}
    </div>
  );
}
