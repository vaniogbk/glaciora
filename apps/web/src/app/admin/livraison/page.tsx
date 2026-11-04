'use client';

import { useState, type FormEvent } from 'react';
import { formatPrice, toCents } from '@glaciora/shared';
import { errorMessage, useAdminData } from '@/components/admin/useAdminData';
import { api } from '@/lib/api-client';

interface Rate {
  id: string;
  name: string;
  priceCents: number;
  freeAboveCents: number | null;
  minDays: number | null;
  maxDays: number | null;
  isActive: boolean;
}
interface Country {
  code: string;
  name: string;
  isEnabled: boolean;
  zoneId: string | null;
}
interface Zone {
  id: string;
  name: string;
  isActive: boolean;
  rates: Rate[];
  countries: Country[];
}

export default function AdminShippingPage() {
  const { data, reload } = useAdminData<{ zones: Zone[]; countries: Country[] }>('/api/admin/shipping');
  const [message, setMessage] = useState('');

  async function act(fn: () => Promise<unknown>, success: string) {
    setMessage('');
    try {
      await fn();
      setMessage(success);
      await reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  }

  function rateBody(f: FormData) {
    const free = String(f.get('freeAbove') ?? '').trim();
    return {
      name: String(f.get('name') ?? ''),
      priceCents: toCents(String(f.get('price') ?? '0') || '0'),
      freeAboveCents: free ? toCents(free) : null,
      minDays: f.get('minDays') ? Number(f.get('minDays')) : null,
      maxDays: f.get('maxDays') ? Number(f.get('maxDays')) : null,
      isActive: f.get('isActive') === 'on',
    };
  }

  function onAddRate(e: FormEvent<HTMLFormElement>, zoneId: string) {
    e.preventDefault();
    const form = e.currentTarget;
    let body;
    try {
      body = rateBody(new FormData(form));
    } catch {
      setMessage('Montant invalide.');
      return;
    }
    void act(async () => {
      await api(`/api/admin/shipping/zones/${zoneId}/rates`, { method: 'POST', json: body });
      form.reset();
    }, 'Tarif ajouté.');
  }

  function onSaveRate(e: FormEvent<HTMLFormElement>, rateId: string) {
    e.preventDefault();
    let body;
    try {
      body = rateBody(new FormData(e.currentTarget));
    } catch {
      setMessage('Montant invalide.');
      return;
    }
    void act(() => api(`/api/admin/shipping/rates/${rateId}`, { method: 'PATCH', json: body }), 'Tarif enregistré.');
  }

  function onAddZone(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = String(new FormData(form).get('name') ?? '');
    void act(async () => {
      await api('/api/admin/shipping/zones', { method: 'POST', json: { name } });
      form.reset();
    }, 'Zone créée.');
  }

  return (
    <div>
      <h1 className="text-2xl">Livraison</h1>
      <p className="mt-1 text-sm text-muted">Un pays n’est proposé au client que s’il est activé et rattaché à une zone active ayant au moins un tarif actif. Les tarifs « [DÉMO] » sont des exemples à remplacer.</p>
      <p aria-live="polite" className="mt-3 text-sm font-semibold text-deep">{message}</p>
      <div className="mt-4 space-y-6">
        {data?.zones.map((zone) => (
          <section key={zone.id} className="card p-5" aria-labelledby={`zone-${zone.id}`}>
            <div className="flex flex-wrap items-center gap-3">
              <h2 id={`zone-${zone.id}`} className="text-lg">{zone.name}</h2>
              <button type="button" className="text-sm font-semibold text-deep underline" onClick={() => act(() => api(`/api/admin/shipping/zones/${zone.id}`, { method: 'PATCH', json: { isActive: !zone.isActive } }), 'Zone modifiée.')}>
                {zone.isActive ? 'Désactiver la zone' : 'Activer la zone'}
              </button>
            </div>
            <h3 className="mt-4 text-sm font-bold">Tarifs</h3>
            <div className="mt-2 space-y-2">
              {zone.rates.map((r) => (
                <form key={r.id} onSubmit={(e) => onSaveRate(e, r.id)} className="grid grid-cols-2 items-end gap-x-3 gap-y-2 rounded-md border border-line p-3 text-sm xl:grid-cols-[minmax(0,1fr)_100px_120px_90px_90px_auto_auto_auto]">
                  <label className="col-span-2 xl:col-span-1">
                    <span className="field-label text-xs">Nom du tarif</span>
                    <input name="name" defaultValue={r.name} className="field-input" />
                  </label>
                  <label>
                    <span className="field-label text-xs">Prix (€)</span>
                    <input name="price" defaultValue={(r.priceCents / 100).toFixed(2)} inputMode="decimal" className="field-input" />
                  </label>
                  <label>
                    <span className="field-label text-xs">Gratuit dès (€)</span>
                    <input name="freeAbove" defaultValue={r.freeAboveCents ? (r.freeAboveCents / 100).toFixed(2) : ''} inputMode="decimal" className="field-input" />
                  </label>
                  <label>
                    <span className="field-label text-xs">Délai min. (jours)</span>
                    <input name="minDays" type="number" min={0} defaultValue={r.minDays ?? ''} className="field-input" />
                  </label>
                  <label>
                    <span className="field-label text-xs">Délai max. (jours)</span>
                    <input name="maxDays" type="number" min={0} defaultValue={r.maxDays ?? ''} className="field-input" />
                  </label>
                  <label className="flex min-h-[44px] items-center gap-2 font-semibold text-marine"><input type="checkbox" name="isActive" defaultChecked={r.isActive} className="h-4 w-4 accent-deep" /> Actif</label>
                  <button type="submit" className="btn-outline">Enregistrer</button>
                  <button type="button" className="col-span-2 min-h-[44px] justify-self-start font-semibold text-danger underline xl:col-span-1" onClick={() => act(() => api(`/api/admin/shipping/rates/${r.id}`, { method: 'DELETE' }), 'Tarif supprimé.')}>Supprimer</button>
                </form>
              ))}
              {zone.rates.length === 0 && <p className="text-sm text-warning">Aucun tarif : les pays de cette zone ne sont pas proposés au checkout.</p>}
            </div>
            <form onSubmit={(e) => onAddRate(e, zone.id)} className="mt-3 grid grid-cols-2 items-end gap-x-3 gap-y-2 text-sm xl:grid-cols-[minmax(0,1fr)_100px_120px_90px_90px_auto]" aria-label={`Nouveau tarif pour ${zone.name}`}>
              <label className="col-span-2 xl:col-span-1">
                <span className="field-label text-xs">Nouveau tarif</span>
                <input name="name" required placeholder="Ex. Colissimo suivi" className="field-input" />
              </label>
              <label>
                <span className="field-label text-xs">Prix (€)</span>
                <input name="price" required inputMode="decimal" className="field-input" />
              </label>
              <label>
                <span className="field-label text-xs">Gratuit dès (€)</span>
                <input name="freeAbove" inputMode="decimal" className="field-input" />
              </label>
              <label>
                <span className="field-label text-xs">Délai min. (jours)</span>
                <input name="minDays" type="number" min={0} className="field-input" />
              </label>
              <label>
                <span className="field-label text-xs">Délai max. (jours)</span>
                <input name="maxDays" type="number" min={0} className="field-input" />
              </label>
              <input type="hidden" name="isActive" value="on" />
              <button type="submit" className="btn-primary col-span-2 xl:col-span-1">Ajouter un tarif</button>
            </form>
            <h3 className="mt-5 text-sm font-bold">Pays</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {data.countries
                .filter((c) => c.zoneId === zone.id)
                .map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      aria-pressed={c.isEnabled}
                      onClick={() => act(() => api(`/api/admin/shipping/countries/${c.code}`, { method: 'PATCH', json: { isEnabled: !c.isEnabled } }), `${c.name} ${c.isEnabled ? 'désactivé' : 'activé'}.`)}
                      className={c.isEnabled ? 'rounded-full bg-marine px-3 py-1.5 text-xs font-semibold text-white' : 'rounded-full border border-line px-3 py-1.5 text-xs text-muted'}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
            </ul>
            {zone.rates.length > 0 && <p className="mt-2 text-xs text-muted">Tarif le plus bas : {formatPrice(Math.min(...zone.rates.map((r) => r.priceCents)))}</p>}
          </section>
        ))}
      </div>
      <form onSubmit={onAddZone} className="card mt-6 flex items-end gap-3 p-4">
        <div className="min-w-0 flex-1 sm:flex-none">
          <label htmlFor="zone-nom" className="field-label">Nouvelle zone</label>
          <input id="zone-nom" name="name" required className="field-input w-full sm:w-64" />
        </div>
        <button type="submit" className="btn-primary">Créer</button>
      </form>
    </div>
  );
}
