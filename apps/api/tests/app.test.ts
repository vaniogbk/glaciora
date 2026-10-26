import request from 'supertest';
import { app, CSRF, createUser, loginAgent, resetDb } from './helpers';
import { prisma } from '../src/lib/prisma';

afterAll(() => prisma.$disconnect());
beforeEach(resetDb);

describe('socle API', () => {
  it('répond au contrôle de santé avec la base', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'ok' });
  });

  it('renvoie une erreur 404 normalisée', async () => {
    const res = await request(app).get('/api/inexistant');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('ajoute les en-têtes de sécurité et masque Express', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-request-id']).toBeDefined();
  });
});

describe('protection CSRF', () => {
  it('refuse une écriture sans en-tête anti-CSRF', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.fr', password: 'x' });
    expect(res.status).toBe(403);
  });

  it('refuse une origine étrangère même avec l’en-tête', async () => {
    const res = await request(app).post('/api/auth/login').set(CSRF).set('Origin', 'https://attaquant.example').send({ email: 'a@b.fr', password: 'x' });
    expect(res.status).toBe(403);
  });
});

describe('validation et gestion des erreurs', () => {
  it('détaille les champs invalides sans planter', async () => {
    const res = await request(app).post('/api/auth/register').set(CSRF).send({ email: 'pas-un-email', password: 'court' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.map((f: { path: string }) => f.path)).toEqual(expect.arrayContaining(['email', 'password']));
  });

  it('rejette un JSON mal formé avec une erreur 400', async () => {
    const res = await request(app).post('/api/auth/login').set(CSRF).set('Content-Type', 'application/json').send('{"email":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('refuse les filtres catalogue hors bornes', async () => {
    const res = await request(app).get('/api/catalogue/products?pageSize=1000');
    expect(res.status).toBe(400);
  });
});

describe('permissions admin', () => {
  it('exige une session', async () => {
    expect((await request(app).get('/api/admin/dashboard')).status).toBe(401);
  });

  it('refuse un client', async () => {
    const { email, password } = await createUser('CLIENT');
    const agent = await loginAgent(email, password);
    expect((await agent.get('/api/admin/dashboard')).status).toBe(403);
  });

  it('autorise un admin actif', async () => {
    const { email, password } = await createUser('ADMIN');
    const agent = await loginAgent(email, password);
    const res = await agent.get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pendingVerification', 0);
  });

  it('coupe immédiatement un admin rétrogradé malgré un jeton encore valide', async () => {
    const { user, email, password } = await createUser('ADMIN');
    const agent = await loginAgent(email, password);
    await prisma.user.update({ where: { id: user.id }, data: { role: 'CLIENT' } });
    expect((await agent.get('/api/admin/orders')).status).toBe(403);
  });

  it('refuse un jeton falsifié', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', 'Bearer eyJhbGciOiJub25lIn0.eyJyb2xlIjoiQURNSU4ifQ.');
    expect(res.status).toBe(401);
  });
});
