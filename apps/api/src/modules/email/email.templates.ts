import { BRAND, countryName, formatPrice } from '@glaciora/shared';

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
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#E8EEF4;font-family:Montserrat,Arial,sans-serif;color:#0A1A2F">
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
}

/** Notification boutique : aucune donnée bancaire, pas de pièce jointe, lien vers l'admin authentifié. */
export function adminTransferProof(p: AdminTransferProofPayload): RenderedEmail {
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
<p style="font-size:12px">Le fichier n'est pas joint : il se consulte dans l'espace admin après connexion.</p>`,
  );
  const text = `Nouvelle confirmation de virement à vérifier
Commande : ${p.orderReference}
Client : ${p.customerName}
Montant : ${amount}
Pays de livraison : ${country}
Fichier(s) : ${p.proofCount}
Consulter (connexion admin requise) : ${p.adminOrderUrl}`;
  return { subject, html, text };
}

export interface OrderReceivedPayload {
  orderReference: string;
  firstName: string;
  totalCents: number;
  orderUrl: string;
}

export function orderReceived(p: OrderReceivedPayload): RenderedEmail {
  const amount = formatPrice(p.totalCents);
  const subject = `Commande ${p.orderReference} reçue — paiement en cours de vérification`;
  const html = layout(
    `Merci ${p.firstName} !`,
    `<p>Nous avons bien reçu votre commande <strong>${escapeHtml(p.orderReference)}</strong> d'un montant de <strong>${escapeHtml(amount)}</strong>, ainsi que votre confirmation de virement.</p>
<p>Statut : <strong>en attente de vérification du paiement</strong>. Nous vous écrivons dès que le virement est reçu et la commande préparée.</p>
${button(p.orderUrl, 'Suivre ma commande')}`,
  );
  const text = `Merci ${p.firstName} !
Commande ${p.orderReference} — ${amount}
Statut : en attente de vérification du paiement.
Suivre la commande : ${p.orderUrl}`;
  return { subject, html, text };
}

export interface OrderStatusPayload {
  orderReference: string;
  firstName: string;
  statusLabel: string;
  orderUrl: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  trackingCarrier?: string | null;
}

export function orderStatusChanged(p: OrderStatusPayload): RenderedEmail {
  const subject = `Commande ${p.orderReference} : ${p.statusLabel.toLowerCase()}`;
  const tracking = p.trackingNumber
    ? `<p>Suivi ${escapeHtml(p.trackingCarrier ?? '')} : <strong>${escapeHtml(p.trackingNumber)}</strong>${p.trackingUrl ? ` — <a href="${escapeHtml(p.trackingUrl)}">suivre le colis</a>` : ''}</p>`
    : '';
  const html = layout(
    `Bonjour ${p.firstName},`,
    `<p>Votre commande <strong>${escapeHtml(p.orderReference)}</strong> est maintenant : <strong>${escapeHtml(p.statusLabel)}</strong>.</p>${tracking}${button(p.orderUrl, 'Voir ma commande')}`,
  );
  const text = `Commande ${p.orderReference} : ${p.statusLabel}${p.trackingNumber ? `\nSuivi : ${p.trackingNumber} ${p.trackingUrl ?? ''}` : ''}\n${p.orderUrl}`;
  return { subject, html, text };
}

export interface PasswordResetPayload {
  resetUrl: string;
  expiresInMinutes: number;
}

export function passwordReset(p: PasswordResetPayload): RenderedEmail {
  const subject = 'Réinitialisation de votre mot de passe GLACIORA';
  const html = layout(
    'Réinitialiser votre mot de passe',
    `<p>Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable ${p.expiresInMinutes} minutes et ne peut servir qu'une fois.</p>
${button(p.resetUrl, 'Choisir un nouveau mot de passe')}
<p style="font-size:12px">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.</p>`,
  );
  const text = `Réinitialiser votre mot de passe (valable ${p.expiresInMinutes} minutes) : ${p.resetUrl}`;
  return { subject, html, text };
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
