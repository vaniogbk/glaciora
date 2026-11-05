import { BRAND, DEFAULT_SITE_LOCALE, countryName, formatPrice, intlTag, isSiteLocale, type OrderStatus } from '@glaciora/shared';
import { emailTexts, fill } from './email.i18n';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
  /** Fichiers du stockage privé à joindre (lus au moment de l'envoi). */
  attachments?: { name: string; storageKey: string }[];
}

/** Preuves jointes à l'e-mail de la boutique tant que leur total reste sous la limite des pièces jointes. */
export const MAX_ATTACHMENTS_BYTES = 4 * 1024 * 1024;

export interface ProofAttachment {
  storageKey: string;
  name: string;
  mime: string;
  sizeBytes: number;
}

function layout(title: string, bodyHtml: string, locale: string = DEFAULT_SITE_LOCALE): string {
  return `<!doctype html><html lang="${isSiteLocale(locale) ? locale : DEFAULT_SITE_LOCALE}"><body style="margin:0;background:#E8EEF4;font-family:Montserrat,Arial,sans-serif;color:#0A1A2F">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0A1A2F;color:#ffffff;padding:20px 28px;font-weight:800;letter-spacing:4px;font-size:20px">GLACIORA</td></tr>
<tr><td style="padding:28px"><h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(title)}</h1>${bodyHtml}</td></tr>
<tr><td style="padding:16px 28px;background:#E8EEF4;font-size:12px;color:#0A1A2F">${escapeHtml(BRAND.name)} · ${escapeHtml(BRAND.email)} · ${escapeHtml(BRAND.phoneDisplay)}</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="background:#0A6FAD;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(label)}</a></p>`;

export interface AdminTransferProofPayload {
  orderReference: string;
  customerName: string;
  amountCents: number;
  countryCode: string;
  adminOrderUrl: string;
  proofCount: number;
  attachments?: ProofAttachment[];
}

/** Notification boutique : preuve(s) de virement jointe(s) si elles tiennent sous la limite, et lien vers l'admin authentifié. */
export function adminTransferProof(p: AdminTransferProofPayload): RenderedEmail {
  const files = p.attachments ?? [];
  const attached = files.length > 0 && files.reduce((sum, f) => sum + f.sizeBytes, 0) <= MAX_ATTACHMENTS_BYTES;
  const fileNote = attached
    ? 'La ou les preuves de virement sont jointes à cet e-mail ; elles restent aussi consultables dans l’admin.'
    : files.length > 0
      ? 'Fichiers trop volumineux pour être joints : consultez-les dans l’admin après connexion.'
      : 'Le fichier se consulte dans l’admin après connexion.';
  const amount = formatPrice(p.amountCents);
  const country = countryName(p.countryCode);
  const subject = `Confirmation de virement reçue — commande ${p.orderReference}`;
  const html = layout(
    'Nouvelle confirmation de virement à vérifier',
    `<p>Un client a déposé une confirmation de virement.</p>
<table role="presentation" cellpadding="6" style="font-size:14px">
<tr><td><strong>Commande</strong></td><td>${escapeHtml(p.orderReference)}</td></tr>
<tr><td><strong>Client</strong></td><td>${escapeHtml(p.customerName)}</td></tr>
<tr><td><strong>Montant</strong></td><td>${escapeHtml(amount)}</td></tr>
<tr><td><strong>Pays de livraison</strong></td><td>${escapeHtml(country)}</td></tr>
<tr><td><strong>Fichier(s)</strong></td><td>${p.proofCount}</td></tr>
</table>
${button(p.adminOrderUrl, 'Ouvrir la commande dans l’admin')}
<p style="font-size:12px">${escapeHtml(fileNote)}</p>`,
  );
  const text = `Nouvelle confirmation de virement à vérifier
Commande : ${p.orderReference}
Client : ${p.customerName}
Montant : ${amount}
Pays de livraison : ${country}
Fichier(s) : ${p.proofCount}
${fileNote}
Consulter (connexion admin requise) : ${p.adminOrderUrl}`;
  return { subject, html, text, attachments: attached ? files.map((f) => ({ name: f.name, storageKey: f.storageKey })) : undefined };
}

/** Langue du client (site au moment de la commande ou de la demande) ; absente des anciens e-mails en file : français. */
interface Localized {
  locale?: string;
}

const price = (cents: number, locale?: string) => formatPrice(cents, intlTag(isSiteLocale(locale) ? locale : DEFAULT_SITE_LOCALE));

export interface OrderReceivedPayload extends Localized {
  orderReference: string;
  firstName: string;
  totalCents: number;
  orderUrl: string;
}

/** Étape 1 du suivi, envoyée dès le dépôt de la preuve de virement. */
export function orderReceived(p: OrderReceivedPayload): RenderedEmail {
  const t = emailTexts(p.locale);
  const amount = price(p.totalCents, p.locale);
  const step = t.steps[0];
  const subject = fill(t.receivedSubject, { ref: p.orderReference });
  const title = fill(t.receivedTitle, { name: p.firstName });
  const body = escapeHtml(fill(t.receivedBody, { ref: '\u0001', amount: '\u0002' }))
    .replace('\u0001', `<strong>${escapeHtml(p.orderReference)}</strong>`)
    .replace('\u0002', `<strong>${escapeHtml(amount)}</strong>`);
  const html = layout(
    title,
    `<p>${body}</p>
<p style="font-size:16px"><strong>${escapeHtml(step)}</strong></p>
${button(p.orderUrl, t.trackButton)}`,
    p.locale,
  );
  const text = `${title}
${fill(t.receivedBody, { ref: p.orderReference, amount })}
${step}
${t.trackButton} : ${p.orderUrl}`;
  return { subject, html, text };
}

export interface OrderStatusPayload extends Localized {
  orderReference: string;
  firstName: string;
  /** Statut traduit dans la langue du client ; statusLabel (français) reste pour les e-mails déjà en file. */
  status?: OrderStatus;
  statusLabel?: string;
  orderUrl: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  trackingCarrier?: string | null;
  /** Message libre (anciens e-mails en file) ; sinon message de l'étape (En route, Livrée) ou d'annulation selon le statut. */
  message?: string;
}

const STEP_INDEX: Partial<Record<OrderStatus, 0 | 1 | 2>> = { PREPARING: 0, SHIPPED: 1, DELIVERED: 2 };

export function orderStatusChanged(p: OrderStatusPayload): RenderedEmail {
  const t = emailTexts(p.locale);
  const statusLabel = p.status ? t.status[p.status] : (p.statusLabel ?? '');
  const stepIndex = p.status ? STEP_INDEX[p.status] : undefined;
  const message = p.status && p.locale ? (stepIndex !== undefined ? t.steps[stepIndex] : p.status === 'CANCELLED' ? t.cancelled : undefined) : p.message;
  const subject = fill(t.statusSubject, { ref: p.orderReference, status: statusLabel.toLowerCase() });
  const trackingLabel = fill(t.tracking, { carrier: p.trackingCarrier ?? '' }).replace(/\s+:/, ' :').replace(/\s{2,}/g, ' ');
  const tracking = p.trackingNumber
    ? `<p>${escapeHtml(trackingLabel)} <strong>${escapeHtml(p.trackingNumber)}</strong>${p.trackingUrl ? ` — <a href="${escapeHtml(p.trackingUrl)}">${escapeHtml(t.trackParcel)}</a>` : ''}</p>`
    : '';
  const line = escapeHtml(fill(t.statusLine, { ref: '\u0001', status: '\u0002' }))
    .replace('\u0001', `<strong>${escapeHtml(p.orderReference)}</strong>`)
    .replace('\u0002', `<strong>${escapeHtml(statusLabel)}</strong>`);
  const html = layout(
    fill(t.hello, { name: p.firstName }),
    `<p>${line}</p>${message ? `<p style="font-size:16px"><strong>${escapeHtml(message)}</strong></p>` : ''}${tracking}${button(p.orderUrl, t.trackButton)}`,
    p.locale,
  );
  const text = `${fill(t.statusLine, { ref: p.orderReference, status: statusLabel })}${message ? `\n${message}` : ''}${p.trackingNumber ? `\n${trackingLabel} ${p.trackingNumber} ${p.trackingUrl ?? ''}` : ''}\n${t.trackButton} : ${p.orderUrl}`;
  return { subject, html, text };
}

export interface PasswordResetPayload extends Localized {
  resetUrl: string;
  expiresInMinutes: number;
}

export function passwordReset(p: PasswordResetPayload): RenderedEmail {
  const t = emailTexts(p.locale);
  const body = fill(t.resetBody, { minutes: p.expiresInMinutes });
  const html = layout(
    t.resetTitle,
    `<p>${escapeHtml(body)}</p>
${button(p.resetUrl, t.resetButton)}
<p style="font-size:12px">${escapeHtml(t.resetIgnore)}</p>`,
    p.locale,
  );
  const text = `${t.resetTitle}\n${body}\n${t.resetButton} : ${p.resetUrl}`;
  return { subject: t.resetSubject, html, text };
}

export interface BankAccountChangedPayload {
  action: string;
  label: string;
  ibanMasked: string;
  countries: string[];
  actor: string;
  date: string;
}

/** Alerte de sécurité : toute modification des coordonnées bancaires est signalée à la boutique. */
export function bankAccountChanged(p: BankAccountChangedPayload): RenderedEmail {
  const when = new Date(p.date).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
  const countries = p.countries.length ? p.countries.map(countryName).join(', ') : 'aucun pays';
  const subject = `Sécurité — coordonnées bancaires : ${p.action.toLowerCase()} (${p.label})`;
  const html = layout(
    'Coordonnées bancaires modifiées',
    `<p><strong>${escapeHtml(p.action)}</strong> le ${escapeHtml(when)} par ${escapeHtml(p.actor)}.</p>
<table role="presentation" cellpadding="6" style="font-size:14px">
<tr><td><strong>Compte</strong></td><td>${escapeHtml(p.label)}</td></tr>
<tr><td><strong>IBAN</strong></td><td>${escapeHtml(p.ibanMasked)}</td></tr>
<tr><td><strong>Pays</strong></td><td>${escapeHtml(countries)}</td></tr>
</table>
<p>Si vous n'êtes pas à l'origine de ce changement, désactivez immédiatement le compte dans l'admin et changez les mots de passe administrateur.</p>`,
  );
  const text = `${p.action} le ${when} par ${p.actor}
Compte : ${p.label}
IBAN : ${p.ibanMasked}
Pays : ${countries}
Si vous n'êtes pas à l'origine de ce changement, désactivez le compte dans l'admin.`;
  return { subject, html, text };
}

export const TEMPLATES = {
  'admin-transfer-proof': adminTransferProof,
  'order-received': orderReceived,
  'order-status': orderStatusChanged,
  'password-reset': passwordReset,
  'bank-account-changed': bankAccountChanged,
} as const;

export type TemplateName = keyof typeof TEMPLATES;
export type TemplatePayload<T extends TemplateName> = Parameters<(typeof TEMPLATES)[T]>[0];

export function renderTemplate<T extends TemplateName>(name: T, payload: TemplatePayload<T>): RenderedEmail {
  return (TEMPLATES[name] as (p: TemplatePayload<T>) => RenderedEmail)(payload);
}
