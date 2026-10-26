'use client';

import { useState, type FormEvent } from 'react';
import { EUROPEAN_COUNTRIES, countryName } from '@glaciora/shared';
import { errorMessage, useAdminData } from '@/components/admin/useAdminData';
import { api, fieldErrors } from '@/lib/api-client';

interface Account {
  id: string;
  label: string;
  accountHolder: string;
  ibanMasked: string;
  bic: string | null;
  bankName: string | null;
  countryCodes: string[];
  isActive: boolean;
  updatedAt: string;
}
interface BankResponse {
  accounts: Account[];
  defaultAccount: { label: string; accountHolder: string; ibanMasked: string; bic: string | null } | null;
}

/** Comptes de réception des virements, par pays de livraison. */
export default function AdminBankPage() {
  const { data, reload } = useAdminData<BankResponse>('/api/admin/bank-accounts');
  const [editing, setEditing] = useState<Account | 'new' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const assigned = new Map<string, string>();
  for (const a of data?.accounts ?? []) if (a.isActive) for (const c of a.countryCodes) assigned.set(c, a.label);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const current = editing !== 'new' ? editing : null;
    const iban = String(f.get('iban') ?? '').trim();
    const json: Record<string, unknown> = {
      label: f.get('label'),
      accountHolder: f.get('accountHolder'),
      bic: f.get('bic'),
      bankName: f.get('bankName'),
      countryCodes: f.getAll('countryCodes').map(String),
      isActive: f.get('isActive') === 'on',
    };
    // En modification, l'IBAN n'est envoyé que s'il a été ressaisi.
    if (!current || iban) json.iban = iban;
    if (current && iban && !window.confirm('Confirmer le changement d’IBAN ? Les prochains clients des pays concernés verront ce nouveau compte. Une alerte sera envoyée à la boutique.')) return;
    setBusy(true);
    setMessage('');
    try {
      if (current) await api(`/api/admin/bank-accounts/${current.id}`, { method: 'PATCH', json });
      else await api('/api/admin/bank-accounts', { method: 'POST', json });
      setEditing(null);
      setErrors({});
      setMessage('Compte enregistré. Une alerte de sécurité a été envoyée à la boutique.');
      await reload();
    } catch (err) {
      setErrors(fieldErrors(err));
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(a: Account) {
    if (!window.confirm(`Supprimer le compte « ${a.label} » ? Les pays concernés utiliseront le compte principal.`)) return;
    try {
      await api(`/api/admin/bank-accounts/${a.id}`, { method: 'DELETE' });
      setMessage('Compte supprimé.');
      await reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  }

  const current = editing && editing !== 'new' ? editing : null;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl">Coordonnées bancaires par pays</h1>
      <p className="mt-2 text-sm text-muted">
        Au moment du paiement, le client voit le compte rattaché à son pays de livraison. Sans compte dédié, c’est le compte principal (variables d’environnement) qui s’affiche ; sans aucun compte, le virement est indisponible pour ce pays. Chaque modification est journalisée et signalée par e-mail à la boutique.
      </p>
      <p aria-live="polite" className="mt-3 text-sm font-semibold text-deep">{message}</p>

      <section className="card mt-4 p-5 text-sm" aria-labelledby="compte-principal">
        <h2 id="compte-principal" className="text-lg">Compte principal</h2>
        {data?.defaultAccount ? (
          <p className="mt-2">
            {data.defaultAccount.accountHolder} · <span className="font-mono">{data.defaultAccount.ibanMasked}</span>
            {data.defaultAccount.bic ? ` · ${data.defaultAccount.bic}` : ''} <span className="text-muted">— modifiable uniquement via les variables d’environnement (BANK_*).</span>
          </p>
        ) : (
          <p className="mt-2 text-warning">Aucun compte principal configuré : seuls les pays ayant un compte dédié peuvent payer par virement.</p>
        )}
      </section>

      {!editing && (
        <>
          <ul className="mt-6 space-y-3">
            {data?.accounts.map((a) => (
              <li key={a.id} className="card flex flex-wrap items-start gap-4 p-5 text-sm">
                <div className="min-w-[240px] flex-1">
                  <p className="font-bold text-marine">
                    {a.label} {!a.isActive && <span className="ml-2 rounded-sm bg-line px-2 text-xs">Désactivé</span>}
                  </p>
                  <p className="mt-1">
                    {a.accountHolder} · <span className="font-mono">{a.ibanMasked}</span>
                    {a.bic ? ` · ${a.bic}` : ''}
                    {a.bankName ? ` · ${a.bankName}` : ''}
                  </p>
                  <p className="mt-1 text-muted">{a.countryCodes.length ? a.countryCodes.map(countryName).join(', ') : 'Aucun pays'}</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" className="font-semibold text-deep underline" onClick={() => setEditing(a)}>Modifier</button>
                  <button type="button" className="font-semibold text-danger underline" onClick={() => onDelete(a)}>Supprimer</button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-primary mt-6" onClick={() => setEditing('new')}>
            Ajouter un compte bancaire
          </button>
        </>
      )}

      {editing && (
        <form onSubmit={onSubmit} className="card mt-6 grid gap-4 p-5 md:grid-cols-2" noValidate>
          <h2 className="text-lg md:col-span-2">{current ? `Modifier « ${current.label} »` : 'Nouveau compte bancaire'}</h2>
          <div>
            <label htmlFor="label" className="field-label">Nom interne *</label>
            <input id="label" name="label" required defaultValue={current?.label ?? ''} placeholder="ex. Compte Suisse" className="field-input" aria-invalid={Boolean(errors.label)} />
            {errors.label && <p className="field-error">{errors.label}</p>}
          </div>
          <div>
            <label htmlFor="accountHolder" className="field-label">Titulaire du compte *</label>
            <input id="accountHolder" name="accountHolder" required defaultValue={current?.accountHolder ?? ''} className="field-input" aria-invalid={Boolean(errors.accountHolder)} />
            {errors.accountHolder && <p className="field-error">{errors.accountHolder}</p>}
          </div>
          <div>
            <label htmlFor="iban" className="field-label">IBAN {current ? '(laisser vide pour ne pas changer)' : '*'}</label>
            <input id="iban" name="iban" autoComplete="off" spellCheck={false} placeholder={current ? current.ibanMasked : 'FR76 …'} className="field-input font-mono" aria-invalid={Boolean(errors.iban)} />
            {errors.iban && <p className="field-error">{errors.iban}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="bic" className="field-label">BIC</label>
              <input id="bic" name="bic" defaultValue={current?.bic ?? ''} className="field-input font-mono" aria-invalid={Boolean(errors.bic)} />
              {errors.bic && <p className="field-error">{errors.bic}</p>}
            </div>
            <div>
              <label htmlFor="bankName" className="field-label">Banque</label>
              <input id="bankName" name="bankName" defaultValue={current?.bankName ?? ''} className="field-input" />
            </div>
          </div>
          <fieldset className="md:col-span-2">
            <legend className="field-label">Pays de livraison servis par ce compte</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {EUROPEAN_COUNTRIES.map((c) => {
                const owner = assigned.get(c.code);
                const takenElsewhere = Boolean(owner) && !current?.countryCodes.includes(c.code);
                return (
                  <label key={c.code} className={takenElsewhere ? 'flex items-center gap-2 text-sm text-muted' : 'flex items-center gap-2 text-sm'}>
                    <input type="checkbox" name="countryCodes" value={c.code} defaultChecked={current?.countryCodes.includes(c.code)} disabled={takenElsewhere} className="h-4 w-4 accent-deep" />
                    {c.name}
                    {takenElsewhere && <span className="text-xs">({owner})</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={current?.isActive ?? true} className="h-4 w-4 accent-deep" /> Compte actif
          </label>
          <div className="flex gap-3 md:col-span-2">
            <button type="submit" className="btn-primary" disabled={busy}>Enregistrer</button>
            <button type="button" className="btn-outline" onClick={() => { setEditing(null); setErrors({}); }}>Annuler</button>
          </div>
        </form>
      )}
    </div>
  );
}
