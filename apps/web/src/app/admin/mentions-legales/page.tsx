'use client';

import { useState, type FormEvent } from 'react';
import { LEGAL_FIELDS, type LegalField, type LegalNoticeData } from '@glaciora/shared/legal';
import { errorMessage, useAdminData } from '@/components/admin/useAdminData';
import { api, fieldErrors } from '@/lib/api-client';

const LABELS: Record<LegalField, { label: string; hint?: string; multiline?: boolean }> = {
  companyName: { label: 'Raison sociale (ou nom et prénom de l’entrepreneur individuel)' },
  legalForm: { label: 'Forme juridique', hint: 'ex. SAS, SARL, EI, micro-entreprise' },
  shareCapital: { label: 'Capital social', hint: 'Sociétés uniquement' },
  registration: { label: 'Immatriculation', hint: 'ex. RCS Nanterre 123 456 789, ou numéro SIREN' },
  vatNumber: { label: 'N° de TVA intracommunautaire' },
  headOffice: { label: 'Adresse du siège social', multiline: true },
  publicationDirector: { label: 'Directeur de la publication' },
  hostName: { label: 'Hébergeur du site (raison sociale)' },
  hostAddress: { label: 'Adresse et téléphone de l’hébergeur', multiline: true },
};

/** Mentions légales : renseignées par le propriétaire de la boutique ; un champ vide s'affiche « À compléter ». */
export default function AdminLegalNoticePage() {
  const { data, reload } = useAdminData<{ notice: LegalNoticeData }>('/api/admin/legal-notice');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const notice = data?.notice;
  const missing = notice ? LEGAL_FIELDS.filter((k) => !notice[k]) : [];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const json = Object.fromEntries(LEGAL_FIELDS.map((k) => [k, String(f.get(k) ?? '')]));
    setBusy(true);
    setMessage('');
    try {
      await api('/api/admin/legal-notice', { method: 'PUT', json });
      setErrors({});
      setMessage('Mentions légales enregistrées. La page publique se met à jour sous 5 minutes.');
      await reload();
    } catch (err) {
      setErrors(fieldErrors(err));
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl">Mentions légales</h1>
      <p className="mt-2 text-sm text-muted">
        Identité du vendeur affichée sur la page publique « Mentions légales » (lien en pied de page, dans toutes les langues). La loi impose ces informations à tout site
        marchand (article 6-III de la LCEN, article L221-5 du Code de la consommation) : tant qu’un champ est vide, la page affiche « À compléter ».
      </p>
      <p aria-live="polite" className="mt-3 text-sm font-semibold text-deep">{message}</p>
      {notice && missing.length > 0 && (
        <p role="status" className="mt-3 rounded-md bg-warning/10 p-3 text-sm font-semibold text-warning">
          {missing.length} champ{missing.length > 1 ? 's' : ''} à compléter : {missing.map((k) => LABELS[k].label).join(' · ')}.
        </p>
      )}
      {notice && (
        <form onSubmit={onSubmit} className="card mt-6 grid grid-cols-1 gap-4 p-5" noValidate>
          {LEGAL_FIELDS.map((k) => {
            const { label, hint, multiline } = LABELS[k];
            const common = { id: k, name: k, defaultValue: notice[k] ?? '', maxLength: 300, className: 'field-input', 'aria-invalid': Boolean(errors[k]), 'aria-describedby': hint ? `${k}-hint` : undefined };
            return (
              <div key={k}>
                <label htmlFor={k} className="field-label">{label}</label>
                {multiline ? <textarea rows={3} {...common} /> : <input {...common} />}
                {hint && <p id={`${k}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
                {errors[k] && <p className="field-error">{errors[k]}</p>}
              </div>
            );
          })}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary" disabled={busy}>Enregistrer</button>
          </div>
        </form>
      )}
    </div>
  );
}
