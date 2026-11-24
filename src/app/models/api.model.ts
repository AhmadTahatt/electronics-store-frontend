import { Brand, Category, Product } from './product.model';

// ---- Raw backend shapes (ASP.NET returns camelCase JSON) ----

export interface HomeProductApi {
  productId: number;
  name: string;
  price: number;
  productImgUrl?: string | null;
  brandName?: string | null;
  categoryName?: string | null;
}

export interface ProductApi extends HomeProductApi {
  description?: string | null;
  warrantyInformation?: string | null;
  status: 'Available' | 'OutOfStock';
  stock: number;
}

export interface ProductDetailsApi {
  productId: number;
  name: string;
  description?: string | null;
  price: number;
  productImgUrl?: string | null;
  warrantyInformation?: string | null;
  brandName: string;
  categoryName: string;
  status: 'Available' | 'OutOfStock';
  stock: number;
  specifications: { productSpecId: number; name: string; value: string }[];
}

export interface CategoryApi { categoryId: number; name: string; }
export interface BrandApi { brandId: number; name: string; }

// ---- Mappers: backend shape -> shape the components already use ----

export const toCategory = (c: CategoryApi): Category => ({ id: c.categoryId, name: c.name });
export const toBrand = (b: BrandApi): Brand => ({ id: b.brandId, name: b.name });

/** `flags` marks which home list the product came from (featured / new / best seller). */
export function toProduct(
  p: HomeProductApi | ProductApi,
  flags: Partial<Pick<Product, 'isFeatured' | 'isNew' | 'isBestSeller'>> = {}
): Product {
  const full = p as Partial<ProductApi>;
  return {
    id: p.productId,
    name: p.name,
    category: p.categoryName ?? '',
    brand: p.brandName ?? '',
    price: p.price,
    stock: full.stock,
    image: p.productImgUrl ?? '',
    description: full.description ?? '',
    warrantyInformation: full.warrantyInformation ?? undefined,
    isFeatured: flags.isFeatured ?? false,
    isNew: flags.isNew ?? false,
    isBestSeller: flags.isBestSeller ?? false
  };
}

export function toProductDetails(p: ProductDetailsApi): Product {
  return {
    id: p.productId,
    name: p.name,
    category: p.categoryName,
    brand: p.brandName,
    price: p.price,
    stock: p.stock,
    image: p.productImgUrl ?? '',
    description: p.description ?? '',
    warrantyInformation: p.warrantyInformation ?? undefined,
    specifications: p.specifications.map(s => ({ name: s.name, value: s.value })),
    isFeatured: false,
    isNew: false,
    isBestSeller: false
  };
}
