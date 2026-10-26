import { z } from 'zod';
import { MAX_QUANTITY_PER_LINE } from './cart';

const required = (max: number) => z.string().trim().min(1, 'Champ obligatoire').max(max, `${max} caractères maximum`);
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));

export const emailSchema = z.string().trim().toLowerCase().email('Adresse e-mail invalide').max(254);

export const passwordSchema = z
  .string()
  .min(10, '10 caractères minimum')
  .max(128, '128 caractères maximum')
  .regex(/[a-z]/i, 'Au moins une lettre')
  .regex(/\d/, 'Au moins un chiffre');

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ().-]{6,20}$/, 'Numéro de téléphone invalide');

export const addressSchema = z.object({
  firstName: required(60),
  lastName: required(60),
  company: optionalText(100),
  line1: required(120),
  line2: optionalText(120),
  postalCode: z.string().trim().regex(/^[A-Za-z0-9 -]{2,10}$/, 'Code postal invalide'),
  city: required(80),
  region: optionalText(80),
  countryCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, 'Pays invalide')
    .transform((v) => v.toUpperCase()),
  phone: phoneSchema,
});
export type AddressInput = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  email: emailSchema,
  shippingAddress: addressSchema,
  shippingRateId: z.string().min(1, 'Choisissez un mode de livraison').max(64),
  paymentMethod: z.literal('BANK_TRANSFER'),
  customerNote: optionalText(500),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter les conditions de vente' }) }),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartItemSchema = z.object({
  variantId: z.string().min(1).max(64),
  quantity: z.coerce.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: required(60),
  lastName: required(60),
});
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
export const resetRequestSchema = z.object({ email: emailSchema });
export const resetConfirmSchema = z.object({ token: z.string().min(20).max(200), password: passwordSchema });
export const profileSchema = z.object({ firstName: required(60), lastName: required(60), phone: phoneSchema.optional().or(z.literal('')) });

export const SORT_OPTIONS = ['featured', 'price_asc', 'price_desc', 'newest', 'name'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const productQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  sport: z.enum(['SKI', 'HOCKEY']).optional(),
  size: z.string().trim().max(40).optional(),
  brand: z.string().trim().max(60).optional(),
  condition: z.enum(['NEW', 'USED']).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(SORT_OPTIONS).default('featured'),
  page: z.coerce.number().int().min(1).max(500).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;
