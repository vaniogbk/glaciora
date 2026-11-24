'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import type { OrderStatus } from '@glaciora/shared/order';
import { Link, useI18n, useLocalizedRouter } from '@/i18n/client';
import { countryName, fmt, money } from '@/i18n/format';
import { sizeLabel } from '@/i18n/labels';
import { api } from '@/lib/api-client';
import { OrderTracking } from './OrderTracking';
import { PanelSkeleton } from '@/components/ui/Skeleton';

const REFERENCE = /^GLA-\d{6}-[A-Z0-9]{5}$/;

interface PublicOrderView {
  limited: true;
  reference: string;
  status: OrderStatus;
  createdAt: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  items: { productName: string; productSlug: string; sizeLabel: string | null; quantity: number }[];
}

interface FullOrderView extends Omit<PublicOrderView, 'limited' | 'items'> {
  limited?: false;
  email: string;
  subtotalCents: number;
  discountCents?: number;
  discountLabel?: string | null;
  shippingCents: number;
  totalCents: number;
  shippingRateName: string;
  shipCountryCode: string;
  shipCity: string;
  items: (PublicOrderView['items'][number] & { lineTotalCents: number })[];
  proofReceived: boolean;
}

type OrderView = PublicOrderView | FullOrderView;

/** Référence saisie à la main : espaces retirés, majuscules, tirets ajoutés si besoin (gla261124 7kq4m → GLA-261124-7KQ4M). */
export function normalizeReference(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = raw.match(/^GLA(\d{6})([A-Z0-9]{5})$/);
  return m ? `GLA-${m[1]}-${m[2]}` : input.trim().toUpperCase();
}

