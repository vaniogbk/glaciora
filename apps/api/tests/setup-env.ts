// Variables de test : valeurs factices, base glaciora_test uniquement.
process.env.NODE_ENV = 'test';
process.env.APP_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://glaciora:glaciora_dev@localhost:5466/glaciora_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-0123456789-abcdefghijkl';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0123456789-abcdefghijk';
process.env.WEB_ORIGIN = 'http://localhost:3000';
process.env.PUBLIC_SITE_URL = 'http://localhost:3000';
process.env.BANK_ACCOUNT_HOLDER = 'GLACIORA TEST';
process.env.BANK_IBAN = 'FR7630006000011234567890189';
process.env.BANK_BIC = 'AGRIFRPP';
process.env.EMAIL_PROVIDER = 'console';
process.env.STORAGE_DRIVER = 'local';
process.env.STORAGE_LOCAL_DIR = './storage/test-private';
process.env.LOG_LEVEL = 'silent';
