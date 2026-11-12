import request from 'supertest';
import { app, CSRF, createUser, loginAgent, resetDb } from './helpers';
import { prisma } from '../src/lib/prisma';

afterAll(() => prisma.$disconnect());
beforeEach(resetDb);

describe('mentions légales', () => {
  it('renvoie une fiche vide (tous les champs à compléter) tant que rien n’est saisi', async () => {
    const res = await request(app).get('/api/legal');
    expect(res.status).toBe(200);
    expect(res.body.notice.companyName).toBeNull();
    expect(res.body.notice.hostAddress).toBeNull();
    expect(res.body.notice.updatedAt).toBeNull();
  });

  it('réserve la saisie aux admins', async () => {
    const { email, password } = await createUser('CLIENT');
    const client = await loginAgent(email, password);
    expect((await client.put('/api/admin/legal-notice').set(CSRF).send({ companyName: 'X' })).status).toBe(403);
    expect((await request(app).put('/api/admin/legal-notice').set(CSRF).send({ companyName: 'X' })).status).toBe(401);
  });

  it('enregistre la saisie du propriétaire, efface un champ vidé et journalise', async () => {
    const { email, password } = await createUser('ADMIN');
    const admin = await loginAgent(email, password);
    const first = await admin.put('/api/admin/legal-notice').set(CSRF).send({ companyName: 'Exemple SAS', legalForm: 'SAS', headOffice: '1 rue Exemple\n75000 Paris' });
    expect(first.status).toBe(200);
    expect(first.body.notice).toMatchObject({ companyName: 'Exemple SAS', legalForm: 'SAS', registration: null });

    const second = await admin.put('/api/admin/legal-notice').set(CSRF).send({ companyName: 'Exemple SAS', legalForm: '  ' });
    expect(second.body.notice.legalForm).toBeNull();
    expect(second.body.notice.headOffice).toBeNull();

    const pub = await request(app).get('/api/legal');
    expect(pub.body.notice.companyName).toBe('Exemple SAS');
    expect(await prisma.activityLog.count({ where: { action: 'legal_notice.updated' } })).toBe(2);
  });

  it('refuse un champ trop long', async () => {
    const { email, password } = await createUser('ADMIN');
    const admin = await loginAgent(email, password);
    const res = await admin.put('/api/admin/legal-notice').set(CSRF).send({ companyName: 'x'.repeat(301) });
    expect(res.status).toBe(400);
  });
});
