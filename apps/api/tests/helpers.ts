import request from 'supertest';
import type { Role } from '@prisma/client';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/modules/auth/password';

export const app = createApp();

/** En-tête anti-CSRF exigé sur toute requête qui modifie des données. */
export const CSRF = { 'x-glaciora-csrf': '1' };

export async function resetDb() {
  const tables = [
    'EmailMessage', 'TransferProof', 'Payment', 'OrderItem', '"Order"', 'CartItem', 'Cart', 'StockMovement', 'Stock',
    'ProductImage', 'ProductVariant', 'Product', 'Size', 'Category', 'Address', 'RefreshToken', 'PasswordResetToken',
    'ActivityLog', 'ImportRun', 'BankAccount', 'ShippingRate', 'ShippingCountry', 'ShippingZone', '"User"',
  ];
  await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => (t.startsWith('"') ? t : `"${t}"`)).join(', ')} CASCADE`);
}

export async function createUser(role: Role = 'CLIENT', overrides: { email?: string; password?: string; isActive?: boolean } = {}) {
  const email = overrides.email ?? `${role.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}@glaciora.test`;
  const password = overrides.password ?? 'Motdepasse-Test-1';
  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password), role, firstName: 'Test', lastName: role, isActive: overrides.isActive ?? true },
  });
  return { user, email, password };
}

/** Agent supertest connecté (cookies conservés). */
export async function loginAgent(email: string, password: string) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').set(CSRF).send({ email, password });
  if (res.status !== 200) throw new Error(`Connexion impossible : ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

export async function seedCatalogue(stock = 2, priceCents = 44990) {
  const category = await prisma.category.create({ data: { slug: 'skis', name: 'Skis', sport: 'SKI' } });
  const size = await prisma.size.create({ data: { system: 'SKI_LENGTH', label: '170 cm', sortOrder: 1700 } });
  const product = await prisma.product.create({
    data: {
      reference: 'TEST-001',
      slug: 'test-ski-de-test',
      name: '[TEST] Ski de test',
      brand: 'TestBrand',
      categoryId: category.id,
      sport: 'SKI',
      status: 'ACTIVE',
      priceFromCents: priceCents,
      images: { create: { url: '/media/products/test.webp', alt: 'Ski de test' } },
      variants: { create: { sku: 'TEST-001-170', sizeId: size.id, priceCents, stock: { create: { quantity: stock } } } },
    },
    include: { variants: true },
  });
  const zone = await prisma.shippingZone.create({
    data: {
      name: 'France',
      countries: { create: { code: 'FR', name: 'France', isEnabled: true } },
      rates: { create: { name: 'Standard [TEST]', priceCents: 990, freeAboveCents: 100000 } },
    },
    include: { rates: true },
  });
  return { category, product, variant: product.variants[0]!, rate: zone.rates[0]! };
}

export const PDF_BYTES = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(200, 0x20), Buffer.from('\n%%EOF')]);
