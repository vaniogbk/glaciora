import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import type { RenderedEmail } from './email.templates';

export interface SendResult {
  /** true seulement si le fournisseur a confirmé la prise en charge. */
  accepted: boolean;
  /** Mode développement : journalisé sans envoi. */
  logged?: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(to: string, email: RenderedEmail): Promise<SendResult>;
}

function maskRecipient(to: string): string {
  const [, domain] = to.split('@');
  return `***@${domain ?? '?'}`;
}

/** Développement : l'e-mail est journalisé (sujet + texte), jamais envoyé. */
export const consoleProvider: EmailProvider = {
  name: 'console',
  async send(to, email) {
    logger.info({ to: maskRecipient(to), subject: email.subject }, 'E-mail (mode console, non envoyé)');
    if (env.NODE_ENV === 'development') console.warn(`\n--- E-MAIL (non envoyé) ---\nÀ : ${to}\nSujet : ${email.subject}\n\n${email.text}\n---------------------------\n`);
    return { accepted: false, logged: true };
  },
};

/** Brevo (API transactionnelle v3). Confirmé uniquement sur réponse 2xx avec messageId. */
export function brevoProvider(apiKey: string, fromEmail: string, fromName: string, fetchImpl: typeof fetch = fetch): EmailProvider {
  return {
    name: 'brevo',
    async send(to, email) {
      try {
        const response = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({
            sender: { email: fromEmail, name: fromName },
            // Brevo remplace l'expéditeur d'une adresse gratuite (outlook.fr…) non authentifiable : les réponses restent chez GLACIORA.
            replyTo: { email: fromEmail, name: fromName },
            to: [{ email: to }],
            subject: email.subject,
            htmlContent: email.html,
            textContent: email.text,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) {
          const body = await response.text().catch(() => '');
          return { accepted: false, error: `Brevo HTTP ${response.status} ${body.slice(0, 200)}` };
        }
        const data = (await response.json().catch(() => ({}))) as { messageId?: string };
        if (!data.messageId) return { accepted: false, error: 'Réponse Brevo sans messageId' };
        return { accepted: true, providerMessageId: data.messageId };
      } catch (err) {
        return { accepted: false, error: (err as Error).message };
      }
    },
  };
}

let provider: EmailProvider | undefined;

export function getEmailProvider(): EmailProvider {
  if (!provider) {
    provider =
      env.EMAIL_PROVIDER === 'brevo' && env.BREVO_API_KEY && env.EMAIL_FROM
        ? brevoProvider(env.BREVO_API_KEY, env.EMAIL_FROM, env.EMAIL_FROM_NAME)
        : consoleProvider;
  }
  return provider;
}

export function setEmailProvider(p: EmailProvider | undefined): void {
  provider = p;
}
