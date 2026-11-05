'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { BRAND } from '@glaciora/shared/contact';
// Validation (Zod, ~100 Ko) chargée après l'affichage de la page, pas au premier rendu : la page de commande s'ouvre plus vite sur mobile.
const loadSchemas = () => import('@glaciora/shared/schemas');
import { PROOF_MIME_TYPES } from '@glaciora/shared/upload';
import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { ApiError, api, fieldErrors } from '@/lib/api-client';
import { Link, useI18n, useLocalizedRouter } from '@/i18n/client';
import { apiErrorMessage, translateFieldErrors } from '@/i18n/errors';
import { countryName, fmt, money } from '@/i18n/format';
import { sizeLabel } from '@/i18n/labels';

interface CheckoutConfig {
  countries: { code: string; name: string }[];
  paymentMethods: { id: 'BANK_TRANSFER' | 'CARD'; label: string; available: boolean; unavailableReason?: string }[];
  /** Pays où le virement est possible ; null ou absent = tous. */
  bankTransferCountries?: string[] | null;
  upload: { maxBytes: number; mimeTypes: string[]; maxFiles?: number };
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

const ADDRESS_FIELDS: { name: Exclude<keyof AddressState, 'countryCode'>; autoComplete: string; required?: boolean; half?: boolean }[] = [
  { name: 'firstName', autoComplete: 'given-name', required: true, half: true },
  { name: 'lastName', autoComplete: 'family-name', required: true, half: true },
  { name: 'company', autoComplete: 'organization' },
  { name: 'line1', autoComplete: 'address-line1', required: true },
  { name: 'line2', autoComplete: 'address-line2' },
  { name: 'postalCode', autoComplete: 'postal-code', required: true, half: true },
  { name: 'city', autoComplete: 'address-level2', required: true, half: true },
  { name: 'region', autoComplete: 'address-level1', half: true },
  { name: 'phone', autoComplete: 'tel', required: true, half: true },
];

export default function CheckoutPage() {
  const router = useLocalizedRouter();
  const { locale, m } = useI18n();
  const t = m.checkout;
  const price = (cents: number) => money(cents, locale);
  const country = (code: string) => countryName(code, locale, config?.countries.find((c) => c.code === code)?.name);
  const { cart, loading: cartLoading, refresh } = useCart();
  const { user } = useAuth();
  const [config, setConfig] = useState<CheckoutConfig | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => void loadSchemas(), 1500);
    return () => clearTimeout(timer);
  }, []);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState<AddressState>(EMPTY_ADDRESS);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [rateId, setRateId] = useState('');
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [paymentError, setPaymentError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    api<CheckoutConfig>('/api/checkout/config').then(setConfig).catch(() => setGlobalError(t.configError));
  }, [t.configError]);

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
  const maxFiles = config?.upload.maxFiles ?? 1;
  // Virement possible pour le pays choisi (un compte bancaire couvre ce pays, ou le compte principal couvre tous les pays).
  const bankForCountry = !config?.bankTransferCountries || !address.countryCode || config.bankTransferCountries.includes(address.countryCode);

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
    setPaymentError('');
  }

  async function validateDelivery(): Promise<boolean> {
    const { addressSchema, emailSchema } = await loadSchemas();
    const next: Record<string, string> = {};
    const emailCheck = emailSchema.safeParse(email);
    if (!emailCheck.success) next.email = emailCheck.error.issues[0]?.message ?? 'Adresse e-mail invalide';
    const addressCheck = addressSchema.safeParse(address);
    if (!addressCheck.success) for (const issue of addressCheck.error.issues) next[`shippingAddress.${issue.path.join('.')}`] ??= issue.message;
    if (!rateId) next.shippingRateId = 'Choisissez un mode de livraison';
    setErrors(translateFieldErrors(next, m));
    return Object.keys(next).length === 0;
  }

  async function showPaymentDetails() {
    setGlobalError('');
    setPaymentError('');
    if (!(await validateDelivery())) {
      // Le message s'affiche sous le bouton et le premier champ à corriger reçoit le focus (souvent hors écran sur mobile).
      setPaymentError(t.completeDelivery);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setLoadingPayment(true);
    try {
      setPayment(await api<PaymentDetails>('/api/checkout/payment-details', { method: 'POST', json: { countryCode: address.countryCode, shippingRateId: rateId } }));
    } catch (err) {
      setPaymentError(apiErrorMessage(err, locale, m, t.bankDetailsFailed));
    } finally {
      setLoadingPayment(false);
    }
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const next = { ...errors };
    delete next.proof;
    if (selected.length > maxFiles) next.proof = fmt(t.proofTooMany, { count: maxFiles });
    else if (config) {
      for (const f of selected) {
        if (!config.upload.mimeTypes.includes(f.type)) next.proof = fmt(t.proofBadType, { name: f.name });
        else if (f.size > config.upload.maxBytes) next.proof = fmt(t.proofTooBig, { name: f.name, size: Math.round(config.upload.maxBytes / 1024 / 1024) });
        if (next.proof) break;
      }
    }
    setErrors(next);
    setFiles(next.proof ? [] : selected);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError('');
    const data = { email, shippingAddress: address, shippingRateId: rateId, paymentMethod: 'BANK_TRANSFER' as const, acceptTerms, locale };
    const { checkoutSchema } = await loadSchemas();
    const parsed = checkoutSchema.safeParse(data);
    const next: Record<string, string> = {};
    if (!parsed.success) for (const issue of parsed.error.issues) next[issue.path.join('.')] ??= issue.message;
    if (files.length === 0) next.proof = t.proofRequired;
    setErrors(translateFieldErrors(next, m));
    if (Object.keys(next).length > 0 || !payment) {
      setGlobalError(t.checkFields);
      return;
    }
    setSubmitting(true);
    try {
      const body = new FormData();
      body.set('data', JSON.stringify(data));
      for (const f of files) body.append('proof', f);
      const res = await api<{ order: { reference: string } }>('/api/checkout/orders', { method: 'POST', body });
      await refresh();
      router.push(`/commande/confirmation?ref=${encodeURIComponent(res.order.reference)}`);
    } catch (err) {
      setErrors(translateFieldErrors(fieldErrors(err), m));
      const code = err instanceof ApiError ? (err.body.details as { code?: string } | undefined)?.code : undefined;
      if (code === 'AMOUNT_CHANGED' || code === 'REFERENCE_EXPIRED' || code === 'REFERENCE_USED') setPayment(null);
      setGlobalError(apiErrorMessage(err, locale, m, t.orderFailed));
      setSubmitting(false);
    }
  }

  if (!cartLoading && (!cart || cart.items.length === 0)) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl">{t.title}</h1>
        <p className="mt-4 text-muted">{t.emptyCart}</p>
        <Link href="/catalogue" className="btn-primary mt-6">
          {t.seeCatalogue}
        </Link>
      </div>
    );
  }

  const err = (key: string) => errors[key];
  const totalCents = (cart?.subtotalCents ?? 0) + (quote?.priceCents ?? 0);

  return (
    <div className="container py-10">
      <h1 className="text-3xl sm:text-4xl">{t.title}</h1>
      {!user && (
        <p className="mt-2 text-sm text-muted">
          {t.alreadyCustomer} <Link href={`/compte/connexion?retour=${encodeURIComponent(router.to('/commande'))}`} className="font-semibold text-deep underline">{t.loginLink}</Link> {t.loginToFind}
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
              {t.stepDelivery}
            </h2>
            {saved.length > 0 && (
              <div>
                <label htmlFor="adresse-enregistree" className="field-label">
                  {t.savedAddress}
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
                {m.common.email} <span aria-hidden="true">*</span>
              </label>
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" aria-invalid={Boolean(err('email'))} aria-describedby={err('email') ? 'email-erreur' : undefined} />
              {err('email') && <p id="email-erreur" className="field-error">{err('email')}</p>}
            </div>
            <div>
              <label htmlFor="countryCode" className="field-label">
                {t.country} <span aria-hidden="true">*</span>
              </label>
              <select id="countryCode" name="countryCode" required value={address.countryCode} onChange={onAddressChange} className="field-input" autoComplete="country" aria-invalid={Boolean(err('shippingAddress.countryCode'))} data-testid="country-select">
                <option value="">{t.chooseCountry}</option>
                {config?.countries
                  .map((c) => ({ code: c.code, name: countryName(c.code, locale, c.name) }))
                  .sort((a, b) => a.name.localeCompare(b.name, locale))
                  .map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
              </select>
              {config && config.countries.length === 0 && <p className="field-error">{t.noCountries}</p>}
              {err('shippingAddress.countryCode') && <p className="field-error">{err('shippingAddress.countryCode')}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {ADDRESS_FIELDS.map((f) => {
                const key = `shippingAddress.${f.name}`;
                return (
                  <div key={f.name} className={f.half ? '' : 'sm:col-span-2'}>
                    <label htmlFor={f.name} className="field-label">
                      {t.fields[f.name]} {f.required && <span aria-hidden="true">*</span>}
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
                <legend className="field-label">{t.shippingMethod}</legend>
                {quotes.length === 0 ? (
                  <p className="field-error">{t.shippingUnavailable}</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {quotes.map((q) => (
                      <label key={q.rateId} className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-md border border-line p-3 text-sm has-[:checked]:border-deep">
                        <span className="flex items-center gap-3">
                          <input type="radio" name="shippingRateId" value={q.rateId} checked={rateId === q.rateId} onChange={() => { setRateId(q.rateId); setPayment(null); }} className="h-4 w-4 accent-deep" />
                          <span>
                            {q.name}
                            {q.minDays != null && q.maxDays != null && <span className="block text-muted">{fmt(t.businessDays, { min: q.minDays, max: q.maxDays })}</span>}
                          </span>
                        </span>
                        <span className="font-semibold">{q.isFree ? m.common.free : price(q.priceCents)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
            )}
          </section>

          <section aria-labelledby="etape-paiement" className="space-y-4">
            <h2 id="etape-paiement" className="text-xl">
              {t.stepPayment}
            </h2>
            <fieldset className="space-y-2">
              <legend className="sr-only">{t.paymentMethod}</legend>
              <label className="flex min-h-[44px] items-center gap-3 rounded-md border border-deep p-3 text-sm">
                <input type="radio" name="paymentMethod" value="BANK_TRANSFER" defaultChecked disabled={!bankAvailable} className="h-4 w-4 accent-deep" data-testid="pay-bank-transfer" />
                <span className="font-semibold">{t.bankTransfer}</span>
                {(!bankAvailable || !bankForCountry) && config && <span className="text-danger">{!bankForCountry ? fmt(t.unavailableFor, { country: country(address.countryCode) }) : t.unavailable}</span>}
              </label>
              {bankAvailable && !bankForCountry && (
                <p role="alert" className="rounded-md bg-warning/10 p-3 text-sm font-semibold text-warning" data-testid="bank-unavailable-country">
                  {fmt(t.bankNotForCountry, { country: country(address.countryCode), email: BRAND.email, phone: BRAND.phoneDisplay })}
                </p>
              )}
              <label className="flex min-h-[44px] cursor-not-allowed items-center gap-3 rounded-md border border-line bg-snow p-3 text-sm text-muted">
                <input type="radio" name="paymentMethod" value="CARD" disabled aria-describedby="carte-indispo" className="h-4 w-4" />
                <span className="font-semibold">{t.card}</span>
                <span id="carte-indispo" className="ml-auto rounded-sm bg-white px-2 py-0.5 text-xs font-bold uppercase text-muted">
                  {locale === 'fr' && card?.unavailableReason ? card.unavailableReason : t.cardUnavailable}
                </span>
              </label>
            </fieldset>

            {!payment ? (
              <div>
                <button type="button" className="btn-primary" onClick={showPaymentDetails} disabled={!bankAvailable || !bankForCountry || loadingPayment} aria-describedby={paymentError ? 'erreur-coordonnees' : undefined} data-testid="show-bank-details">
                  {loadingPayment ? m.common.loading : t.showBankDetails}
                </button>
                {paymentError && (
                  <p id="erreur-coordonnees" role="alert" className="mt-3 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
                    {paymentError}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-6 rounded-lg border border-line p-5 sm:grid-cols-[1fr_auto]" data-testid="bank-details">
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted">{t.beneficiary}</dt>
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
                      <dt className="text-muted">{t.bank}</dt>
                      <dd className="font-semibold">{payment.bank.bankName}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted">{t.exactAmount}</dt>
                    <dd className="text-lg font-extrabold">{price(payment.amountCents)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{t.reference}</dt>
                    <dd className="font-mono text-lg font-extrabold text-deep" data-testid="transfer-reference">{payment.reference}</dd>
                  </div>
                </dl>
                <figure className="text-center">
                  <Image src={payment.qrCodeDataUrl} alt={fmt(t.qrAlt, { amount: price(payment.amountCents), reference: payment.reference })} width={180} height={180} unoptimized className="mx-auto rounded-md bg-white" data-testid="sepa-qr" />
                  <figcaption className="mt-2 max-w-[180px] text-xs text-muted">{t.qrCaption}</figcaption>
                </figure>
                <p className="text-xs text-muted sm:col-span-2">{t.referenceHint}</p>
              </div>
            )}

            {payment && (
              <div>
                <label htmlFor="proof" className="field-label">
                  {t.proofLabel} <span aria-hidden="true">*</span>
                </label>
                <p id="proof-aide" className="mb-2 text-xs text-muted">
                  {fmt(t.proofHelp, {
                    types: PROOF_MIME_TYPES.map((type) => type.split('/')[1]!.toUpperCase().replace('JPEG', 'JPG')).join(', '),
                    files: maxFiles > 1 ? fmt(t.proofFiles, { count: maxFiles }) : '',
                    size: config ? Math.round(config.upload.maxBytes / 1024 / 1024) : 10,
                  })}
                </p>
                <input id="proof" name="proof" type="file" multiple={maxFiles > 1} accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={onFile} className="field-input file:mr-3 file:rounded-md file:border-0 file:bg-snow file:px-3 file:py-1 file:font-semibold" aria-invalid={Boolean(err('proof'))} aria-describedby={err('proof') ? 'proof-aide proof-erreur' : 'proof-aide'} />
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-muted" data-testid="proof-files">
                    {files.map((f) => (
                      <li key={`${f.name}-${f.size}`}>✓ {f.name} ({Math.max(1, Math.round(f.size / 1024))} Ko)</li>
                    ))}
                  </ul>
                )}
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
            {m.common.summary}
          </h2>
          <ul className="space-y-3 text-sm">
            {cart?.items.map((item) => (
              <li key={item.variantId} className="flex justify-between gap-3">
                <span>
                  {item.quantity} × {item.brand} {item.productName}
                  {item.sizeLabel && <span className="block text-muted">{fmt(t.sizeShort, { size: sizeLabel(item.sizeLabel, m.productClient.sizeWords) })}</span>}
                </span>
                <span className="font-semibold">{price(item.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt>{m.common.subtotal}</dt>
              <dd>{price(cart?.subtotalCents ?? 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{m.common.shipping}</dt>
              <dd>{quote ? (quote.isFree ? m.common.free : price(quote.priceCents)) : '—'}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-lg font-extrabold">
              <dt>{t.totalInclTax}</dt>
              <dd data-testid="order-total">{price(payment?.amountCents ?? totalCents)}</dd>
            </div>
          </dl>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1 h-4 w-4 accent-deep" aria-invalid={Boolean(err('acceptTerms'))} />
            <span>
              {t.acceptTermsBefore}{' '}
              <Link href="/conditions-de-vente" target="_blank" className="font-semibold text-deep underline">
                {t.acceptTermsLink}
              </Link>
            </span>
          </label>
          {err('acceptTerms') && <p className="field-error">{err('acceptTerms')}</p>}
          <button type="submit" className="btn-primary w-full" disabled={!payment || submitting} data-testid="place-order">
            {submitting ? t.submitting : t.placeOrder}
          </button>
          {!payment && <p className="text-xs text-muted">{t.placeOrderHint}</p>}
        </aside>
      </form>
    </div>
  );
}
