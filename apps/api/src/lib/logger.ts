import pino from 'pino';
import { env } from '../config/env';

/**
 * Journal structuré. Les en-têtes sensibles et les champs personnels sont masqués :
 * on ne journalise ni cookies, ni jetons, ni mots de passe, ni e-mails, ni IBAN.
 */
export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.email',
      '*.iban',
      '*.phone',
    ],
    censor: '[masqué]',
  },
  base: { service: 'glaciora-api', env: env.APP_ENV },
});
