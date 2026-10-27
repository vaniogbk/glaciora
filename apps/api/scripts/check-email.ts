import { env } from '../src/config/env';
import { getEmailProvider } from '../src/modules/email/email.providers';

/**
 * npx tsx scripts/check-email.ts
 * Envoie un e-mail de test à ORDER_NOTIFICATION_EMAIL (adresse de la boutique) via le fournisseur configuré.
 */
async function main() {
  const provider = getEmailProvider();
  const sentAt = new Date().toISOString();
  const result = await provider.send(env.ORDER_NOTIFICATION_EMAIL, {
    subject: 'GLACIORA — test d’envoi des e-mails',
    text: `E-mail de test envoyé par l'API GLACIORA (${sentAt}). Aucune action requise.`,
    html: `<p>E-mail de test envoyé par l'API GLACIORA (${sentAt}).</p><p>Aucune action requise.</p>`,
  });
  console.warn(`Fournisseur « ${provider.name} » → ${env.ORDER_NOTIFICATION_EMAIL}`);
  if (!result.accepted) throw new Error(result.error ?? (result.logged ? 'mode console : e-mail journalisé, non envoyé' : 'refusé'));
  console.warn(`Accepté par le fournisseur (messageId ${result.providerMessageId}).`);
}

main().catch((err) => {
  console.error(`Échec du test d'envoi : ${(err as Error).message}`);
  process.exitCode = 1;
});
