import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route introuvable' } });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.requestId;

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Certaines données sont invalides',
        fields: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        requestId,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details, requestId } });
    return;
  }

  if (err instanceof MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    res.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR',
        message: tooLarge ? 'Fichier trop volumineux' : 'Envoi du fichier refusé',
        requestId,
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'Cette ressource existe déjà', requestId } });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Corps de requête JSON invalide', requestId } });
    return;
  }

  if (typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Requête trop volumineuse', requestId } });
    return;
  }

  // Erreur inattendue : détail dans les journaux seulement, message générique au client.
  const e = err as Error;
  logger.error({ err: { name: e?.name, message: e?.message, stack: e?.stack }, requestId }, 'Erreur non gérée');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue', requestId } });
};
