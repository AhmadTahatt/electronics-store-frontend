import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URL } from '../config/api-url';
import {
  BestSellingBrand, DashboardStats, LookupItem, LookupKind, LowStockProduct,
  OrderApi, OrderDetailsApi, OrderStatus, ProductForm
} from '../models/admin.model';
import { BrandApi, CategoryApi, HomeProductApi, ProductApi, ProductDetailsApi } from '../models/api.model';

/** Every call here needs a logged-in ADMIN – the interceptor adds the token. */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private api = inject(API_URL);

  // ---------- Dashboard ----------
  getStatistics(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.api}/admin/dashboard/statistics`);
  }

  getLowStock(): Observable<LowStockProduct[]> {
    return this.http.get<LowStockProduct[]>(`${this.api}/admin/dashboard/low-stock-products`);
  }

  getBestSellingBrands(): Observable<BestSellingBrand[]> {
    return this.http.get<BestSellingBrand[]>(`${this.api}/admin/dashboard/best-selling-brands`);
  }

  // ---------- Products ----------
  getProducts(): Observable<ProductApi[]> {
    return this.http.get<ProductApi[]>(`${this.api}/products`);
  }

  getProductDetails(id: number): Observable<ProductDetailsApi> {
    return this.http.get<ProductDetailsApi>(`${this.api}/products/${id}`);
  }

  /** The details endpoint does not tell if a product is featured, so we read the featured list. */
  getFeaturedIds(): Observable<number[]> {
    return this.http.get<HomeProductApi[]>(`${this.api}/products/featured`)
      .pipe(map(list => list.map(p => p.productId)));
  }

  createProduct(form: ProductForm, image: File | null): Observable<unknown> {
    return this.http.post(`${this.api}/products`, this.toFormData(form, image, true));
  }

  updateProduct(id: number, form: ProductForm, image: File | null): Observable<unknown> {
    return this.http.put(`${this.api}/products/${id}`, this.toFormData(form, image, false));
  }

  /** delta > 0 adds stock, delta < 0 removes stock */
  adjustStock(id: number, delta: number): Observable<unknown> {
    return this.http.patch(`${this.api}/products/${id}/stock`, { delta });
  }

  deleteProduct(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/products/${id}`);
  }

  /** The create/update endpoints take multipart/form-data (so an image file can be sent). */
  private toFormData(f: ProductForm, image: File | null, includeStock: boolean): FormData {
    const fd = new FormData();
    fd.append('Name', f.name.trim());
    fd.append('Description', f.description.trim());
    fd.append('Price', String(f.price ?? 0));
    fd.append('WarrantyInformation', f.warranty.trim());
    if (includeStock) fd.append('Stock', String(f.stock ?? 0));
    fd.append('IsFeatured', String(f.isFeatured));
    fd.append('BrandId', String(f.brandId));
    fd.append('CategoryId', String(f.categoryId));
    f.specifications
      .filter(s => s.name.trim() && s.value.trim())
      .forEach((s, i) => {
        fd.append(`Specifications[${i}].Name`, s.name.trim());
        fd.append(`Specifications[${i}].Value`, s.value.trim());
      });
    if (image) fd.append('Image', image);
    return fd;
  }

  // ---------- Categories & brands (same shape, different URL) ----------
  getLookups(kind: LookupKind): Observable<LookupItem[]> {
    return this.http.get<(CategoryApi | BrandApi)[]>(`${this.api}/${this.path(kind)}`).pipe(
      map(list => list.map(x => ({
        id: kind === 'category' ? (x as CategoryApi).categoryId : (x as BrandApi).brandId,
        name: x.name
      })))
    );
  }

  createLookup(kind: LookupKind, name: string): Observable<unknown> {
    return this.http.post(`${this.api}/${this.path(kind)}`, { name });
  }

  updateLookup(kind: LookupKind, id: number, name: string): Observable<unknown> {
    return this.http.put(`${this.api}/${this.path(kind)}/${id}`, { name });
  }

  deleteLookup(kind: LookupKind, id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/${this.path(kind)}/${id}`);
  }

  private path(kind: LookupKind): string {
    return kind === 'category' ? 'categories' : 'brands';
  }

  // ---------- Orders ----------
  getOrders(): Observable<OrderApi[]> {
    return this.http.get<OrderApi[]>(`${this.api}/orders`);
  }

  getOrder(id: number): Observable<OrderDetailsApi> {
    return this.http.get<OrderDetailsApi>(`${this.api}/orders/${id}`);
  }

  updateOrderStatus(id: number, status: OrderStatus): Observable<unknown> {
    return this.http.patch(`${this.api}/orders/${id}/status`, { orderStatus: status.toUpperCase() });
  }
}
