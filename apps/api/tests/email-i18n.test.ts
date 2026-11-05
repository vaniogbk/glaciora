import { SITE_LOCALES, TRACKING_STEPS } from '@glaciora/shared';
import { emailTexts } from '../src/modules/email/email.i18n';
import { renderTemplate } from '../src/modules/email/email.templates';
import { orderTrackingUrl } from '../src/modules/checkout/order-tracking';

describe('e-mails clients dans la langue de la commande', () => {
  it('garde au mot près les messages de suivi français fournis par la boutique', () => {
    expect(emailTexts('fr').steps).toEqual(TRACKING_STEPS.map((s) => s.message));
  });

  it('a un texte pour chaque langue du site, sans variable oubliée', () => {
    for (const locale of SITE_LOCALES) {
      const t = emailTexts(locale);
      expect(t.steps).toHaveLength(3);
      expect(t.receivedBody).toContain('{ref}');
      expect(t.receivedBody).toContain('{amount}');
      expect(t.resetBody).toContain('{minutes}');
    }
  });

  it('envoie le suivi « En route » en allemand avec le lien de la version allemande', () => {
    const orderUrl = orderTrackingUrl({ id: 'o1', reference: 'GLA-261105-ABCDE', locale: 'de' });
    expect(orderUrl).toContain('/de/commande/suivi?ref=GLA-261105-ABCDE');
    const mail = renderTemplate('order-status', { orderReference: 'GLA-261105-ABCDE', firstName: 'Anna', status: 'SHIPPED', locale: 'de', orderUrl });
    expect(mail.subject).toBe('Bestellung GLA-261105-ABCDE: unterwegs');
    expect(mail.text).toContain('Ihre Bestellung ist bereits auf dem Weg zu Ihrer Adresse.');
    expect(mail.html).toContain('<html lang="de">');
    expect(mail.html).toContain('Bestellung verfolgen');
  });

  it('formate le montant selon la langue et reste en français pour une ancienne commande sans langue', () => {
    const de = renderTemplate('order-received', { orderReference: 'GLA-1', firstName: 'Anna', totalCents: 45490, orderUrl: 'https://x/de', locale: 'de' });
    expect(de.text).toMatch(/454,90\s€/);
    expect(de.subject).toBe('Bestellung GLA-1: in Vorbereitung');
    const old = renderTemplate('order-status', { orderReference: 'GLA-2', firstName: 'Paul', statusLabel: 'Livrée', message: 'Votre commande est arrivée à votre adresse. Merci pour l’achat.', orderUrl: 'https://x' });
    expect(old.subject).toBe('Commande GLA-2 : livrée');
    expect(old.text).toContain('Merci pour l’achat.');
  });
});
