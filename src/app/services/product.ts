import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';
import { API_URL } from '../config/api-url';
import { Brand, Category, Product, ProductFilters } from '../models/product.model';
import {
  BrandApi, CategoryApi, HomeProductApi, ProductApi, ProductDetailsApi,
  toBrand, toCategory, toProduct, toProductDetails
} from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  // Categories/brands rarely change; cache them (also used to turn names into ids for filtering).
  private categories$?: Observable<Category[]>;
  private brands$?: Observable<Brand[]>;

  getFeatured(): Observable<Product[]> {
    return this.http.get<HomeProductApi[]>(`${this.api}/products/featured`)
      .pipe(map(list => list.map(p => toProduct(p, { isFeatured: true }))));
  }

  getNewArrivals(): Observable<Product[]> {
    return this.http.get<HomeProductApi[]>(`${this.api}/products/new-arrivals`)
      .pipe(map(list => list.map(p => toProduct(p, { isNew: true }))));
  }

  getBestSellers(): Observable<Product[]> {
    return this.http.get<HomeProductApi[]>(`${this.api}/products/best-selling`)
      .pipe(map(list => list.map(p => toProduct(p, { isBestSeller: true }))));
  }

  getCategories(): Observable<Category[]> {
    return this.categories$ ??= this.http.get<CategoryApi[]>(`${this.api}/categories`)
      .pipe(map(list => list.map(toCategory)), shareReplay({ bufferSize: 1, refCount: false }));
  }

  getBrands(): Observable<Brand[]> {
    return this.brands$ ??= this.http.get<BrandApi[]>(`${this.api}/brands`)
      .pipe(map(list => list.map(toBrand)), shareReplay({ bufferSize: 1, refCount: false }));
  }

  /**
   * For the Products page: filters use category/brand NAMES (as in the URL query params);
   * they are converted to the ids the backend expects.
   */
  getProducts(filters: ProductFilters = {}): Observable<Product[]> {
    return forkJoin({
      categories: filters.category ? this.getCategories() : of([] as Category[]),
      brands: filters.brand ? this.getBrands() : of([] as Brand[])
    }).pipe(
      switchMap(({ categories, brands }) => {
        let params = new HttpParams();
        const set = (key: string, value: unknown) => {
          if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
        };

        set('search', filters.search);
        set('minPrice', filters.minPrice);
        set('maxPrice', filters.maxPrice);
        if (filters.inStock) set('status', 'Available');

        if (filters.category) {
          const c = categories.find(x => x.name === filters.category);
          if (!c) return of([] as Product[]);          // unknown category -> nothing to show
          set('categoryId', c.id);
        }
        if (filters.brand) {
          const b = brands.find(x => x.name === filters.brand);
          if (!b) return of([] as Product[]);
          set('brandId', b.id);
        }

        switch (filters.sort) {
          case 'price_asc':  set('sortBy', 'PRICE'); set('sortOrder', 'ASC');  break;
          case 'price_desc': set('sortBy', 'PRICE'); set('sortOrder', 'DESC'); break;
          case 'name_asc':   set('sortBy', 'NAME');  set('sortOrder', 'ASC');  break;
          case 'name_desc':  set('sortBy', 'NAME');  set('sortOrder', 'DESC'); break;
        }

        return this.http.get<ProductApi[]>(`${this.api}/products`, { params })
          .pipe(map(list => list.map(p => toProduct(p))));
      })
    );
  }

  /** For the Product Details page: GET /api/products/{id} */
  getProduct(id: number): Observable<Product> {
    return this.http.get<ProductDetailsApi>(`${this.api}/products/${id}`).pipe(map(toProductDetails));
  }
}
