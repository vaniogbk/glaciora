'use client';

import { useState } from 'react';
import { errorMessage, useAdminData } from '@/components/admin/useAdminData';
import { api } from '@/lib/api-client';

interface Run {
  id: string;
  source: string;
  startedAt: string;
  finishedAt: string | null;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  report: { reference: string; action: string; status?: string; message?: string }[] | null;
}

export default function AdminImportPage() {
  const { data, reload } = useAdminData<{ runs: Run[]; catalogueAvailable: boolean }>('/api/admin/import/runs');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMessage('');
    try {
      await api('/api/admin/import', { method: 'POST' });
      setMessage('Import terminé.');
      await reload();
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl">Import du catalogue</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        L’import lit le dossier GLACIORA_CATALOGUE (sans jamais le modifier) et le fichier de compléments (prix, tailles). Il est idempotent : un produit inchangé n’est pas réécrit, et le stock saisi dans l’admin n’est jamais écrasé.
      </p>
      {data && !data.catalogueAvailable && (
        <p className="mt-4 rounded-md bg-warning/10 p-3 text-sm font-semibold text-warning">
          Le dossier catalogue n’est pas présent sur ce serveur : lancez « npm run import:catalogue » depuis un poste qui le contient (voir README).
        </p>
      )}
      <button type="button" className="btn-primary mt-4" onClick={run} disabled={busy || !data?.catalogueAvailable}>
        {busy ? 'Import en cours…' : 'Relancer l’import'}
      </button>
      <p aria-live="polite" className="mt-3 text-sm font-semibold text-deep">{message}</p>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th scope="col" className="p-3">Date</th>
              <th scope="col">Créés</th>
              <th scope="col">Mis à jour</th>
              <th scope="col">Ignorés / inchangés</th>
              <th scope="col">Erreurs</th>
              <th scope="col" className="p-3">Rapport</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data?.runs.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="p-3">{new Date(r.startedAt).toLocaleString('fr-FR')}</td>
                <td>{r.createdCount}</td>
                <td>{r.updatedCount}</td>
                <td>{r.skippedCount}</td>
                <td className={r.errorCount ? 'font-semibold text-danger' : ''}>{r.errorCount}</td>
                <td className="p-3">
                  <button type="button" className="font-semibold text-deep underline" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>
                    {open === r.id ? 'Masquer' : 'Détail'}
                  </button>
                  {open === r.id && (
                    <ul className="mt-2 space-y-1 text-xs">
                      {r.report?.map((l) => (
                        <li key={l.reference}>
                          <strong>{l.reference}</strong> — {l.action} {l.status ? `(${l.status})` : ''} {l.message ?? ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
