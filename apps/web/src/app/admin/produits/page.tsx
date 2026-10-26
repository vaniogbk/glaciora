'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { formatPrice } from '@glaciora/shared';
import { errorMessage, useAdminData } from '@/components/admin/useAdminData';
import { api } from '@/lib/api-client';

type Status = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
const STATUS_LABEL: Record<Status, string> = { DRAFT: 'Brouillon', ACTIVE: 'Publié', ARCHIVED: 'Archivé' };

interface ProductsResponse {
  total: number;
  page: number;
  totalPages: number;
  items: { id: string; reference: string; name: string; brand: string; status: Status; category: string; image: { url: string; alt: string } | null; priceFromCents: number | null; variantCount: number; totalStock: number }[];
}

function ProductsList() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [message, setMessage] = useState('');
  const query = new URLSearchParams();
  for (const key of ['status', 'q', 'page']) if (params.get(key)) query.set(key, params.get(key)!);
  const { data, error, reload } = useAdminData<ProductsResponse>(`/api/admin/products?${query}`);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    router.push(`/admin/produits?${next}`);
  }

  async function setStatus(id: string, status: Status) {
    setMessage('');
    try {
      await api(`/api/admin/products/${id}`, { method: 'PATCH', json: { status } });
      setMessage(status === 'ACTIVE' ? 'Produit publié.' : 'Produit retiré de la vente.');
      await reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">Produits</h1>
        <Link href="/admin/produits/nouveau" className="btn-primary">
          Nouveau produit
        </Link>
      </div>
      <form
        className="mt-6 flex flex-wrap gap-3"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          setParam('q', q.trim());
        }}
      >
        <label htmlFor="statut-produit" className="sr-only">
          Statut
        </label>
        <select id="statut-produit" className="field-input w-auto" value={params.get('status') ?? ''} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Publiés</option>
          <option value="DRAFT">Brouillons</option>
          <option value="ARCHIVED">Archivés</option>
        </select>
        <label htmlFor="recherche-produit" className="sr-only">
          Rechercher
        </label>
        <input id="recherche-produit" className="field-input w-64" placeholder="Nom, marque, référence" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="btn-primary">
          Rechercher
        </button>
      </form>
      <p aria-live="polite" className="mt-3 text-sm font-semibold text-deep">
        {message}
      </p>
      {error && <p role="alert" className="text-danger">{error}</p>}
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th scope="col" className="p-3">Produit</th>
              <th scope="col">Catégorie</th>
              <th scope="col">Prix</th>
              <th scope="col">Stock</th>
              <th scope="col">Statut</th>
              <th scope="col" className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data?.items.map((p) => (
              <tr key={p.id}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 rounded-md bg-snow">
                      {p.image && <Image src={p.image.url} alt="" fill sizes="48px" className="object-contain p-1" />}
                    </div>
                    <div>
                      <Link href={`/admin/produits/${p.id}`} className="font-semibold text-deep underline">
                        {p.brand} {p.name}
                      </Link>
                      <p className="text-xs text-muted">{p.reference}</p>
                    </div>
                  </div>
                </td>
                <td>{p.category}</td>
                <td>{p.priceFromCents ? formatPrice(p.priceFromCents) : <span className="text-warning">À définir</span>}</td>
                <td className={p.totalStock === 0 ? 'font-semibold text-danger' : ''}>{p.totalStock}</td>
                <td>{STATUS_LABEL[p.status]}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/produits/${p.id}`} className="font-semibold text-deep underline">
                      Modifier
                    </Link>
                    {p.status === 'ACTIVE' ? (
                      <button type="button" className="font-semibold text-warning underline" onClick={() => setStatus(p.id, 'DRAFT')}>
                        Dépublier
                      </button>
                    ) : (
                      <button type="button" className="font-semibold text-success underline" onClick={() => setStatus(p.id, 'ACTIVE')}>
                        Publier
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" className={p === data.page ? 'btn bg-marine text-white' : 'btn-outline'} onClick={() => setParam('page', String(p))}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense>
      <ProductsList />
    </Suspense>
  );
}
