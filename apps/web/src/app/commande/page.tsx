'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { PROOF_MIME_TYPES, addressSchema, checkoutSchema, emailSchema, formatPrice } from '@glaciora/shared';
import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { ApiError, api, fieldErrors } from '@/lib/api-client';

interface CheckoutConfig {
  countries: { code: string; name: string }[];
  paymentMethods: { id: 'BANK_TRANSFER' | 'CARD'; label: string; available: boolean; unavailableReason?: string }[];
  upload: { maxBytes: number; mimeTypes: string[] };
}
interface Quote {
  rateId: string;
  name: string;
  priceCents: number;
  isFree: boolean;
  minDays?: number | null;
  maxDays?: number | null;
}
interface PaymentDetails {
  reference: string;
  amountCents: number;
  subtotalCents: number;
  shippingCents: number;
  shippingRateName: string;
  bank: { accountHolder: string; iban: string; bic: string | null; bankName: string | null };
  qrCodeDataUrl: string;
}
interface SavedAddress {
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
}

const EMPTY_ADDRESS = { firstName: '', lastName: '', company: '', line1: '', line2: '', postalCode: '', city: '', region: '', countryCode: '', phone: '' };
type AddressState = typeof EMPTY_ADDRESS;

const ADDRESS_FIELDS: { name: keyof AddressState; label: string; autoComplete: string; required?: boolean; half?: boolean }[] = [
  { name: 'firstName', label: 'Prénom', autoComplete: 'given-name', required: true, half: true },
  { name: 'lastName', label: 'Nom', autoComplete: 'family-name', required: true, half: true },
  { name: 'company', label: 'Société (facultatif)', autoComplete: 'organization' },
  { name: 'line1', label: 'Adresse', autoComplete: 'address-line1', required: true },
  { name: 'line2', label: 'Complément d’adresse (facultatif)', autoComplete: 'address-line2' },
  { name: 'postalCode', label: 'Code postal', autoComplete: 'postal-code', required: true, half: true },
  { name: 'city', label: 'Ville', autoComplete: 'address-level2', required: true, half: true },
  { name: 'region', label: 'Région / canton (facultatif)', autoComplete: 'address-level1', half: true },
  { name: 'phone', label: 'Téléphone', autoComplete: 'tel', required: true, half: true },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading: cartLoading, refresh } = useCart();
  const { user } = useAuth();
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState<AddressState>(EMPTY_ADDRESS);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [rateId, setRateId] = useState('');
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    api<CheckoutConfig>('/api/checkout/config').then(setConfig).catch(() => setGlobalError('Impossible de charger les options de commande.'));
  }, []);

  useEffect(() => {
    if (!user) return;
    setEmail((e) => e || user.email);
    api<{ addresses: SavedAddress[] }>('/api/account/addresses')
      .then((d) => {
        setSaved(d.addresses);
        const def = d.addresses[0];
        if (def) applySaved(def);
      })
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    setPayment(null);
    setQuotes([]);
    setRateId('');
    if (!address.countryCode) return;
    api<{ quotes: Quote[] }>(`/api/checkout/shipping-quotes?country=${address.countryCode}`)
      .then((d) => {
        setQuotes(d.quotes);
        setRateId(d.quotes[0]?.rateId ?? '');
      })
      .catch(() => setQuotes([]));
  }, [address.countryCode, cart?.subtotalCents]);

  const quote = useMemo(() => quotes.find((q) => q.rateId === rateId), [quotes, rateId]);
  const bankAvailable = config?.paymentMethods.find((m) => m.id === 'BANK_TRANSFER')?.available ?? false;
  const card = config?.paymentMethods.find((m) => m.id === 'CARD');

  function applySaved(a: SavedAddress) {
    setAddress({
      firstName: a.firstName,
      lastName: a.lastName,
      company: a.company ?? '',
      line1: a.line1,
      line2: a.line2 ?? '',
      postalCode: a.postalCode,
      city: a.city,
      region: a.region ?? '',
      countryCode: a.countryCode,
      phone: a.phone,
    });
  }

  function onAddressChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setAddress((a) => ({ ...a, [name]: value }));
    setPayment(null);
  }

  function validateDelivery(): boolean {
    const next: Record<string, string> = {};
    const emailCheck = emailSchema.safeParse(email);
    if (!emailCheck.success) next.email = emailCheck.error.issues[0]?.message ?? 'E-mail invalide';
    const addressCheck = addressSchema.safeParse(address);
    if (!addressCheck.success) for (const issue of addressCheck.error.issues) next[`shippingAddress.${issue.path.join('.')}`] ??= issue.message;
    if (!rateId) next.shippingRateId = 'Choisissez un mode de livraison';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function showPaymentDetails() {
    setGlobalError('');
    if (!validateDelivery()) {
      setGlobalError('Vérifiez les champs signalés avant de continuer.');
      return;
    }
    setLoadingPayment(true);
    try {
      setPayment(await api<PaymentDetails>('/api/checkout/payment-details', { method: 'POST', json: { countryCode: address.countryCode, shippingRateId: rateId } }));
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'Coordonnées bancaires indisponibles.');
    } finally {
      setLoadingPayment(false);
    }
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    const next = { ...errors };
    delete next.proof;
    if (selected && config) {
      if (!config.upload.mimeTypes.includes(selected.type)) next.proof = 'Format non accepté : PDF, JPG, PNG ou WEBP uniquement.';
      else if (selected.size > config.upload.maxBytes) next.proof = `Fichier trop volumineux (${Math.round(config.upload.maxBytes / 1024 / 1024)} Mo maximum).`;
    }
    setErrors(next);
    setFile(next.proof ? null : selected);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError('');
    const data = { email, shippingAddress: address, shippingRateId: rateId, paymentMethod: 'BANK_TRANSFER' as const, acceptTerms };
    const parsed = checkoutSchema.safeParse(data);
    const next: Record<string, string> = {};
    if (!parsed.success) for (const issue of parsed.error.issues) next[issue.path.join('.')] ??= issue.message;
    if (!file) next.proof = 'Ajoutez la confirmation de votre virement (PDF, JPG, PNG ou WEBP).';
    setErrors(next);
    if (Object.keys(next).length > 0 || !payment) {
      setGlobalError('Vérifiez les champs signalés avant de valider.');
      return;
    }
    setSubmitting(true);
    try {
      const body = new FormData();
      body.set('data', JSON.stringify(data));
      body.set('proof', file!);
      const res = await api<{ order: { reference: string } }>('/api/checkout/orders', { method: 'POST', body });
      await refresh();
      router.push(`/commande/confirmation?ref=${encodeURIComponent(res.order.reference)}`);
    } catch (err) {
      setErrors(fieldErrors(err));
      const code = err instanceof ApiError ? (err.body.details as { code?: string } | undefined)?.code : undefined;
      if (code === 'AMOUNT_CHANGED' || code === 'REFERENCE_EXPIRED' || code === 'REFERENCE_USED') setPayment(null);
      setGlobalError(err instanceof ApiError ? err.message : 'La commande n’a pas pu être enregistrée. Réessayez.');
      setSubmitting(false);
    }
  }

  if (!cartLoading && (!cart || cart.items.length === 0)) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl">Commande</h1>
        <p className="mt-4 text-muted">Votre panier est vide.</p>
        <Link href="/catalogue" className="btn-primary mt-6">
          Voir le catalogue
        </Link>
      </div>
    );
  }

  const err = (key: string) => errors[key];
  const totalCents = (cart?.subtotalCents ?? 0) + (quote?.priceCents ?? 0);

  return (
    <div className="container py-10">
      <h1 className="text-3xl sm:text-4xl">Commande</h1>
      {!user && (
        <p className="mt-2 text-sm text-muted">
          Déjà client ? <Link href="/compte/connexion?retour=/commande" className="font-semibold text-deep underline">Connectez-vous</Link> pour retrouver vos adresses.
        </p>
      )}
      <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          {globalError && (
            <p role="alert" className="rounded-md bg-danger/10 p-4 text-sm font-semibold text-danger">
              {globalError}
            </p>
          )}

          <section aria-labelledby="etape-livraison" className="space-y-4">
            <h2 id="etape-livraison" className="text-xl">
              1. Livraison
            </h2>
            {saved.length > 0 && (
              <div>
                <label htmlFor="adresse-enregistree" className="field-label">
                  Adresse enregistrée
                </label>
                <select id="adresse-enregistree" className="field-input" onChange={(e) => { const a = saved.find((s) => s.id === e.target.value); if (a) applySaved(a); }}>
                  {saved.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label ?? `${a.firstName} ${a.lastName}`} — {a.line1}, {a.city}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="email" className="field-label">
                E-mail <span aria-hidden="true">*</span>
              </label>
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" aria-invalid={Boolean(err('email'))} aria-describedby={err('email') ? 'email-erreur' : undefined} />
              {err('email') && <p id="email-erreur" className="field-error">{err('email')}</p>}
            </div>
            <div>
              <label htmlFor="countryCode" className="field-label">
                Pays de livraison <span aria-hidden="true">*</span>
              </label>
              <select id="countryCode" name="countryCode" required value={address.countryCode} onChange={onAddressChange} className="field-input" autoComplete="country" aria-invalid={Boolean(err('shippingAddress.countryCode'))} data-testid="country-select">
                <option value="">Choisir un pays</option>
                {config?.countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              {config && config.countries.length === 0 && <p className="field-error">Aucun pays de livraison n’est encore configuré.</p>}
              {err('shippingAddress.countryCode') && <p className="field-error">{err('shippingAddress.countryCode')}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {ADDRESS_FIELDS.map((f) => {
                const key = `shippingAddress.${f.name}`;
                return (
                  <div key={f.name} className={f.half ? '' : 'sm:col-span-2'}>
                    <label htmlFor={f.name} className="field-label">
                      {f.label} {f.required && <span aria-hidden="true">*</span>}
                    </label>
                    <input
                      id={f.name}
                      name={f.name}
                      autoComplete={f.autoComplete}
                      required={f.required}
                      value={address[f.name]}
                      onChange={onAddressChange}
                      className="field-input"
                      aria-invalid={Boolean(err(key))}
                      aria-describedby={err(key) ? `${f.name}-erreur` : undefined}
                      type={f.name === 'phone' ? 'tel' : 'text'}
                    />
                    {err(key) && (
                      <p id={`${f.name}-erreur`} className="field-error">
                        {err(key)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {address.countryCode && (
              <fieldset>
                <legend className="field-label">Mode de livraison</legend>
                {quotes.length === 0 ? (
                  <p className="field-error">Livraison indisponible pour ce pays.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {quotes.map((q) => (
                      <label key={q.rateId} className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-md border border-line p-3 text-sm has-[:checked]:border-deep">
                        <span className="flex items-center gap-3">
                          <input type="radio" name="shippingRateId" value={q.rateId} checked={rateId === q.rateId} onChange={() => { setRateId(q.rateId); setPayment(null); }} className="h-4 w-4 accent-deep" />
                          <span>
                            {q.name}
                            {q.minDays != null && q.maxDays != null && <span className="block text-muted">{q.minDays} à {q.maxDays} jours ouvrés</span>}
                          </span>
                        </span>
                        <span className="font-semibold">{q.isFree ? 'Offerte' : formatPrice(q.priceCents)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
            )}
          </section>

          <section aria-labelledby="etape-paiement" className="space-y-4">
            <h2 id="etape-paiement" className="text-xl">
              2. Paiement
            </h2>
            <fieldset className="space-y-2">
              <legend className="sr-only">Mode de paiement</legend>
              <label className="flex min-h-[44px] items-center gap-3 rounded-md border border-deep p-3 text-sm">
                <input type="radio" name="paymentMethod" value="BANK_TRANSFER" defaultChecked disabled={!bankAvailable} className="h-4 w-4 accent-deep" data-testid="pay-bank-transfer" />
                <span className="font-semibold">Virement bancaire</span>
                {!bankAvailable && config && <span className="text-danger">— indisponible</span>}
              </label>
              <label className="flex min-h-[44px] cursor-not-allowed items-center gap-3 rounded-md border border-line bg-snow p-3 text-sm text-muted">
                <input type="radio" name="paymentMethod" value="CARD" disabled aria-describedby="carte-indispo" className="h-4 w-4" />
                <span className="font-semibold">{card?.label ?? 'Carte bancaire'}</span>
                <span id="carte-indispo" className="ml-auto rounded-sm bg-white px-2 py-0.5 text-xs font-bold uppercase text-muted">
                  {card?.unavailableReason ?? 'Indisponible pour le moment'}
                </span>
              </label>
            </fieldset>

            {!payment ? (
              <button type="button" className="btn-outline" onClick={showPaymentDetails} disabled={!bankAvailable || loadingPayment} data-testid="show-bank-details">
                {loadingPayment ? 'Chargement…' : 'Afficher les coordonnées bancaires'}
              </button>
            ) : (
              <div className="grid gap-6 rounded-lg border border-line p-5 sm:grid-cols-[1fr_auto]" data-testid="bank-details">
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted">Bénéficiaire</dt>
                    <dd className="font-semibold">{payment.bank.accountHolder}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">IBAN</dt>
                    <dd className="font-mono font-semibold" data-testid="iban">{payment.bank.iban}</dd>
                  </div>
                  {payment.bank.bic && (
                    <div>
                      <dt className="text-muted">BIC</dt>
                      <dd className="font-mono font-semibold">{payment.bank.bic}</dd>
                    </div>
                  )}
                  {payment.bank.bankName && (
                    <div>
                      <dt className="text-muted">Banque</dt>
                      <dd className="font-semibold">{payment.bank.bankName}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted">Montant exact</dt>
                    <dd className="text-lg font-extrabold">{formatPrice(payment.amountCents)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Référence à indiquer</dt>
                    <dd className="font-mono text-lg font-extrabold text-deep" data-testid="transfer-reference">{payment.reference}</dd>
                  </div>
                </dl>
                <figure className="text-center">
                  <Image src={payment.qrCodeDataUrl} alt={`QR code SEPA : virement de ${formatPrice(payment.amountCents)}, référence ${payment.reference}`} width={180} height={180} unoptimized className="mx-auto rounded-md bg-white" data-testid="sepa-qr" />
                  <figcaption className="mt-2 max-w-[180px] text-xs text-muted">Scannez avec votre application bancaire</figcaption>
                </figure>
                <p className="text-xs text-muted sm:col-span-2">Indiquez bien la référence : elle nous permet de rapprocher votre virement de la commande. Le QR code reste valable 3 heures.</p>
              </div>
            )}

            {payment && (
              <div>
                <label htmlFor="proof" className="field-label">
                  Confirmation de virement <span aria-hidden="true">*</span>
                </label>
                <p id="proof-aide" className="mb-2 text-xs text-muted">
                  Capture ou avis d’opéré de votre banque : {PROOF_MIME_TYPES.map((m) => m.split('/')[1]!.toUpperCase().replace('JPEG', 'JPG')).join(', ')} — {config ? Math.round(config.upload.maxBytes / 1024 / 1024) : 10} Mo maximum.
                </p>
                <input id="proof" name="proof" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={onFile} className="field-input file:mr-3 file:rounded-md file:border-0 file:bg-snow file:px-3 file:py-1 file:font-semibold" aria-invalid={Boolean(err('proof'))} aria-describedby={err('proof') ? 'proof-aide proof-erreur' : 'proof-aide'} />
                {err('proof') && (
                  <p id="proof-erreur" className="field-error">
                    {err('proof')}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-lg bg-snow p-6 lg:sticky lg:top-28" aria-labelledby="recap-commande">
          <h2 id="recap-commande" className="text-lg">
            Récapitulatif
          </h2>
          <ul className="space-y-3 text-sm">
            {cart?.items.map((item) => (
              <li key={item.variantId} className="flex justify-between gap-3">
                <span>
                  {item.quantity} × {item.brand} {item.productName}
                  {item.sizeLabel && <span className="block text-muted">Taille {item.sizeLabel}</span>}
                </span>
                <span className="font-semibold">{formatPrice(item.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt>Sous-total</dt>
              <dd>{formatPrice(cart?.subtotalCents ?? 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Livraison</dt>
              <dd>{quote ? (quote.isFree ? 'Offerte' : formatPrice(quote.priceCents)) : '—'}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-lg font-extrabold">
              <dt>Total TTC</dt>
              <dd data-testid="order-total">{formatPrice(payment?.amountCents ?? totalCents)}</dd>
            </div>
          </dl>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1 h-4 w-4 accent-deep" aria-invalid={Boolean(err('acceptTerms'))} />
            <span>
              J’accepte les{' '}
              <Link href="/conditions-de-vente" target="_blank" className="font-semibold text-deep underline">
                conditions de vente
              </Link>
            </span>
          </label>
          {err('acceptTerms') && <p className="field-error">{err('acceptTerms')}</p>}
          <button type="submit" className="btn-primary w-full" disabled={!payment || submitting} data-testid="place-order">
            {submitting ? 'Envoi en cours…' : 'Valider la commande'}
          </button>
          {!payment && <p className="text-xs text-muted">Affichez les coordonnées bancaires et ajoutez votre confirmation de virement pour valider.</p>}
        </aside>
      </form>
    </div>
  );
}