/** Formulaire « Suivre ma commande » : la référence suffit, aucun compte n'est nécessaire. */
function TrackingForm({ initial, notFound, token }: { initial: string; notFound: boolean; token?: string | null }) {
  const { m } = useI18n();
  const t = m.followUp;
  const router = useLocalizedRouter();
  const [value, setValue] = useState(initial);
  const [invalid, setInvalid] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const reference = normalizeReference(value);
    if (!REFERENCE.test(reference)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    // Lien des e-mails : le jeton signé accompagne la référence pré-remplie (récapitulatif complet) tant qu'elle n'est pas modifiée.
    const signed = token && reference === normalizeReference(initial) ? `&t=${encodeURIComponent(token)}` : '';
    router.push(`/commande/suivi?ref=${encodeURIComponent(reference)}${signed}`);
  }

  const error = invalid ? t.invalidReference : notFound ? t.notFoundRef : '';
  return (
    <div className="mx-auto max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-brand text-deep">{t.trackingEyebrow}</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{t.formTitle}</h1>
      <p className="mt-3 text-muted">{t.formIntro}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3" noValidate data-testid="tracking-form">
        <label htmlFor="reference-commande" className="field-label">
          {t.referenceLabel}
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            id="reference-commande"
            name="reference"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="GLA-261124-7KQ4M"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'reference-erreur' : undefined}
            className="field-input min-w-0 flex-1 font-semibold uppercase tracking-wide"
          />
          <button type="submit" className="btn-primary">
            {t.submit}
          </button>
        </div>
        {error && (
          <p id="reference-erreur" role="alert" className="field-error">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

/** Référence mise en avant à la fin de la commande, avec un bouton pour la copier. */
function KeepReference({ reference }: { reference: string }) {
  const { m } = useI18n();
  const t = m.followUp;
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <section className="mt-6 rounded-lg border-2 border-glacier bg-snow p-5" aria-labelledby="garder-reference">
      <h2 id="garder-reference" className="text-lg">
        {t.keepReferenceTitle}
      </h2>
      <p className="mt-2 flex flex-wrap items-center gap-3">
        <strong className="text-2xl font-extrabold tracking-wide text-marine" data-testid="order-reference">
          {reference}
        </strong>
        <button type="button" onClick={copy} className="btn-outline min-h-[44px] px-4 py-1.5">
          {copied ? t.copied : t.copy}
        </button>
      </p>
      <p className="mt-2 text-sm">{t.keepReference}</p>
      <Link href={`/commande/suivi?prefill=${encodeURIComponent(reference)}`} className="btn-primary mt-4" data-testid="track-order-button">
        {t.formTitle} <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}

/**
 * Récapitulatif et suivi d'une commande, sans compte : page de confirmation (juste après la commande), lien signé des
 * e-mails (paramètre « t », récapitulatif complet) ou référence saisie dans le formulaire (état de la commande seulement).
 */
export function OrderFollowUp({ mode }: { mode: 'confirmation' | 'suivi' }) {
  const params = useSearchParams();
  const { locale, m } = useI18n();
  const t = m.followUp;
  const price = (cents: number) => money(cents, locale);
  const reference = params.get('ref') ?? '';
  // « prefill » : bouton « Suivre ma commande » des e-mails et de la fin de commande, champ rempli, le client clique sur « Suivre ».
  const prefill = normalizeReference(params.get('prefill') ?? '');
  const token = params.get('t');
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setOrder(null);
    setError(false);
    // Sans référence : formulaire de suivi (rien à charger) ; page de confirmation sans référence : introuvable.
    if (!reference) {
      if (mode === 'confirmation') setError(true);
      return;
    }
    if (!REFERENCE.test(reference)) {
      setError(true);
      return;
    }
    const query = token ? `?t=${encodeURIComponent(token)}` : '';
    api<{ order: OrderView }>(`/api/checkout/orders/${reference}${query}`)
      .then((d) => setOrder(d.order))
      .catch(() => setError(true));
  }, [reference, token, mode]);

  // Page « Suivre ma commande » sans référence, ou référence introuvable : formulaire de recherche.
  if (mode === 'suivi' && (!reference || error)) {
    return <TrackingForm key={reference || prefill} initial={reference || prefill} notFound={Boolean(reference) && error} token={reference ? null : token} />;
  }
  if (error) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl">{t.notFoundTitle}</h1>
        <p className="mt-4 text-muted">{t.notFoundText}</p>
        <Link href="/commande/suivi" className="btn-primary mt-6">
          {t.formTitle}
        </Link>
      </div>
    );
  }
  if (!order) return <div className="mx-auto max-w-2xl"><PanelSkeleton rows={6} label={t.loading} /></div>;

  const full = order.limited ? null : order;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl bg-marine p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-brand text-glacier">{mode === 'confirmation' ? t.thanks : t.trackingEyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white" data-testid="confirmation-title">
          {fmt(mode === 'confirmation' ? t.orderRegistered : t.orderTitle, { reference: order.reference })}
        </h1>
        <p className="mt-3 text-white/85">
          {t.status} <strong className="text-white" data-testid="order-status">{m.orderStatus[order.status]}</strong>
        </p>
      </div>
      {mode === 'confirmation' && <KeepReference reference={order.reference} />}
      <div className="mt-8">
        <OrderTracking status={order.status} />
      </div>
      {order.trackingNumber && (
        <p className="mt-4 text-sm">
          {fmt(t.parcel, { carrier: order.trackingCarrier ? `(${order.trackingCarrier})` : '' })} <strong>{order.trackingNumber}</strong>
          {order.trackingUrl && (
            <>
              {' '}
              —{' '}
              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-deep underline">
                {t.trackParcel}<span className="sr-only"> {m.common.newWindow}</span>
              </a>
            </>
          )}
        </p>
      )}
      {full ? (
        <p className="mt-4 text-sm text-muted">{fmt(t.emailNotice, { email: full.email })}</p>
      ) : (
        <p className="mt-4 text-sm text-muted" data-testid="limited-notice">{t.limitedNotice}</p>
      )}
      <section className="mt-8 rounded-lg border border-line p-5" aria-labelledby="recap">
        <h2 id="recap" className="text-lg">
          {m.common.summary}
        </h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {order.items.map((item, index) => (
            <li key={index} className="flex justify-between gap-3 py-2">
              <span className="min-w-0">
                {item.quantity} × {item.productName}
                {item.sizeLabel && <span className="text-muted"> — {sizeLabel(item.sizeLabel, m.productClient.sizeWords)}</span>}
              </span>
              {full && 'lineTotalCents' in item && <span className="shrink-0 font-semibold">{price(item.lineTotalCents)}</span>}
            </li>
          ))}
        </ul>
        {full && (
          <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            {(full.discountCents ?? 0) > 0 && (
              <div className="flex justify-between gap-3 font-semibold text-success">
                <dt className="min-w-0">{full.discountLabel ? `${m.common.discount} · ${full.discountLabel}` : m.common.discount}</dt>
                <dd>−{price(full.discountCents ?? 0)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="min-w-0">{fmt(t.shippingLine, { rate: full.shippingRateName, city: full.shipCity, country: countryName(full.shipCountryCode, locale) })}</dt>
              <dd>{price(full.shippingCents)}</dd>
            </div>
            <div className="flex justify-between gap-3 text-lg font-extrabold">
              <dt>{t.totalPaid}</dt>
              <dd>{price(full.totalCents)}</dd>
            </div>
          </dl>
        )}
      </section>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/catalogue" className="btn-primary">
          {m.common.continueShopping}
        </Link>
        <Link href="/commande/suivi" className="btn-outline">
          {t.otherOrder}
        </Link>
      </div>
    </div>
  );
}
