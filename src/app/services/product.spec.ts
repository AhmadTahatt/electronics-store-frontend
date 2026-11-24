import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ProductService } from './product';

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('best sellers call /products/best-selling and map the backend names', () => {
    let result: any[] = [];
    service.getBestSellers().subscribe(list => (result = list));

    http.expectOne('/api/products/best-selling').flush([
      { productId: 7, name: 'Phone', price: 99, productImgUrl: 'x.jpg', brandName: 'Apple', categoryName: 'Smartphones' }
    ]);

    expect(result[0]).toMatchObject({ id: 7, image: 'x.jpg', brand: 'Apple', category: 'Smartphones', isBestSeller: true });
    expect(result[0].stock).toBeUndefined();   // the home lists do not include stock
  });

  it('turns category/brand names into ids and maps sorting for the products list', () => {
    let result: any[] = [];
    service.getProducts({ category: 'Laptops', brand: 'Dell', sort: 'price_desc', inStock: true, minPrice: 100 })
      .subscribe(list => (result = list));

    http.expectOne('/api/categories').flush([{ categoryId: 2, name: 'Laptops' }]);
    http.expectOne('/api/brands').flush([{ brandId: 4, name: 'Dell' }]);

    const req = http.expectOne(r => r.url === '/api/products');
    expect(req.request.params.get('categoryId')).toBe('2');
    expect(req.request.params.get('brandId')).toBe('4');
    expect(req.request.params.get('sortBy')).toBe('PRICE');
    expect(req.request.params.get('sortOrder')).toBe('DESC');
    expect(req.request.params.get('status')).toBe('Available');
    expect(req.request.params.get('minPrice')).toBe('100');
    req.flush([{ productId: 1, name: 'XPS', price: 1199, stock: 8, status: 'Available' }]);

    expect(result[0].stock).toBe(8);
  });

  it('returns an empty list (no request) for an unknown category', () => {
    let result: any[] | null = null;
    service.getProducts({ category: 'Nope' }).subscribe(list => (result = list));

    http.expectOne('/api/categories').flush([{ categoryId: 2, name: 'Laptops' }]);
    http.expectNone(r => r.url === '/api/products');
    expect(result).toEqual([]);
  });

  it('maps product details including specifications', () => {
    let result: any;
    service.getProduct(3).subscribe(p => (result = p));

    http.expectOne('/api/products/3').flush({
      productId: 3, name: 'Tab', price: 5, productImgUrl: null, brandName: 'Samsung', categoryName: 'Tablets',
      status: 'Available', stock: 4, specifications: [{ productSpecId: 1, name: 'Storage', value: '128GB' }]
    });

    expect(result.specifications).toEqual([{ name: 'Storage', value: '128GB' }]);
    expect(result.image).toBe('');
  });
});
