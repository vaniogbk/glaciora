'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Field } from '@/components/ui/Field';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { ApiError } from '@/lib/api-client';

function safeReturn(value: string | null): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const { refresh } = useCart();
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
      router.push(safeReturn(params.get('retour')) ?? (user.role === 'ADMIN' ? '/admin' : '/compte'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible, réessayez.');
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl">Connexion</h1>
      {params.get('inscrit') && <p className="mt-4 rounded-md bg-success/10 p-3 text-sm font-semibold text-success">Votre compte est prêt : connectez-vous.</p>}
      {params.get('reinitialise') && <p className="mt-4 rounded-md bg-success/10 p-3 text-sm font-semibold text-success">Mot de passe modifié : connectez-vous.</p>}
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <Field label="E-mail" name="email" type="email" autoComplete="email" required />
        <Field label="Mot de passe" name="password" type="password" autoComplete="current-password" required />
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-2 text-sm">
        <Link href="/compte/mot-de-passe-oublie" className="font-semibold text-deep underline">
          Mot de passe oublié ?
        </Link>
        <p>
          Pas encore de compte ?{' '}
          <Link href="/compte/inscription" className="font-semibold text-deep underline">
            Créer un compte
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
