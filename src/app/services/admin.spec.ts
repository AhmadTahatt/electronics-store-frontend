import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AdminService } from './admin';
import { emptyProductForm } from '../models/admin.model';

describe('AdminService', () => {
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the order status in upper case', () => {
    service.updateOrderStatus(5, 'Delivered').subscribe();
    const req = http.expectOne('/api/orders/5/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ orderStatus: 'DELIVERED' });
    req.flush(null);
  });

  it('adjusts stock with a delta', () => {
    service.adjustStock(2, -3).subscribe();
    const req = http.expectOne('/api/products/2/stock');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ delta: -3 });
    req.flush(null);
  });

  it('creates a product as multipart form data and skips empty specifications', () => {
    const form = {
      ...emptyProductForm(), name: ' Phone ', price: 99.5, stock: 4, brandId: 1, categoryId: 2, isFeatured: true,
      specifications: [{ name: 'Storage', value: '256GB' }, { name: '', value: '' }]
    };
    const image = new File(['x'], 'p.png', { type: 'image/png' });
    service.createProduct(form, image).subscribe();

    const req = http.expectOne('/api/products');
    const body = req.request.body as FormData;
    expect(req.request.method).toBe('POST');
    expect(body.get('Name')).toBe('Phone');
    expect(body.get('Price')).toBe('99.5');
    expect(body.get('Stock')).toBe('4');
    expect(body.get('IsFeatured')).toBe('true');
    expect(body.get('Specifications[0].Name')).toBe('Storage');
    expect(body.get('Specifications[1].Name')).toBeNull();
    expect(body.get('Image')).toBeInstanceOf(File);
    req.flush({ productId: 9 });
  });

  it('updates a product without sending stock', () => {
    service.updateProduct(3, { ...emptyProductForm(), name: 'A', price: 1, brandId: 1, categoryId: 1 }, null).subscribe();
    const req = http.expectOne('/api/products/3');
    expect(req.request.method).toBe('PUT');
    expect((req.request.body as FormData).has('Stock')).toBe(false);
    expect((req.request.body as FormData).has('Image')).toBe(false);
    req.flush(null);
  });

  it('maps categories and brands to {id, name}', () => {
    let cats: any[] = [];
    let brands: any[] = [];
    service.getLookups('category').subscribe(l => (cats = l));
    service.getLookups('brand').subscribe(l => (brands = l));
    http.expectOne('/api/categories').flush([{ categoryId: 1, name: 'Laptops' }]);
    http.expectOne('/api/brands').flush([{ brandId: 6, name: 'Sony' }]);
    expect(cats).toEqual([{ id: 1, name: 'Laptops' }]);
    expect(brands).toEqual([{ id: 6, name: 'Sony' }]);
  });
});
