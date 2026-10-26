'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { passwordSchema } from '@glaciora/shared';
import { Field } from '@/components/ui/Field';
import { ApiError, api } from '@/lib/api-client';

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') ?? '');
    if (password !== String(form.get('confirm') ?? '')) {
      setFieldError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    const check = passwordSchema.safeParse(password);
    if (!check.success) {
      setFieldError(check.error.issues[0]?.message ?? 'Mot de passe invalide');
      return;
    }
    setFieldError('');
    setPending(true);
    try {
      await api('/api/auth/password/reset', { method: 'POST', json: { token, password } });
      router.push('/compte/connexion?reinitialise=1');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Réinitialisation impossible.');
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl">Nouveau mot de passe</h1>
      {!token ? (
        <p className="mt-6 text-danger">Lien incomplet : utilisez le lien reçu par e-mail.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <Field label="Nouveau mot de passe" name="password" type="password" autoComplete="new-password" required hint="10 caractères minimum, avec au moins une lettre et un chiffre." error={fieldError} />
          <Field label="Confirmer le mot de passe" name="confirm" type="password" autoComplete="new-password" required />
          <button type="submit" className="btn-primary w-full" disabled={pending}>
            Enregistrer
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
