'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
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
/** Résultat du contrôle automatique du justificatif renvoyé par l'API en cas de refus. */
interface ProofRejection {
  kind: 'mismatch' | 'unreadable';
  referenceFound?: boolean;
  amountFound?: boolean;
}

const EMPTY_ADDRESS = { firstName: '', lastName: '', company: '', line1: '', line2: '', postalCode: '', city: '', region: '', countryCode: '', phone: '' };
type AddressState = typeof EMPTY_ADDRESS;
type Step = 1 | 2;

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

/**
 * Brouillon de l'onglet (sessionStorage, effacé à la fermeture de l'onglet et après la commande) : le client qui part faire son
 * virement dans l'application de sa banque retrouve l'étape 2, avec la même référence, même si le navigateur a rechargé la page.
 */
const DRAFT_KEY = 'commande-brouillon';
interface Draft {
  email: string;
  address: AddressState;
  rateId: string;
  step: Step;
}
function readDraft(): Draft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    const draft = raw ? (JSON.parse(raw) as Partial<Draft>) : null;
    if (!draft || typeof draft.email !== 'string' || !draft.address || typeof draft.address !== 'object') return null;
    return { email: draft.email, address: { ...EMPTY_ADDRESS, ...draft.address }, rateId: String(draft.rateId ?? ''), step: draft.step === 2 ? 2 : 1 };
  } catch {
    return null;
  }
}
function writeDraft(draft: Draft | null) {
  try {
    if (draft) window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* stockage indisponible (navigation privée) : la page fonctionne sans brouillon */
  }
}

