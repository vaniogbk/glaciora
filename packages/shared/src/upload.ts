export const PROOF_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;
export type ProofMimeType = (typeof PROOF_MIME_TYPES)[number];

export const PROOF_EXTENSIONS: Record<ProofMimeType, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Détecte le type réel d'un fichier à partir de ses premiers octets (signature). */
export function detectMimeFromBytes(bytes: Uint8Array): ProofMimeType | null {
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf';
  if (startsWith([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';
  return null;
}

/** Nettoie un nom de fichier fourni par l'utilisateur (affichage uniquement, jamais utilisé comme chemin). */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const cleaned = base
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._]+/, '')
    .slice(0, 100);
  return cleaned || 'fichier';
}

export type ProofValidationError = 'EMPTY' | 'TOO_LARGE' | 'UNSUPPORTED_TYPE' | 'TYPE_MISMATCH' | 'BAD_NAME';

export const PROOF_ERROR_MESSAGES: Record<ProofValidationError, string> = {
  EMPTY: 'Le fichier est vide.',
  TOO_LARGE: 'Le fichier dépasse la taille maximale autorisée.',
  UNSUPPORTED_TYPE: 'Format non accepté : PDF, JPG, PNG ou WEBP uniquement.',
  TYPE_MISMATCH: "Le contenu du fichier ne correspond pas à son type.",
  BAD_NAME: 'Nom de fichier invalide.',
};

export interface ProofValidationInput {
  bytes: Uint8Array;
  sizeBytes: number;
  originalName: string;
  declaredMime: string;
  maxBytes: number;
}

export function validateProofFile(input: ProofValidationInput):
  | { ok: true; mime: ProofMimeType; extension: string; safeName: string }
  | { ok: false; error: ProofValidationError } {
  if (input.sizeBytes <= 0) return { ok: false, error: 'EMPTY' };
  if (input.sizeBytes > input.maxBytes) return { ok: false, error: 'TOO_LARGE' };
  if (!input.originalName || input.originalName.length > 255 || input.originalName.includes('\0')) {
    return { ok: false, error: 'BAD_NAME' };
  }
  const detected = detectMimeFromBytes(input.bytes);
  if (!detected) return { ok: false, error: 'UNSUPPORTED_TYPE' };
  const declared = input.declaredMime === 'image/jpg' ? 'image/jpeg' : input.declaredMime;
  if (declared !== detected) return { ok: false, error: 'TYPE_MISMATCH' };
  const extension = PROOF_EXTENSIONS[detected];
  let safeName = sanitizeFileName(input.originalName);
  const hasRightExtension =
    safeName.toLowerCase().endsWith(`.${extension}`) || (extension === 'jpg' && /\.jpe?g$/i.test(safeName));
  if (!hasRightExtension) safeName = `${safeName.replace(/\.[^.]*$/, '')}.${extension}`;
  return { ok: true, mime: detected, extension, safeName };
}
