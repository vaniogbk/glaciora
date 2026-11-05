import { prisma } from '../src/lib/prisma';
import { getStorage } from '../src/modules/storage/storage';
import { purgeExpiredProofs } from '../src/modules/storage/proof-retention';
import { syncEmailDeliveryStatus } from '../src/modules/email/email.delivery';
import { PDF_BYTES, resetDb, seedCatalogue } from './helpers';

afterAll(() => prisma.$disconnect());
beforeEach(resetDb);

async function orderWithProof(deleteAfter: Date) {
  const { variant } = await seedCatalogue(1);
  const order = await prisma.order.create({
    data: {
      reference: 'GLA-261105-PURG1',
      email: 'lea@glaciora.test',
      shipFirstName: 'Léa', shipLastName: 'Martin', shipLine1: '1 rue des Alpes', shipPostalCode: '74400', shipCity: 'Chamonix', shipCountryCode: 'FR', shipPhone: '+33 6 00 00 00 00',
      subtotalCents: 100, shippingCents: 0, totalCents: 100, shippingRateName: 'Test',
      items: { create: { variantId: variant.id, productName: 'Test', productReference: 'T', productSlug: 't', variantSku: variant.sku, unitPriceCents: 100, quantity: 1, lineTotalCents: 100 } },
    },
  });
  const storageKey = `proofs/test/${order.id}.pdf`;
  await getStorage().put(storageKey, PDF_BYTES, 'application/pdf');
  const proof = await prisma.transferProof.create({
    data: { orderId: order.id, storageDriver: getStorage().driver, storageKey, originalName: 'preuve.pdf', mimeType: 'application/pdf', sizeBytes: PDF_BYTES.length, sha256: 'x', deleteAfter },
  });
  return { order, proof, storageKey };
}

describe('tâches de maintenance', () => {
  it('purge les preuves de virement dont la durée de conservation est dépassée, et seulement celles-là', async () => {
    const expired = await orderWithProof(new Date(Date.now() - 1000));
    expect(await purgeExpiredProofs()).toEqual({ removed: 1, failed: 0 });
    expect((await prisma.transferProof.findUniqueOrThrow({ where: { id: expired.proof.id } })).deletedAt).not.toBeNull();
    await expect(getStorage().get(expired.storageKey)).rejects.toThrow();
    await prisma.transferProof.update({ where: { id: expired.proof.id }, data: { deletedAt: null, deleteAfter: new Date(Date.now() + 86_400_000) } });
    expect(await purgeExpiredProofs()).toEqual({ removed: 0, failed: 0 });
  });

  it('marque livré ou refusé un e-mail accepté par Brevo selon ses événements', async () => {
    const sentAt = new Date();
    const base = { subject: 's', template: 'order-received', payload: {}, status: 'SENT' as const, provider: 'brevo', sentAt };
    const ok = await prisma.emailMessage.create({ data: { ...base, toAddress: 'a@glaciora.test', providerMessageId: '<ok@brevo>' } });
    const ko = await prisma.emailMessage.create({ data: { ...base, toAddress: 'b@glaciora.test', providerMessageId: '<ko@brevo>' } });
    const fetchImpl = jest.fn(async (url: string) => {
      const events = url.includes(encodeURIComponent('<ok@brevo>'))
        ? [{ event: 'requests' }, { event: 'delivered' }]
        : [{ event: 'requests' }, { event: 'error', reason: 'sender not valid' }];
      return new Response(JSON.stringify({ events }), { status: 200 });
    });
    expect(await syncEmailDeliveryStatus({ fetchImpl: fetchImpl as unknown as typeof fetch, apiKey: 'cle-test', enabled: true })).toEqual({ delivered: 1, rejected: 1 });
    expect((await prisma.emailMessage.findUniqueOrThrow({ where: { id: ok.id } })).deliveredAt).not.toBeNull();
    const failed = await prisma.emailMessage.findUniqueOrThrow({ where: { id: ko.id } });
    expect(failed.status).toBe('FAILED');
    expect(failed.lastError).toContain('sender not valid');
    // Déjà vérifiés : pas de nouvel appel avant 10 minutes.
    await syncEmailDeliveryStatus({ fetchImpl: fetchImpl as unknown as typeof fetch, apiKey: 'cle-test', enabled: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
