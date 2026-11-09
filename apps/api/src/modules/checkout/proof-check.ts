import fs from 'node:fs';
import path from 'node:path';
import { fork } from 'node:child_process';
import sharp from 'sharp';
import { createWorker, OEM, PSM, type Worker as OcrWorker } from 'tesseract.js';
import { env } from '../../config/env';
import { AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { containsAmount, containsReference, isReadable } from './proof-match';

/**
 * Contrôle automatique du justificatif de virement, avant d'accepter la commande : le texte du document doit contenir
 * la référence de virement réservée et le montant exact de la commande (les deux, signés par le serveur à l'étape 2).
 *
 * Lecture sur le serveur, rien n'est envoyé à un service externe :
 * - PDF : texte du document (pdf-parse) ; PDF scanné sans texte : pages rendues en image puis lues par OCR ;
 * - photo ou capture d'écran : OCR Tesseract (anglais : chiffres, lettres latines et séparateurs suffisent).
 *
 * Ce contrôle écarte les fichiers sans rapport avec la commande. Il ne prouve pas que l'argent est arrivé : la commande ne
 * passe « En route » qu'une fois le virement crédité, vérifié par l'admin sur le compte bancaire.
 */

export type ProofReadMethod = 'pdf' | 'pdf-ocr' | 'ocr';

export interface ProofFileInput {
  buffer: Buffer;
  mime: string;
}

export interface ProofReading {
  text: string;
  method: ProofReadMethod;
}

export interface ProofCheckResult {
  referenceFound: boolean;
  amountFound: boolean;
  readable: boolean;
  methods: ProofReadMethod[];
  durationMs: number;
}

/** Résultat enregistré sur le paiement (visible dans l'admin). */
export interface StoredProofCheck {
  status: 'MATCHED' | 'DISABLED';
  methods?: ProofReadMethod[];
  checkedAt: string;
}

const PDF_MAX_PAGES = 3;
const OCR_MAX_SIDE = 2400;
const OCR_MIN_WIDTH = 1000;
/** Attente maximale du client pour un fichier (file d'attente comprise) : au-delà, contrôle indisponible, il peut réessayer. */
const READ_TIMEOUT_MS = 40_000;
/** Une lecture OCR qui tourne plus longtemps est bloquée : le lecteur est redémarré. */
const OCR_JOB_TIMEOUT_MS = 25_000;
/** PDF lus en même temps (un processus chacun) : au-delà, ils attendent leur tour. */
const PDF_MAX_CONCURRENT = 2;

/**
 * Le fichier lui-même est en cause (PDF corrompu ou piégé, image impossible à décoder) : traité comme un justificatif
 * illisible. Toute autre erreur est technique (lecteur en panne) : le client est invité à réessayer, sans être mis en cause.
 */
export class UnreadableProofError extends Error {}

/* ---------- OCR : un seul worker Tesseract, gardé chaud et utilisé à tour de rôle ---------- */

const ENG_DATA_DIR = path.join(path.dirname(require.resolve('@tesseract.js-data/eng/package.json')), '4.0.0_best_int');
let workerPromise: Promise<OcrWorker> | null = null;
let queue: Promise<unknown> = Promise.resolve();

function getWorker(): Promise<OcrWorker> {
  workerPromise ??= createWorker('eng', OEM.LSTM_ONLY, { langPath: ENG_DATA_DIR, cacheMethod: 'none', gzip: true }).catch((err: unknown) => {
    workerPromise = null;
    throw err;
  });
  return workerPromise;
}

/** Arrête le worker OCR (arrêt du serveur, fin des tests). */
export async function shutdownProofReader(): Promise<void> {
  const pending = workerPromise;
  workerPromise = null;
  if (pending) await (await pending.catch(() => null))?.terminate().catch(() => undefined);
}

/** Démarre le worker OCR en avance, pour que la première commande de la journée ne l'attende pas. */
export function warmUpProofReader(): void {
  if (!env.PROOF_AUTO_CHECK) return;
  getWorker().catch((err: unknown) => logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'OCR des justificatifs indisponible au démarrage'));
}

