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
  const { data, reload } = useAdminData<{ runs: Run[]; catalogueAvailable: boolean; snapshot: { exportedAt: string; productCount: number } | null }>('/api/admin/import/runs');
  const fromSnapshot = Boolean(data && !data.catalogueAvailable && data.snapshot);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMessage('');
    try {
      const { report } = await api<{ report: { summary: { created: number; updated: number; unchanged?: number; skipped?: number; errors: number } } }>('/api/admin/import', { method: 'POST' });
      const s = report.summary;
      setMessage(`Import terminé : ${s.created} créé(s), ${s.updated} mis à jour, ${s.unchanged ?? s.skipped ?? 0} inchangé(s), ${s.errors} erreur(s).`);
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
      {fromSnapshot && data?.snapshot && (
        <div className="mt-4 max-w-3xl rounded-md bg-snow p-4 text-sm">
          <p className="font-semibold text-marine">
            Source sur ce serveur : instantané du catalogue du {new Date(data.snapshot.exportedAt).toLocaleString('fr-FR')} ({data.snapshot.productCount} produits).
          </p>
          <p className="mt-1 text-muted">
            Pour y intégrer des changements du dossier GLACIORA_CATALOGUE : lancez « npm run import:catalogue » sur le poste qui contient le dossier (l’instantané est mis à jour), déployez, puis cliquez sur « Importer le catalogue ».
          </p>
        </div>
      )}
      {data && !data.catalogueAvailable && !data.snapshot && (
        <p className="mt-4 rounded-md bg-warning/10 p-3 text-sm font-semibold text-warning">
          Ni dossier catalogue ni instantané sur ce serveur : lancez « npm run import:catalogue » depuis un poste qui contient le dossier, puis déployez.
        </p>
      )}
      <button type="button" className="btn-primary mt-4" onClick={run} disabled={busy || !(data?.catalogueAvailable || data?.snapshot)}>
        {busy ? 'Import en cours…' : 'Importer le catalogue'}
      </button>
      <p aria-live="polite" className="mt-3 text-sm font-semibold text-deep">{message}</p>
      <div className="card mt-6 overflow-x-auto">
        <table className="table-stack lg:min-w-[640px]">
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
                <td data-label="Créés">{r.createdCount}</td>
                <td data-label="Mis à jour">{r.updatedCount}</td>
                <td data-label="Ignorés / inchangés">{r.skippedCount}</td>
                <td data-label="Erreurs" className={r.errorCount ? 'font-semibold text-danger' : ''}>{r.errorCount}</td>
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
