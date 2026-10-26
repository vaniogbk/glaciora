import 'dotenv/config';
import { z } from 'zod';

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v.trim() : undefined));

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    DATABASE_URL: z.string().min(1),
    /** Origines autorisées (séparées par des virgules) pour les requêtes qui modifient des données. */
    WEB_ORIGIN: z.string().default('http://localhost:3000'),
    PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
    /** Valeur passée à Express « trust proxy » (nombre de proxys ou liste). */
    TRUST_PROXY: z.string().default('loopback'),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET : 32 caractères minimum'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET : 32 caractères minimum'),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).default(30),
    COOKIE_SECURE: bool.default('false'),

    BANK_ACCOUNT_HOLDER: optional,
    BANK_IBAN: optional,
    BANK_BIC: optional,
    BANK_NAME: optional,

    ORDER_NOTIFICATION_EMAIL: z.string().email().default('glacioara@outlook.fr'),
    EMAIL_PROVIDER: z.enum(['console', 'brevo']).default('console'),
    BREVO_API_KEY: optional,
    EMAIL_FROM: optional,
    EMAIL_FROM_NAME: z.string().default('GLACIORA'),
    EMAIL_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(6),
    EMAIL_WORKER_INTERVAL_MS: z.coerce.number().int().min(0).default(30000),

    STORAGE_DRIVER: z.enum(['local', 'r2']).default('local'),
    STORAGE_LOCAL_DIR: z.string().default('./storage/private'),
    R2_ACCOUNT_ID: optional,
    R2_ACCESS_KEY_ID: optional,
    R2_SECRET_ACCESS_KEY: optional,
    R2_BUCKET: optional,
    UPLOAD_MAX_BYTES: z.coerce.number().int().min(1024).default(10 * 1024 * 1024),
    PROOF_RETENTION_DAYS: z.coerce.number().int().min(1).default(400),

    CATALOGUE_DIR: z.string().default('../../GLACIORA_CATALOGUE'),
    PRODUCT_MEDIA_DIR: z.string().default('../web/public/media'),
    PRODUCT_MEDIA_BASE_URL: z.string().default('/media'),
  })
  .superRefine((env, ctx) => {
    const deployed = env.APP_ENV === 'production' || env.APP_ENV === 'staging';
    if (deployed && !env.COOKIE_SECURE) {
      ctx.addIssue({ code: 'custom', path: ['COOKIE_SECURE'], message: 'COOKIE_SECURE doit valoir true hors développement' });
    }
    if (env.EMAIL_PROVIDER === 'brevo' && (!env.BREVO_API_KEY || !env.EMAIL_FROM)) {
      ctx.addIssue({ code: 'custom', path: ['BREVO_API_KEY'], message: 'BREVO_API_KEY et EMAIL_FROM sont requis avec EMAIL_PROVIDER=brevo' });
    }
    if (env.STORAGE_DRIVER === 'r2' && (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET)) {
      ctx.addIssue({ code: 'custom', path: ['R2_BUCKET'], message: 'Variables R2_* incomplètes avec STORAGE_DRIVER=r2' });
    }
    // IBAN d'exemple des documentations bancaires : autorisés en local, interdits une fois déployé.
    const exampleIbans = ['FR7630006000011234567890189', 'DE89370400440532013000', 'GB82WEST12345698765432'];
    if (deployed && env.BANK_IBAN && exampleIbans.includes(env.BANK_IBAN.replace(/\s+/g, '').toUpperCase())) {
      ctx.addIssue({ code: 'custom', path: ['BANK_IBAN'], message: "BANK_IBAN contient un IBAN d'exemple : renseignez le vrai IBAN du compte" });
    }
    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      ctx.addIssue({ code: 'custom', path: ['JWT_REFRESH_SECRET'], message: 'Les deux secrets JWT doivent être différents' });
    }
  });

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Configuration invalide :\n${details}`);
  }
  return parsed.data;
}

export const env = load();

export const allowedOrigins = env.WEB_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

export const bankDetailsConfigured = Boolean(env.BANK_IBAN && env.BANK_ACCOUNT_HOLDER);
