import { TestBed } from '@angular/core/testing';
import { Cart } from './cart';
import { Product } from '../models/product.model';

const PRODUCT: Product = {
  id: 1, name: 'Test Phone', category: 'Smartphones', brand: 'Acme', price: 100, stock: 10,
  image: '', description: '', isFeatured: false, isNew: false, isBestSeller: false
};

describe('Cart', () => {
  let cart: Cart;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    cart = TestBed.inject(Cart);
  });

  it('adds products and totals them', () => {
    expect(cart.add(PRODUCT, 2)).toBeNull();
    expect(cart.count()).toBe(2);
    expect(cart.total()).toBeCloseTo(PRODUCT.price * 2);
  });

  it('refuses more than the available stock', () => {
    const p = { ...PRODUCT, stock: 2 };
    expect(cart.add(p, 3)).toContain('Only 2');
    expect(cart.count()).toBe(0);
  });

  it('refuses out-of-stock products', () => {
    expect(cart.add({ ...PRODUCT, stock: 0 })).toContain('out of stock');
  });
});
