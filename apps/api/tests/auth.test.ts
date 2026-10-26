import request from 'supertest';
import { app, CSRF, createUser, resetDb } from './helpers';
import { prisma } from '../src/lib/prisma';
import { MAX_FAILED_LOGINS } from '../src/modules/auth/auth.service';

afterAll(() => prisma.$disconnect());
beforeEach(resetDb);

describe('authentification', () => {
  it('ne révèle pas si une adresse est déjà inscrite', async () => {
    const body = { email: 'lea@glaciora.test', password: 'Motdepasse-Solide-1', firstName: 'Léa', lastName: 'Martin' };
    const first = await request(app).post('/api/auth/register').set(CSRF).send(body);
    const second = await request(app).post('/api/auth/register').set(CSRF).send({ ...body, password: 'Autre-Motdepasse-2' });
    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(second.body).toEqual(first.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: body.email } });
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it('renvoie le même message pour un compte inconnu ou un mauvais mot de passe', async () => {
    const { email } = await createUser();
    const unknown = await request(app).post('/api/auth/login').set(CSRF).send({ email: 'inconnu@glaciora.test', password: 'x' });
    const wrong = await request(app).post('/api/auth/login').set(CSRF).send({ email, password: 'mauvais' });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('verrouille le compte après plusieurs échecs, même avec le bon mot de passe', async () => {
    const { email, password } = await createUser();
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) {
      await request(app).post('/api/auth/login').set(CSRF).send({ email, password: 'mauvais' });
    }
    const res = await request(app).post('/api/auth/login').set(CSRF).send({ email, password });
    expect(res.status).toBe(401);
  });

  it('pose des cookies httpOnly et fait tourner le refresh token (réutilisation détectée)', async () => {
    const { email, password } = await createUser();
    const login = await request(app).post('/api/auth/login').set(CSRF).send({ email, password });
    const cookies = login.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('glaciora_at=') && /HttpOnly/i.test(c))).toBe(true);
    const refreshCookie = cookies.find((c) => c.startsWith('glaciora_rt='))!.split(';')[0]!;

    const rotated = await request(app).post('/api/auth/refresh').set(CSRF).set('Cookie', refreshCookie);
    expect(rotated.status).toBe(200);
    const newRefresh = (rotated.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('glaciora_rt='))!.split(';')[0]!;
    expect(newRefresh).not.toBe(refreshCookie);

    // Rejouer l'ancien jeton révoque toute la famille, y compris le nouveau.
    expect((await request(app).post('/api/auth/refresh').set(CSRF).set('Cookie', refreshCookie)).status).toBe(401);
    expect((await request(app).post('/api/auth/refresh').set(CSRF).set('Cookie', newRefresh)).status).toBe(401);
  });

  it('réinitialise le mot de passe avec un jeton à usage unique', async () => {
    const { user, email } = await createUser();
    const forgot = await request(app).post('/api/auth/password/forgot').set(CSRF).send({ email });
    const unknown = await request(app).post('/api/auth/password/forgot').set(CSRF).send({ email: 'personne@glaciora.test' });
    expect(forgot.status).toBe(202);
    expect(unknown.body).toEqual(forgot.body);
    const mail = await prisma.emailMessage.findFirstOrThrow({ where: { template: 'password-reset' } });
    const token = decodeURIComponent(String((mail.payload as { resetUrl: string }).resetUrl).split('token=')[1]!);

    const reset = await request(app).post('/api/auth/password/reset').set(CSRF).send({ token, password: 'Nouveau-Motdepasse-9' });
    expect(reset.status).toBe(200);
    const again = await request(app).post('/api/auth/password/reset').set(CSRF).send({ token, password: 'Encore-Motdepasse-9' });
    expect(again.status).toBe(400);
    const login = await request(app).post('/api/auth/login').set(CSRF).send({ email, password: 'Nouveau-Motdepasse-9' });
    expect(login.status).toBe(200);
    expect(login.body.user.id).toBe(user.id);
  });
});
