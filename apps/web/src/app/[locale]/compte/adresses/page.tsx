'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { EUROPEAN_COUNTRIES } from '@glaciora/shared/countries';
import { AccountShell } from '@/components/account/AccountShell';
import { Field } from '@/components/ui/Field';
import { useAuth } from '@/components/providers/AuthProvider';
import { api, fieldErrors } from '@/lib/api-client';
import { useI18n } from '@/i18n/client';
import { apiErrorMessage, translateFieldErrors } from '@/i18n/errors';
import { countryName } from '@/i18n/format';

interface Address {
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  company: string | null;
  line1: string;
  line2: string | null;
  postalCode: string;
  city: string;
  region: string | null;
  countryCode: string;
  phone: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { user } = useAuth();
  const { locale, m } = useI18n();
  const t = m.account;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  const load = useCallback(() => api<{ addresses: Address[] }>('/api/account/addresses').then((d) => setAddresses(d.addresses)), []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
    const json = { ...body, isDefault: form.get('isDefault') === 'on' };
    try {
      if (editing === 'new') await api('/api/account/addresses', { method: 'POST', json });
      else if (editing) await api(`/api/account/addresses/${editing.id}`, { method: 'PATCH', json });
      setEditing(null);
      setErrors({});
      setMessage(t.addressSaved);
      await load();
    } catch (err) {
      setErrors(translateFieldErrors(fieldErrors(err), m));
      setMessage(apiErrorMessage(err, locale, m, t.saveFailed));
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm(t.confirmDelete)) return;
    await api(`/api/account/addresses/${id}`, { method: 'DELETE' });
    setMessage(t.addressDeleted);
    await load();
  }

  const current = editing && editing !== 'new' ? editing : null;

  return (
    <AccountShell title={t.addressesTitle}>
      <p aria-live="polite" className="mb-4 text-sm font-semibold text-success">
        {message}
      </p>
      {editing ? (
        <form onSubmit={onSubmit} className="max-w-2xl space-y-4" noValidate>
          <Field label={t.addressLabel} name="label" defaultValue={current?.label ?? ''} placeholder={t.addressLabelPlaceholder} error={errors.label} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={m.common.firstName} name="firstName" required defaultValue={current?.firstName ?? user?.firstName ?? ''} autoComplete="given-name" error={errors.firstName} />
            <Field label={m.common.lastName} name="lastName" required defaultValue={current?.lastName ?? user?.lastName ?? ''} autoComplete="family-name" error={errors.lastName} />
          </div>
          <Field label={t.company} name="company" defaultValue={current?.company ?? ''} autoComplete="organization" error={errors.company} />
          <Field label={t.line1} name="line1" required defaultValue={current?.line1 ?? ''} autoComplete="address-line1" error={errors.line1} />
          <Field label={t.line2} name="line2" defaultValue={current?.line2 ?? ''} autoComplete="address-line2" error={errors.line2} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t.postalCode} name="postalCode" required defaultValue={current?.postalCode ?? ''} autoComplete="postal-code" error={errors.postalCode} />
            <Field label={t.city} name="city" required defaultValue={current?.city ?? ''} autoComplete="address-level2" error={errors.city} />
            <Field label={t.region} name="region" defaultValue={current?.region ?? ''} autoComplete="address-level1" error={errors.region} />
            <div>
              <label htmlFor="countryCode" className="field-label">
                {t.country} <span aria-hidden="true">*</span>
              </label>
              <select id="countryCode" name="countryCode" required defaultValue={current?.countryCode ?? 'FR'} className="field-input" autoComplete="country">
                {EUROPEAN_COUNTRIES.map((c) => ({ code: c.code, name: countryName(c.code, locale, c.name) }))
                  .sort((a, b) => a.name.localeCompare(b.name, locale))
                  .map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <Field label={m.common.phone} name="phone" type="tel" required defaultValue={current?.phone ?? ''} autoComplete="tel" error={errors.phone} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isDefault" defaultChecked={current?.isDefault ?? addresses.length === 0} className="h-4 w-4 accent-deep" />
            {t.defaultAddress}
          </label>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              {m.common.save}
            </button>
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
              {m.common.cancel}
            </button>
          </div>
        </form>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className="card p-5 text-sm">
                <p className="font-bold text-marine">
                  {a.label ?? `${a.firstName} ${a.lastName}`} {a.isDefault && <span className="ml-2 rounded-sm bg-snow px-2 py-0.5 text-xs">{t.default}</span>}
                </p>
                <address className="mt-2 not-italic text-muted">
                  {a.firstName} {a.lastName}
                  <br />
                  {a.line1}
                  {a.line2 && (
                    <>
                      <br />
                      {a.line2}
                    </>
                  )}
                  <br />
                  {a.postalCode} {a.city}, {countryName(a.countryCode, locale)}
                </address>
                <div className="mt-4 flex gap-4">
                  <button type="button" className="font-semibold text-deep underline" onClick={() => setEditing(a)}>
                    {m.common.edit}
                  </button>
                  <button type="button" className="font-semibold text-danger underline" onClick={() => onDelete(a.id)}>
                    {m.common.delete}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-primary mt-6" onClick={() => setEditing('new')}>
            {t.addAddress}
          </button>
        </>
      )}
    </AccountShell>
  );
}
