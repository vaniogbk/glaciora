'use client';

import { useState, type FormEvent } from 'react';
import { registerSchema } from '@glaciora/shared/schemas';
import { Field } from '@/components/ui/Field';
import { api, fieldErrors } from '@/lib/api-client';
import { Link, useI18n, useLocalizedRouter } from '@/i18n/client';
import { apiLocale } from '@/i18n/config';
import { apiErrorMessage, translateFieldErrors } from '@/i18n/errors';

export default function RegisterPage() {
  const router = useLocalizedRouter();
  const { locale, m } = useI18n();
  const t = m.account;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const input = Object.fromEntries(['firstName', 'lastName', 'email', 'password'].map((k) => [k, String(form.get(k) ?? '')]));
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(translateFieldErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])), m));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await api('/api/auth/register', { method: 'POST', json: { ...parsed.data, locale: apiLocale(locale) } });
      router.push('/compte/connexion?inscrit=1');
    } catch (err) {
      setErrors(translateFieldErrors(fieldErrors(err), m));
      setError(apiErrorMessage(err, locale, m, t.registerFailed));
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl">{t.registerTitle}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={m.common.firstName} name="firstName" autoComplete="given-name" required error={errors.firstName} />
          <Field label={m.common.lastName} name="lastName" autoComplete="family-name" required error={errors.lastName} />
        </div>
        <Field label={m.common.email} name="email" type="email" autoComplete="email" required error={errors.email} />
        <Field label={m.common.password} name="password" type="password" autoComplete="new-password" required hint={t.passwordHint} error={errors.password} />
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? t.creating : t.createMyAccount}
        </button>
      </form>
      <p className="mt-6 text-sm">
        {t.alreadyRegistered}{' '}
        <Link href="/compte/connexion" className="font-semibold text-deep underline">
          {t.loginButton}
        </Link>
      </p>
    </div>
  );
}
