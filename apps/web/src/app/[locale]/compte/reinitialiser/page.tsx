'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { passwordSchema } from '@glaciora/shared/schemas';
import { Field } from '@/components/ui/Field';
import { api } from '@/lib/api-client';
import { useI18n, useLocalizedRouter } from '@/i18n/client';
import { apiErrorMessage } from '@/i18n/errors';

function ResetForm() {
  const router = useLocalizedRouter();
  const { locale, m } = useI18n();
  const t = m.account;
  const token = useSearchParams().get('token') ?? '';
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') ?? '');
    if (password !== String(form.get('confirm') ?? '')) {
      setFieldError(t.passwordsDiffer);
      return;
    }
    const check = passwordSchema.safeParse(password);
    if (!check.success) {
      const issue = check.error.issues[0]?.message ?? '10 caractères minimum';
      setFieldError(m.validation[issue] ?? issue);
      return;
    }
    setFieldError('');
    setPending(true);
    try {
      await api('/api/auth/password/reset', { method: 'POST', json: { token, password } });
      router.push('/compte/connexion?reinitialise=1');
    } catch (err) {
      setError(apiErrorMessage(err, locale, m, t.resetFailed));
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl">{t.resetTitle}</h1>
      {!token ? (
        <p className="mt-6 text-danger">{t.resetIncomplete}</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <Field label={t.newPassword} name="password" type="password" autoComplete="new-password" required hint={t.passwordHint} error={fieldError} />
          <Field label={t.confirmPassword} name="confirm" type="password" autoComplete="new-password" required />
          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {m.common.save}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
