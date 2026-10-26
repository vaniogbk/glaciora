'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { EUROPEAN_COUNTRIES, countryName } from '@glaciora/shared';
import { AccountShell } from '@/components/account/AccountShell';
import { Field } from '@/components/ui/Field';
import { useAuth } from '@/components/providers/AuthProvider';
import { ApiError, api, fieldErrors } from '@/lib/api-client';

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
      setMessage('Adresse enregistrée.');
      await load();
    } catch (err) {
      setErrors(fieldErrors(err));
      setMessage(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Supprimer cette adresse ?')) return;
    await api(`/api/account/addresses/${id}`, { method: 'DELETE' });
    setMessage('Adresse supprimée.');
    await load();
  }

  const current = editing && editing !== 'new' ? editing : null;

  return (
    <AccountShell title="Mes adresses">
      <p aria-live="polite" className="mb-4 text-sm font-semibold text-success">
        {message}
      </p>
      {editing ? (
        <form onSubmit={onSubmit} className="max-w-2xl space-y-4" noValidate>
          <Field label="Nom de l’adresse (facultatif)" name="label" defaultValue={current?.label ?? ''} placeholder="Maison, chalet…" error={errors.label} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom" name="firstName" required defaultValue={current?.firstName ?? user?.firstName ?? ''} autoComplete="given-name" error={errors.firstName} />
            <Field label="Nom" name="lastName" required defaultValue={current?.lastName ?? user?.lastName ?? ''} autoComplete="family-name" error={errors.lastName} />
          </div>
          <Field label="Société (facultatif)" name="company" defaultValue={current?.company ?? ''} autoComplete="organization" error={errors.company} />
          <Field label="Adresse" name="line1" required defaultValue={current?.line1 ?? ''} autoComplete="address-line1" error={errors.line1} />
          <Field label="Complément (facultatif)" name="line2" defaultValue={current?.line2 ?? ''} autoComplete="address-line2" error={errors.line2} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code postal" name="postalCode" required defaultValue={current?.postalCode ?? ''} autoComplete="postal-code" error={errors.postalCode} />
            <Field label="Ville" name="city" required defaultValue={current?.city ?? ''} autoComplete="address-level2" error={errors.city} />
            <Field label="Région (facultatif)" name="region" defaultValue={current?.region ?? ''} autoComplete="address-level1" error={errors.region} />
            <div>
              <label htmlFor="countryCode" className="field-label">
                Pays <span aria-hidden="true">*</span>
              </label>
              <select id="countryCode" name="countryCode" required defaultValue={current?.countryCode ?? 'FR'} className="field-input" autoComplete="country">
                {EUROPEAN_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Field label="Téléphone" name="phone" type="tel" required defaultValue={current?.phone ?? ''} autoComplete="tel" error={errors.phone} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isDefault" defaultChecked={current?.isDefault ?? addresses.length === 0} className="h-4 w-4 accent-deep" />
            Adresse par défaut
          </label>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              Enregistrer
            </button>
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className="card p-5 text-sm">
                <p className="font-bold text-marine">
                  {a.label ?? `${a.firstName} ${a.lastName}`} {a.isDefault && <span className="ml-2 rounded-sm bg-snow px-2 py-0.5 text-xs">Par défaut</span>}
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
                  {a.postalCode} {a.city}, {countryName(a.countryCode)}
                </address>
                <div className="mt-4 flex gap-4">
                  <button type="button" className="font-semibold text-deep underline" onClick={() => setEditing(a)}>
                    Modifier
                  </button>
                  <button type="button" className="font-semibold text-danger underline" onClick={() => onDelete(a.id)}>
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-primary mt-6" onClick={() => setEditing('new')}>
            Ajouter une adresse
          </button>
        </>
      )}
    </AccountShell>
  );
}