/** Image prête pour l'OCR : orientation EXIF, niveaux de gris, taille utile, thème sombre inversé (texte clair sur fond noir). */
async function prepareForOcr(image: Buffer): Promise<Buffer> {
  try {
    return await normaliseForOcr(image);
  } catch (err) {
    throw new UnreadableProofError(`Image impossible à décoder : ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function normaliseForOcr(image: Buffer): Promise<Buffer> {
  const meta = await sharp(image, { limitInputPixels: 60_000_000 }).metadata();
  // Orientation EXIF 5 à 8 : la photo est tournée d'un quart de tour, largeur et hauteur s'échangent.
  const quarterTurn = (meta.orientation ?? 1) >= 5;
  const width = (quarterTurn ? meta.height : meta.width) ?? 0;
  const height = (quarterTurn ? meta.width : meta.height) ?? 0;
  let pipeline = sharp(image, { limitInputPixels: 60_000_000 }).rotate().grayscale();
  if (Math.max(width, height) > OCR_MAX_SIDE) pipeline = pipeline.resize({ width: OCR_MAX_SIDE, height: OCR_MAX_SIDE, fit: 'inside' });
  else if (width > 0 && width < OCR_MIN_WIDTH) pipeline = pipeline.resize({ width: OCR_MIN_WIDTH });
  const prepared = await pipeline.normalise().png().toBuffer();
  const { channels } = await sharp(prepared).stats();
  const mean = channels[0]?.mean ?? 255;
  return mean < 110 ? sharp(prepared).negate({ alpha: false }).png().toBuffer() : prepared;
}

async function ocr(image: Buffer): Promise<string> {
  const prepared = await prepareForOcr(image);
  const job = queue.then(async () => {
    const worker = await getWorker();
    // Seule la lecture en cours compte (pas l'attente dans la file) : bloquée, le lecteur est redémarré pour les suivantes.
    const watchdog = setTimeout(() => void shutdownProofReader(), OCR_JOB_TIMEOUT_MS);
    try {
      await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
      const { data } = await worker.recognize(prepared);
      return data.text;
    } finally {
      clearTimeout(watchdog);
    }
  });
  queue = job.catch(() => undefined);
  return job;
}

/* ---------- PDF : lu dans un processus séparé (document non fiable : mémoire bornée, arrêt forcé, plantage isolé) ---------- */

/** Dossier du paquet API (identique depuis src/ avec tsx et Jest, et depuis dist/ en production). */
function apiRoot(): string {
  let dir = __dirname;
  while (!fs.existsSync(path.join(dir, 'package.json'))) {
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error('package.json de l’API introuvable');
    dir = parent;
  }
  return dir;
}
const PDF_WORKER_FILE = path.join(apiRoot(), 'workers', 'pdf-text.cjs');
const PDF_TIMEOUT_MS = 20_000;

let pdfRunning = 0;
const pdfWaiting: (() => void)[] = [];

async function extractPdf(buffer: Buffer): Promise<{ text: string; images: Buffer[] }> {
  if (pdfRunning >= PDF_MAX_CONCURRENT) await new Promise<void>((resume) => pdfWaiting.push(resume));
  pdfRunning++;
  try {
    return await extractPdfInChildProcess(buffer);
  } finally {
    pdfRunning--;
    pdfWaiting.shift()?.();
  }
}

/** Erreurs du processus de lecture : PDF refusé par la bibliothèque, plantage ou lecture interminable = fichier en cause. */
function extractPdfInChildProcess(buffer: Buffer): Promise<{ text: string; images: Buffer[] }> {
  return new Promise((resolve, reject) => {
    // execArgv explicite : le processus n'hérite pas des options de tsx / Jest, et sa mémoire est bornée.
    const child = fork(PDF_WORKER_FILE, [], { serialization: 'advanced', execArgv: ['--max-old-space-size=256'], stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (child.exitCode === null) child.kill('SIGKILL');
      fn();
    };
    const timer = setTimeout(() => finish(() => reject(new UnreadableProofError('Lecture du PDF trop longue'))), PDF_TIMEOUT_MS);
    child.once('message', (msg: { ok: boolean; text?: string; images?: Uint8Array[]; error?: string }) =>
      finish(() => (msg.ok ? resolve({ text: msg.text ?? '', images: (msg.images ?? []).map((i) => Buffer.from(i)) }) : reject(new UnreadableProofError(msg.error ?? 'PDF illisible')))),
    );
    // Échec du lancement du processus : erreur technique.
    child.once('error', (err) => finish(() => reject(err)));
    child.once('exit', (code, signal) => finish(() => reject(new UnreadableProofError(`Lecture du PDF interrompue (${signal ?? `code ${code}`})`))));
    child.send({ data: new Uint8Array(buffer), maxPages: PDF_MAX_PAGES, renderPages: 2, minChars: 20 });
  });
}

async function readPdf(buffer: Buffer): Promise<ProofReading> {
  const { text, images } = await extractPdf(buffer);
  if (isReadable(text) || images.length === 0) return { text, method: 'pdf' };
  // PDF sans texte (reçu scanné ou photographié puis converti) : lecture OCR des pages rendues en image.
  let scanned = '';
  for (const image of images) scanned += `\n${await ocr(image)}`;
  return { text: scanned, method: 'pdf-ocr' };
}

/* ---------- Lecture d'un fichier (remplaçable dans les tests) ---------- */

export type ProofTextReader = (file: ProofFileInput) => Promise<ProofReading>;

export const defaultProofTextReader: ProofTextReader = async (file) =>
  file.mime === 'application/pdf' ? readPdf(file.buffer) : { text: await ocr(file.buffer), method: 'ocr' };

let reader: ProofTextReader = defaultProofTextReader;

/** Pour les tests. */
export function setProofTextReader(next: ProofTextReader | undefined): void {
  reader = next ?? defaultProofTextReader;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('PROOF_READ_TIMEOUT')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Lit les fichiers déposés (1 à 3) et cherche la référence et le montant dans l'ensemble de leur texte : un reçu peut tenir
 * sur deux captures d'écran. S'arrête dès que les deux sont trouvés.
 */
export async function checkTransferProofs(files: ProofFileInput[], expected: { reference: string; amountCents: number }): Promise<ProofCheckResult> {
  const started = Date.now();
  let combined = '';
  const methods: ProofReadMethod[] = [];
  let referenceFound = false;
  let amountFound = false;
  for (const file of files) {
    let reading: ProofReading;
    try {
      reading = await withTimeout(reader(file), READ_TIMEOUT_MS);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // PDF corrompu ou image impossible à décoder : traité comme un fichier sans texte.
      if (err instanceof UnreadableProofError) {
        logger.warn({ mime: file.mime, err: message }, 'Justificatif illisible');
        continue;
      }
      // Lecteur en panne, ou file d'attente trop longue : le client n'y est pour rien, il peut réessayer.
      logger.error({ mime: file.mime, err: message }, 'Contrôle du justificatif impossible');
      throw new AppError(503, 'PROOF_CHECK_UNAVAILABLE', 'Vérification du justificatif momentanément impossible, réessayez dans un instant', { code: 'PROOF_CHECK_UNAVAILABLE' });
    }
    methods.push(reading.method);
    combined += `\n${reading.text}`;
    referenceFound ||= containsReference(reading.text, expected.reference);
    amountFound ||= containsAmount(reading.text, expected.amountCents);
    if (referenceFound && amountFound) break;
  }
  return { referenceFound, amountFound, readable: isReadable(combined), methods, durationMs: Date.now() - started };
}

/**
 * Refuse la commande si le justificatif ne porte pas la référence et le montant attendus. Retourne ce qui est enregistré
 * sur le paiement. Contrôle désactivable (PROOF_AUTO_CHECK=false) en cas de problème en production.
 */
export async function assertProofMatchesOrder(files: ProofFileInput[], expected: { reference: string; amountCents: number }): Promise<StoredProofCheck> {
  if (!env.PROOF_AUTO_CHECK) return { status: 'DISABLED', checkedAt: new Date().toISOString() };
  const result = await checkTransferProofs(files, expected);
  logger.info(
    { referenceFound: result.referenceFound, amountFound: result.amountFound, readable: result.readable, methods: result.methods, durationMs: result.durationMs },
    'Contrôle automatique du justificatif',
  );
  if (result.referenceFound && result.amountFound) return { status: 'MATCHED', methods: result.methods, checkedAt: new Date().toISOString() };

  const amount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(expected.amountCents / 100);
  const advice = 'Envoyez le reçu PDF de votre banque ou une capture d’écran nette où la référence et le montant sont visibles.';
  if (!result.readable && !result.referenceFound && !result.amountFound) {
    throw new AppError(422, 'PROOF_UNREADABLE', `Justificatif refusé : nous n’arrivons pas à lire son contenu. ${advice}`, { code: 'PROOF_UNREADABLE' });
  }
  const missing = !result.referenceFound && !result.amountFound
    ? `nous n’y trouvons ni la référence ${expected.reference}, ni le montant exact ${amount}`
    : !result.referenceFound
      ? `nous n’y trouvons pas la référence ${expected.reference}`
      : `nous n’y trouvons pas le montant exact de la commande (${amount})`;
  throw new AppError(422, 'PROOF_MISMATCH', `Justificatif refusé : ${missing}. ${advice}`, {
    code: 'PROOF_MISMATCH',
    referenceFound: result.referenceFound,
    amountFound: result.amountFound,
  });
}