const STEP_STATE = 'glacioraCheckoutStep';

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
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState<AddressState>(EMPTY_ADDRESS);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [rateId, setRateId] = useState('');
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [stepError, setStepError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [proofRejection, setProofRejection] = useState<ProofRejection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  /** Mode de livraison à resélectionner après rechargement des tarifs (brouillon restauré). */
  const preferredRate = useRef('');
  /** Étape 2 à rouvrir automatiquement (brouillon d'un onglet rechargé pendant le virement). */
  const resumePayment = useRef(false);
  /** Commande enregistrée : le brouillon de l'onglet est effacé et n'est plus réécrit. */
  const orderPlaced = useRef(false);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const proofInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<CheckoutConfig>('/api/checkout/config').then(setConfig).catch(() => setGlobalError(t.configError));
  }, [t.configError]);

  // Brouillon de l'onglet : restauré une fois, avant les adresses enregistrées du compte.
  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setEmail(draft.email);
      setAddress(draft.address);
      preferredRate.current = draft.rateId;
      resumePayment.current = draft.step === 2;
    }
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded || orderPlaced.current) return;
    // Étape 2 en cours de reprise (onglet rechargé) : elle reste l'étape enregistrée tant que la reprise n'a pas eu lieu.
    writeDraft({ email, address, rateId, step: resumePayment.current ? 2 : step });
  }, [draftLoaded, email, address, rateId, step]);

  useEffect(() => {
    if (!user || !draftLoaded) return;
    setEmail((e) => e || user.email);
    api<{ addresses: SavedAddress[] }>('/api/account/addresses')
      .then((d) => {
        setSaved(d.addresses);
        const def = d.addresses[0];
        // Une adresse déjà saisie dans cet onglet n'est pas remplacée par l'adresse enregistrée.
        if (def && !readDraft()?.address.line1) applySaved(def);
      })
      .catch(() => undefined);
  }, [user, draftLoaded]);

  useEffect(() => {
    setQuotes([]);
    setRateId('');
    if (!address.countryCode) return;
    api<{ quotes: Quote[] }>(`/api/checkout/shipping-quotes?country=${address.countryCode}`)
      .then((d) => {
        setQuotes(d.quotes);
        const preferred = d.quotes.find((q) => q.rateId === preferredRate.current);
        setRateId(preferred?.rateId ?? d.quotes[0]?.rateId ?? '');
      })
      .catch(() => setQuotes([]));
  }, [address.countryCode, cart?.subtotalCents]);

  const quote = useMemo(() => quotes.find((q) => q.rateId === rateId), [quotes, rateId]);
  const bankAvailable = config?.paymentMethods.find((pm) => pm.id === 'BANK_TRANSFER')?.available ?? false;
  const card = config?.paymentMethods.find((pm) => pm.id === 'CARD');
  const maxFiles = config?.upload.maxFiles ?? 1;
  // Virement possible pour le pays choisi (un compte bancaire couvre ce pays, ou le compte principal couvre tous les pays).
  const bankForCountry = !config?.bankTransferCountries || !address.countryCode || config.bankTransferCountries.includes(address.countryCode);

  const showStep = useCallback((next: Step, push: boolean) => {
    setStep(next);
    setStepError('');
    if (push && next === 2) window.history.pushState({ [STEP_STATE]: 2 }, '');
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      stepHeading.current?.focus({ preventScroll: true });
    });
  }, []);

  // Bouton « Retour » du navigateur à l'étape 2 : revient à l'étape 1 au lieu de quitter la commande.
  useEffect(() => {
    function onPopState(e: PopStateEvent) {
      if ((e.state as Record<string, unknown> | null)?.[STEP_STATE] !== 2) showStep(1, false);
      else if (payment) showStep(2, false);
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [payment, showStep]);

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
    setStepError('');
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

  /** Montant définitif, référence réservée et compte bancaire du pays de livraison (l'API les signe pour l'étape 2). */
  const loadPaymentDetails = useCallback(async () => {
    const details = await api<PaymentDetails>('/api/checkout/payment-details', { method: 'POST', json: { countryCode: address.countryCode, shippingRateId: rateId } });
    setPayment(details);
    return details;
  }, [address.countryCode, rateId]);

  /** Étape 1 validée : contrôle du formulaire puis affichage de l'étape 2 avec les coordonnées bancaires du pays choisi. */
  async function onContinue(e: FormEvent) {
    e.preventDefault();
    setGlobalError('');
    setStepError('');
    if (!(await validateDelivery())) {
      // Le message s'affiche sous le bouton et le premier champ à corriger reçoit le focus (souvent hors écran sur mobile).
      setStepError(t.completeDelivery);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setLoadingPayment(true);
    try {
      await loadPaymentDetails();
      showStep(2, true);
    } catch (err) {
      setStepError(apiErrorMessage(err, locale, m, t.bankDetailsFailed));
    } finally {
      setLoadingPayment(false);
    }
  }

  // Onglet rechargé pendant le virement : l'étape 2 revient dès que les tarifs du pays sont chargés (même référence, cookie signé).
  useEffect(() => {
    if (!resumePayment.current || !config || !cart || cart.items.length === 0 || !rateId || !bankForCountry) return;
    resumePayment.current = false;
    loadPaymentDetails()
      .then(() => showStep(2, false))
      .catch(() => setStep(1));
  }, [config, cart, rateId, bankForCountry, loadPaymentDetails, showStep]);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const next = { ...errors };
    delete next.proof;
    setProofRejection(null);
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

  /** Étape 2 : envoi de la preuve. L'API vérifie que la référence et le montant y figurent avant d'enregistrer la commande. */
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError('');
    setProofRejection(null);
    const data = { email, shippingAddress: address, shippingRateId: rateId, paymentMethod: 'BANK_TRANSFER' as const, acceptTerms, locale };
    const { checkoutSchema } = await loadSchemas();
    const parsed = checkoutSchema.safeParse(data);
    const next: Record<string, string> = {};
    if (!parsed.success) for (const issue of parsed.error.issues) next[issue.path.join('.')] ??= issue.message;
    if (files.length === 0) next.proof = t.proofRequired;
    setErrors(translateFieldErrors(next, m));
    if (Object.keys(next).some((key) => key !== 'acceptTerms' && key !== 'proof')) {
      showStep(1, false);
      setStepError(t.completeDelivery);
      return;
    }
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
      orderPlaced.current = true;
      writeDraft(null);
      await refresh();
      router.push(`/commande/confirmation?ref=${encodeURIComponent(res.order.reference)}`);
    } catch (err) {
      setSubmitting(false);
      const body = err instanceof ApiError ? err.body : undefined;
      const details = (body?.details ?? {}) as { code?: string; referenceFound?: boolean; amountFound?: boolean };
      if (body?.code === 'PROOF_MISMATCH' || body?.code === 'PROOF_UNREADABLE') {
        setProofRejection({ kind: body.code === 'PROOF_MISMATCH' ? 'mismatch' : 'unreadable', referenceFound: details.referenceFound, amountFound: details.amountFound });
        setErrors((current) => ({ ...current, proof: ' ' }));
        requestAnimationFrame(() => document.getElementById('refus-justificatif')?.scrollIntoView({ block: 'center' }));
        return;
      }
      const serverFields = translateFieldErrors(fieldErrors(err), m);
      setErrors(serverFields);
      if (Object.keys(serverFields).some((key) => key.startsWith('shippingAddress') || key === 'email' || key === 'shippingRateId')) {
        showStep(1, false);
        setStepError(t.completeDelivery);
        return;
      }
      setGlobalError(apiErrorMessage(err, locale, m, t.orderFailed));
      // Montant, référence ou compte changés entre-temps : nouvelles coordonnées affichées tout de suite.
      if (details.code === 'AMOUNT_CHANGED' || details.code === 'REFERENCE_EXPIRED' || details.code === 'REFERENCE_USED' || details.code === 'BANK_ACCOUNT_CHANGED') {
        loadPaymentDetails().catch(() => showStep(1, false));
      }
      requestAnimationFrame(() => window.scrollTo({ top: 0 }));
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

  const err = (key: string) => errors[key]?.trim() || undefined;
  const totalCents = (cart?.subtotalCents ?? 0) + (quote?.priceCents ?? 0);
  const onPayment = step === 2 && payment !== null;

  const rejectionMessage = (() => {
    if (!proofRejection || !payment) return '';
    const vars = { reference: payment.reference, amount: price(payment.amountCents) };
    if (proofRejection.kind === 'unreadable') return t.proofUnreadable;
    if (!proofRejection.referenceFound && !proofRejection.amountFound) return fmt(t.proofMismatchBoth, vars);
    if (!proofRejection.referenceFound) return fmt(t.proofMismatchReference, vars);
    return fmt(t.proofMismatchAmount, vars);
  })();

  return (
    <div className="container py-10">
      <h1 className="text-3xl sm:text-4xl">{t.title}</h1>
      <ol aria-label={t.steps} className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
        <li aria-current={!onPayment ? 'step' : undefined} className={!onPayment ? 'rounded-full bg-marine px-3 py-1 text-white' : 'px-3 py-1 text-muted'}>
          {t.stepDelivery}
        </li>
        <li aria-hidden="true" className="text-muted">
          ›
        </li>
        <li aria-current={onPayment ? 'step' : undefined} className={onPayment ? 'rounded-full bg-marine px-3 py-1 text-white' : 'px-3 py-1 text-muted'}>
          {t.stepPayment}
        </li>
      </ol>
      {!user && !onPayment && (
        <p className="mt-3 text-sm text-muted">
          {t.alreadyCustomer} <Link href={`/compte/connexion?retour=${encodeURIComponent(router.to('/commande'))}`} className="font-semibold text-deep underline">{t.loginLink}</Link> {t.loginToFind}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {globalError && (
            <p role="alert" className="mb-6 rounded-md bg-danger/10 p-4 text-sm font-semibold text-danger">
              {globalError}
            </p>
          )}

          {!onPayment ? (
            <form onSubmit={onContinue} noValidate className="space-y-4" data-testid="checkout-step-1">
              <h2 id="etape-livraison" ref={stepHeading} tabIndex={-1} className="text-xl outline-none">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            <input type="radio" name="shippingRateId" value={q.rateId} checked={rateId === q.rateId} onChange={() => { setRateId(q.rateId); preferredRate.current = q.rateId; }} className="h-4 w-4 accent-deep" />
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
                  {err('shippingRateId') && <p className="field-error">{err('shippingRateId')}</p>}
                </fieldset>
              )}
              {bankAvailable && !bankForCountry && (
                <p role="alert" className="rounded-md bg-warning/10 p-3 text-sm font-semibold text-warning" data-testid="bank-unavailable-country">
                  {fmt(t.bankNotForCountry, { country: country(address.countryCode), email: BRAND.email, phone: BRAND.phoneDisplay })}
                </p>
              )}
              {config && !bankAvailable && <p className="rounded-md bg-warning/10 p-3 text-sm font-semibold text-warning">{t.bankTransfer} {t.unavailable}</p>}
              <div className="pt-2">
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!bankAvailable || !bankForCountry || loadingPayment} aria-describedby={stepError ? 'erreur-etape-1' : undefined} data-testid="continue-to-payment">
                  {loadingPayment ? m.common.loading : t.continueToPayment}
                </button>
                {stepError && (
                  <p id="erreur-etape-1" role="alert" className="mt-3 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
                    {stepError}
                  </p>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-8" data-testid="checkout-step-2">
              <h2 id="etape-paiement" ref={stepHeading} tabIndex={-1} className="text-xl outline-none">
                {t.stepPayment}
              </h2>

              <section aria-labelledby="vos-informations" className="rounded-lg border border-line p-5 text-sm" data-testid="delivery-recap">
                <div className="flex items-start justify-between gap-4">
                  <h3 id="vos-informations" className="text-base">
                    {t.yourDetails}
                  </h3>
                  <button type="button" className="inline-flex min-h-[44px] items-center font-semibold text-deep underline" onClick={() => (window.history.state?.[STEP_STATE] === 2 ? window.history.back() : showStep(1, false))} data-testid="edit-details">
                    {t.editDetails}
                  </button>
                </div>
                <p className="mt-1">
                  {address.firstName} {address.lastName}
                  {address.company && <>, {address.company}</>}
                  <br />
                  {address.line1}
                  {address.line2 && <>, {address.line2}</>}
                  <br />
                  {address.postalCode} {address.city}
                  {address.region && <>, {address.region}</>} — <strong>{country(address.countryCode)}</strong>
                  <br />
                  {address.phone} · {email}
                </p>
                {quote && (
                  <p className="mt-2 text-muted">
                    {t.shippingMethod} : {quote.name}
                    {quote.minDays != null && quote.maxDays != null && <> ({fmt(t.businessDays, { min: quote.minDays, max: quote.maxDays })})</>}
                  </p>
                )}
              </section>

              <section aria-labelledby="mode-paiement" className="space-y-4">
                <h3 id="mode-paiement" className="text-base">
                  {t.paymentMethod}
                </h3>
                <fieldset className="space-y-2">
                  <legend className="sr-only">{t.paymentMethod}</legend>
                  <label className="flex min-h-[44px] items-center gap-3 rounded-md border border-deep p-3 text-sm">
                    <input type="radio" name="paymentMethod" value="BANK_TRANSFER" defaultChecked className="h-4 w-4 accent-deep" data-testid="pay-bank-transfer" />
                    <span className="font-semibold">{t.bankTransfer}</span>
                  </label>
                  <label className="flex min-h-[44px] cursor-not-allowed items-center gap-3 rounded-md border border-line bg-snow p-3 text-sm text-muted">
                    <input type="radio" name="paymentMethod" value="CARD" disabled aria-describedby="carte-indispo" className="h-4 w-4" />
                    <span className="font-semibold">{t.card}</span>
                    <span id="carte-indispo" className="ml-auto rounded-sm bg-white px-2 py-0.5 text-xs font-bold uppercase text-muted">
                      {locale === 'fr' && card?.unavailableReason ? card.unavailableReason : t.cardUnavailable}
                    </span>
                  </label>
                </fieldset>

                <div className="grid grid-cols-1 gap-6 rounded-lg border border-line p-5 sm:grid-cols-[minmax(0,1fr)_auto]" data-testid="bank-details">
                  <h4 className="text-sm font-bold sm:col-span-2">{t.bankDetailsTitle}</h4>
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
                      <dd className="text-lg font-extrabold" data-testid="transfer-amount">{price(payment.amountCents)}</dd>
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
              </section>

              <section className="space-y-4">
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
                  <input ref={proofInput} id="proof" name="proof" type="file" multiple={maxFiles > 1} accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={onFile} className="field-input file:mr-3 file:rounded-md file:border-0 file:bg-snow file:px-3 file:py-1 file:font-semibold" aria-invalid={Boolean(errors.proof)} aria-describedby={['proof-aide', err('proof') && 'proof-erreur', proofRejection && 'refus-justificatif'].filter(Boolean).join(' ')} />
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

                {proofRejection && (
                  <div id="refus-justificatif" role="alert" className="rounded-md bg-danger/10 p-4 text-sm text-danger" data-testid="proof-rejected">
                    <p className="font-semibold">{rejectionMessage}</p>
                    <p className="mt-1">{t.proofMismatchAdvice}</p>
                  </div>
                )}

                <p className="text-xs text-muted">{fmt(t.proofCheckHint, { reference: payment.reference, amount: price(payment.amountCents) })}</p>
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting} aria-describedby={proofRejection ? 'refus-justificatif' : undefined} data-testid="place-order">
                  {submitting ? t.verifyingProof : t.placeOrder}
                </button>
                {submitting && (
                  <p role="status" className="text-xs text-muted">
                    {t.verifyingProof}
                  </p>
                )}
              </section>
            </form>
          )}
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
              <dd data-testid="order-total">{price(onPayment ? payment.amountCents : totalCents)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
