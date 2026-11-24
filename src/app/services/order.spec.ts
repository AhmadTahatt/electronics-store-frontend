import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Cart } from './cart';
import { OrderService } from './order';

describe('OrderService', () => {
  it('sends only product ids + quantities and empties the cart afterwards', () => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });

    const cart = TestBed.inject(Cart);
    const orders = TestBed.inject(OrderService);
    const http = TestBed.inject(HttpTestingController);

    cart.add({ id: 4, name: 'Mouse', category: 'Accessories', brand: 'Logitech', price: 99, stock: 5,
               image: '', description: '', isFeatured: false, isNew: false, isBestSeller: false }, 2);

    let orderId = 0;
    orders.placeOrder({ customerFullName: 'Ahmad Tahat', customerPhoneNumber: '0791234567', shippingAddress: 'Amman' })
      .subscribe(id => (orderId = id));

    const req = http.expectOne('/api/orders');
    expect(req.request.body).toEqual({
      customerFullName: 'Ahmad Tahat', customerPhoneNumber: '0791234567', shippingAddress: 'Amman',
      items: [{ productId: 4, quantity: 2 }]          // no prices – the server decides them
    });
    req.flush({ orderId: 42 });

    expect(orderId).toBe(42);
    expect(cart.count()).toBe(0);
    http.verify();
  });
});
