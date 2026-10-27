import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { resetDb, createUser, loginAgent, CSRF } from './helpers';
import { prisma } from '../src/lib/prisma';
import { LocalStorage } from '../src/modules/storage/storage';
import { brevoProvider, setEmailProvider, type EmailProvider } from '../src/modules/email/email.providers';
import { nextAttemptDelayMs, processEmailQueue, queueEmail } from '../src/modules/email/email.service';
import { escapeHtml, adminTransferProof } from '../src/modules/email/email.templates';

afterAll(() => prisma.$disconnect());
beforeEach(resetDb);
afterEach(() => setEmailProvider(undefined));

const payload = { orderReference: 'GLA-261026-ABCDE', customerName: 'Léa <b>Martin</b>', amountCents: 45980, countryCode: 'FR', adminOrderUrl: 'https://glaciora.vercel.app/admin/commandes/1', proofCount: 1 };

describe('e-mails transactionnels', () => {
  it('échappe le HTML et ne contient aucune donnée bancaire', () => {
    const mail = adminTransferProof(payload);
    expect(mail.html).toContain('Léa &lt;b&gt;Martin&lt;/b&gt;');
    expect(mail.text).toContain('459,80');
    expect(mail.html).not.toMatch(/IBAN|FR76/);
    expect(escapeHtml('"<script>')).toBe('&quot;&lt;script&gt;');
  });

  it('ne marque SENT qu’après confirmation du fournisseur', async () => {
    const provider: EmailProvider = { name: 'fake', send: jest.fn().mockResolvedValue({ accepted: true, providerMessageId: 'msg-1' }) };
    setEmailProvider(provider);
    const message = await queueEmail({ to: 'glacioara@outlook.fr', template: 'admin-transfer-proof', payload });
    await processEmailQueue();
    expect(await prisma.emailMessage.findUniqueOrThrow({ where: { id: message.id } })).toMatchObject({ status: 'SENT', providerMessageId: 'msg-1', attempts: 1 });
  });

  it('replanifie après un échec puis abandonne après le nombre maximal de tentatives', async () => {
    setEmailProvider({ name: 'fake', send: jest.fn().mockResolvedValue({ accepted: false, error: 'HTTP 500' }) });
    const message = await queueEmail({ to: 'glacioara@outlook.fr', template: 'admin-transfer-proof', payload });
    await processEmailQueue();
    const afterFirst = await prisma.emailMessage.findUniqueOrThrow({ where: { id: message.id } });
    expect(afterFirst).toMatchObject({ status: 'QUEUED', attempts: 1, lastError: 'HTTP 500' });
    expect(afterFirst.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());

    await prisma.emailMessage.update({ where: { id: message.id }, data: { attempts: afterFirst.maxAttempts - 1, nextAttemptAt: new Date(0) } });
    await processEmailQueue();
    expect((await prisma.emailMessage.findUniqueOrThrow({ where: { id: message.id } })).status).toBe('FAILED');
    expect(nextAttemptDelayMs(1)).toBe(60_000);
    expect(nextAttemptDelayMs(99)).toBe(360 * 60_000);
  });

  it('mode console : e-mail journalisé, jamais considéré comme envoyé', async () => {
    const message = await queueEmail({ to: 'glacioara@outlook.fr', template: 'admin-transfer-proof', payload });
    await processEmailQueue();
    expect((await prisma.emailMessage.findUniqueOrThrow({ where: { id: message.id } })).status).toBe('LOGGED');
  });

  it('Brevo : succès uniquement sur réponse 2xx avec messageId', async () => {
    const okFetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ messageId: '<abc@brevo>' }), { status: 201 }));
    const ok = brevoProvider('cle-test', 'boutique@glaciora.test', 'GLACIORA', okFetch);
    const ko = brevoProvider('cle-test', 'boutique@glaciora.test', 'GLACIORA', jest.fn().mockResolvedValue(new Response('quota', { status: 429 })));
    const noId = brevoProvider('cle-test', 'boutique@glaciora.test', 'GLACIORA', jest.fn().mockResolvedValue(new Response('{}', { status: 201 })));
    const mail = adminTransferProof(payload);
    expect(await ok.send('glacioara@outlook.fr', mail)).toEqual({ accepted: true, providerMessageId: '<abc@brevo>' });
    expect(JSON.parse(okFetch.mock.calls[0][1].body).replyTo).toEqual({ email: 'boutique@glaciora.test', name: 'GLACIORA' });
    expect((await ko.send('glacioara@outlook.fr', mail)).accepted).toBe(false);
    expect((await noId.send('glacioara@outlook.fr', mail)).accepted).toBe(false);
  });
});

describe('stockage privé', () => {
  const storage = new LocalStorage(mkdtempSync(path.join(tmpdir(), 'glaciora-')));

  it('écrit et relit un fichier', async () => {
    await storage.put('proofs/2026/10/abc.pdf', Buffer.from('%PDF-1.7'));
    expect((await storage.get('proofs/2026/10/abc.pdf')).toString()).toBe('%PDF-1.7');
  });

  it('refuse toute clé qui sort du dossier', async () => {
    await expect(storage.get('../../etc/passwd')).rejects.toThrow();
    await expect(storage.put('proofs/../../x.pdf', Buffer.from('x'))).rejects.toThrow();
    await expect(storage.get('C:/Windows/win.ini')).rejects.toThrow();
  });
});

describe('validation produit (admin)', () => {
  it('rejette des données invalides et interdit de publier sans variante ni image', async () => {
    const { email, password } = await createUser('ADMIN');
    const admin = await loginAgent(email, password);
    const category = await prisma.category.create({ data: { slug: 'skis', name: 'Skis' } });

    const invalid = await admin.post('/api/admin/products').set(CSRF).send({ reference: 'x', name: '', sport: 'GOLF' });
    expect(invalid.status).toBe(400);

    const created = await admin.post('/api/admin/products').set(CSRF).send({ reference: 'NEW-001', name: 'Nouveau ski', brand: 'Zag', categoryId: category.id, sport: 'SKI', status: 'ACTIVE' });
    expect(created.status).toBe(201);
    expect(created.body.product.status).toBe('DRAFT');

    const publish = await admin.patch(`/api/admin/products/${created.body.product.id}`).set(CSRF).send({ status: 'ACTIVE' });
    expect(publish.status).toBe(422);

    const variant = await admin.post(`/api/admin/products/${created.body.product.id}/variants`).set(CSRF).send({ sizeLabel: '170 cm', sizeSystem: 'SKI_LENGTH', priceCents: 0 });
    expect(variant.status).toBe(400);
  });
});
