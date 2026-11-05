'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AccountShell } from '@/components/account/AccountShell';
import { Field } from '@/components/ui/Field';
import { useAuth } from '@/components/providers/AuthProvider';
import { api, fieldErrors } from '@/lib/api-client';
import { useI18n } from '@/i18n/client';
import { apiErrorMessage, translateFieldErrors } from '@/i18n/errors';
import { fmt, formatDate } from '@/i18n/format';

interface Profile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, reload } = useAuth();
  const { locale, m } = useI18n();
  const t = m.account;
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
      setStatus(t.profileSaved);
      await reload();
    } catch (err) {
      setErrors(translateFieldErrors(fieldErrors(err), m));
      setStatus(apiErrorMessage(err, locale, m, t.saveFailed));
    }
  }

  return (
    <AccountShell title={t.profileTitle}>
      {profile && (
        <form onSubmit={onSubmit} className="max-w-lg space-y-4" noValidate>
          <p className="text-sm text-muted">
            {m.common.email} : <strong className="text-marine">{profile.email}</strong> · {fmt(t.customerSince, { date: formatDate(profile.createdAt, locale) })}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={m.common.firstName} name="firstName" defaultValue={profile.firstName ?? ''} required autoComplete="given-name" error={errors.firstName} />
            <Field label={m.common.lastName} name="lastName" defaultValue={profile.lastName ?? ''} required autoComplete="family-name" error={errors.lastName} />
          </div>
          <Field label={m.common.phone} name="phone" type="tel" defaultValue={profile.phone ?? ''} autoComplete="tel" error={errors.phone} />
          <button type="submit" className="btn-primary">
            {m.common.save}
          </button>
          <p aria-live="polite" className="text-sm font-semibold text-success">
            {status}
          </p>
        </form>
      )}
    </AccountShell>
  );
}
