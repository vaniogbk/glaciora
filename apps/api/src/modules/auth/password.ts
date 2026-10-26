import argon2 from 'argon2';

const OPTIONS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/** Vérification factice quand le compte n'existe pas : même coût, pas d'énumération par le temps de réponse. */
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword('glaciora-dummy-password-0');
  await verifyPassword(await dummyHash, password);
}
