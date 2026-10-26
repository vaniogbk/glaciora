'use client';

import { useState, type FormEvent } from 'react';
import { Field } from '@/components/ui/Field';
import { ApiError, api } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') ?? '');
    setPending(true);
    setError('');
    try {
      const res = await api<{ message: string }>('/api/auth/password/forgot', { method: 'POST', json: { email } });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Demande impossible, réessayez.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl">Mot de passe oublié</h1>
      <p className="mt-2 text-sm text-muted">Indiquez votre e-mail : si un compte existe, vous recevrez un lien valable 30 minutes.</p>
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
          <Field label="E-mail" name="email" type="email" autoComplete="email" required />
          <button type="submit" className="btn-primary w-full" disabled={pending}>
            Recevoir le lien
          </button>
        </form>
      )}
    </div>
  );
}
