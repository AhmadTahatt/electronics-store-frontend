export interface Product {
  id: number;
  name: string;
  category: string;
  brand: string;
  price: number;
  /** Unknown (undefined) for the home-page lists – the backend does not send stock there. */
  stock?: number;
  image: string;
  description: string;
  rating?: number;
  warrantyMonths?: number;
  warrantyInformation?: string;
  specifications?: { name: string; value: string }[];
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
}

export interface Category {
  id: number;
  name: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
}
