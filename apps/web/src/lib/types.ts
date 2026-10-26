export type Sport = 'SKI' | 'HOCKEY';

export interface ProductCard {
  id: string;
  reference: string;
  slug: string;
  name: string;
  brand: string;
  sport: Sport;
  condition: 'NEW' | 'USED';
  category: { slug: string; name: string };
  currency: string;
  priceFromCents: number | null;
  hasPriceRange: boolean;
  compareAtPriceCents: number | null;
  isNew: boolean;
  isFeatured: boolean;
  inStock: boolean;
  sizes: string[];
  image: { url: string; alt: string; width: number | null; height: number | null } | null;
  imagesAreIllustrations: boolean;
}

export interface ProductList {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: { brands: string[]; sizes: string[]; conditions: string[]; price: { min: number; max: number } | null };
}

export interface ProductVariant {
  id: string;
  sku: string;
  color: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  size: { label: string; system: string } | null;
  available: number;
  inStock: boolean;
}

export interface ProductDetail {
  id: string;
  reference: string;
  slug: string;
  name: string;
  brand: string;
  model: string | null;
  shortDescription: string | null;
  description: string | null;
  sport: Sport;
  condition: 'NEW' | 'USED';
  currency: string;
  category: { slug: string; name: string; parent: { slug: string; name: string } | null };
  specs: Record<string, string> | null;
  colors: string[];
  weightGrams: number | null;
  dimensions: string | null;
  isNew: boolean;
  imagesAreIllustrations: boolean;
  images: { url: string; alt: string; width: number | null; height: number | null }[];
  variants: ProductVariant[];
  priceFromCents: number | null;
  compareAtPriceCents: number | null;
  inStock: boolean;
  updatedAt: string;
  related: ProductCard[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sport: Sport | null;
  parentId: string | null;
  position: number;
  productCount: number;
}

export interface CartLine {
  variantId: string;
  sku: string;
  productName: string;
  brand: string;
  slug: string;
  sizeLabel: string | null;
  color: string | null;
  image: { url: string; alt: string } | null;
  unitPriceCents: number;
  quantity: number;
  available: number;
  lineTotalCents: number;
  issue: { code: string; message: string } | null;
}

export interface Cart {
  items: CartLine[];
  subtotalCents: number;
  itemCount: number;
  currency: string;
  hasIssues: boolean;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'CLIENT' | 'ADMIN';
}
