'use client';

import { useState, type FormEvent } from 'react';
import { errorMessage, useAdminData } from '@/components/admin/useAdminData';
import { api } from '@/lib/api-client';

interface Category {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  position: number;
  isVisible: boolean;
  sport: 'SKI' | 'HOCKEY' | null;
  _count: { products: number };
}

export default function AdminCategoriesPage() {
  const { data, error, reload } = useAdminData<{ categories: Category[] }>('/api/admin/categories');
  const [message, setMessage] = useState('');
  const categories = data?.categories ?? [];
  const roots = categories.filter((c) => !c.parentId);

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

  function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    void act(async () => {
      await api('/api/admin/categories', {
        method: 'POST',
        json: { name: f.get('name'), parentId: String(f.get('parentId') ?? '') || null, sport: String(f.get('sport') ?? '') || null, position: Number(f.get('position') ?? 0) },
      });
      form.reset();
    }, 'Catégorie créée.');
  }

  function rename(c: Category) {
    const name = window.prompt('Nouveau nom', c.name);
    if (name && name !== c.name) void act(() => api(`/api/admin/categories/${c.id}`, { method: 'PATCH', json: { name } }), 'Catégorie renommée.');
  }

  return (
    <div>
      <h1 className="text-2xl">Catégories</h1>
      <p className="mt-1 text-sm text-muted">Une catégorie principale masquée n’apparaît pas dans la navigation (ex. Vestes, Vêtements tant qu’elles sont vides).</p>
      <p aria-live="polite" className="mt-3 text-sm font-semibold text-deep">{message}</p>
      {error && <p role="alert" className="text-danger">{error}</p>}
      <div className="mt-4 space-y-4">
        {roots.map((root) => (
          <div key={root.id} className="card p-4">
            <CategoryRow c={root} onRename={rename} onToggle={() => act(() => api(`/api/admin/categories/${root.id}`, { method: 'PATCH', json: { isVisible: !root.isVisible } }), 'Visibilité modifiée.')} onDelete={() => act(() => api(`/api/admin/categories/${root.id}`, { method: 'DELETE' }), 'Catégorie supprimée.')} />
            <ul className="mt-2 space-y-1 border-l-2 border-line pl-4">
              {categories
                .filter((c) => c.parentId === root.id)
                .map((c) => (
                  <li key={c.id}>
                    <CategoryRow c={c} onRename={rename} onToggle={() => act(() => api(`/api/admin/categories/${c.id}`, { method: 'PATCH', json: { isVisible: !c.isVisible } }), 'Visibilité modifiée.')} onDelete={() => act(() => api(`/api/admin/categories/${c.id}`, { method: 'DELETE' }), 'Catégorie supprimée.')} />
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <form onSubmit={onCreate} className="card mt-6 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label htmlFor="cat-nom" className="field-label">Nom</label>
          <input id="cat-nom" name="name" required className="field-input w-56" />
        </div>
        <div>
          <label htmlFor="cat-parent" className="field-label">Parent</label>
          <select id="cat-parent" name="parentId" className="field-input w-48">
            <option value="">(catégorie principale)</option>
            {roots.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cat-sport" className="field-label">Sport</label>
          <select id="cat-sport" name="sport" className="field-input w-36">
            <option value="">—</option>
            <option value="SKI">Ski</option>
            <option value="HOCKEY">Hockey</option>
          </select>
        </div>
        <div>
          <label htmlFor="cat-position" className="field-label">Ordre</label>
          <input id="cat-position" name="position" type="number" min={0} defaultValue={0} className="field-input w-24" />
        </div>
        <button type="submit" className="btn-primary">Créer</button>
      </form>
    </div>
  );
}

function CategoryRow({ c, onRename, onToggle, onDelete }: { c: Category; onRename: (c: Category) => void; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-1 text-sm">
      <span className="font-semibold text-marine">{c.name}</span>
      <span className="text-muted">/{c.slug} · {c._count.products} produit(s)</span>
      {!c.isVisible && <span className="rounded-sm bg-line px-2 text-xs">Masquée</span>}
      <span className="ml-auto flex gap-3">
        <button type="button" className="font-semibold text-deep underline" onClick={() => onRename(c)}>Renommer</button>
        <button type="button" className="font-semibold text-deep underline" onClick={onToggle}>{c.isVisible ? 'Masquer' : 'Afficher'}</button>
        <button type="button" className="font-semibold text-danger underline" onClick={onDelete}>Supprimer</button>
      </span>
    </div>
  );
}
