'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AccountShell } from '@/components/account/AccountShell';
import { Field } from '@/components/ui/Field';
import { useAuth } from '@/components/providers/AuthProvider';
import { ApiError, api, fieldErrors } from '@/lib/api-client';

interface Profile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, reload } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (user) api<{ profile: Profile }>('/api/account/profile').then((d) => setProfile(d.profile)).catch(() => undefined);
  }, [user]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus('');
    try {
      const res = await api<{ profile: Profile }>('/api/account/profile', {
        method: 'PATCH',
        json: { firstName: form.get('firstName'), lastName: form.get('lastName'), phone: form.get('phone') },
      });
      setProfile(res.profile);
      setErrors({});
      setStatus('Profil enregistré.');
      await reload();
    } catch (err) {
      setErrors(fieldErrors(err));
      setStatus(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    }
  }

  return (
    <AccountShell title="Mon profil">
      {profile && (
        <form onSubmit={onSubmit} className="max-w-lg space-y-4" noValidate>
          <p className="text-sm text-muted">
            E-mail : <strong className="text-marine">{profile.email}</strong> · client depuis le {new Date(profile.createdAt).toLocaleDateString('fr-FR')}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom" name="firstName" defaultValue={profile.firstName ?? ''} required autoComplete="given-name" error={errors.firstName} />
            <Field label="Nom" name="lastName" defaultValue={profile.lastName ?? ''} required autoComplete="family-name" error={errors.lastName} />
          </div>
          <Field label="Téléphone" name="phone" type="tel" defaultValue={profile.phone ?? ''} autoComplete="tel" error={errors.phone} />
          <button type="submit" className="btn-primary">
            Enregistrer
          </button>
          <p aria-live="polite" className="text-sm font-semibold text-success">
            {status}
          </p>
        </form>
      )}
    </AccountShell>
  );
}
