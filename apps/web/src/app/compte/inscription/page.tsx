'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { registerSchema } from '@glaciora/shared';
import { Field } from '@/components/ui/Field';
import { ApiError, api, fieldErrors } from '@/lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const input = Object.fromEntries(['firstName', 'lastName', 'email', 'password'].map((k) => [k, String(form.get(k) ?? '')]));
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await api('/api/auth/register', { method: 'POST', json: parsed.data });
      router.push('/compte/connexion?inscrit=1');
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(err instanceof ApiError ? err.message : 'Inscription impossible, réessayez.');
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl">Créer un compte</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="firstName" autoComplete="given-name" required error={errors.firstName} />
          <Field label="Nom" name="lastName" autoComplete="family-name" required error={errors.lastName} />
        </div>
        <Field label="E-mail" name="email" type="email" autoComplete="email" required error={errors.email} />
        <Field label="Mot de passe" name="password" type="password" autoComplete="new-password" required hint="10 caractères minimum, avec au moins une lettre et un chiffre." error={errors.password} />
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p className="mt-6 text-sm">
        Déjà inscrit ?{' '}
        <Link href="/compte/connexion" className="font-semibold text-deep underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
