import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URL } from '../config/api-url';
import { Cart } from './cart';

export interface CheckoutForm {
  customerFullName: string;
  customerPhoneNumber: string;
  shippingAddress: string;
}

/** POST /api/orders – needs a logged-in CUSTOMER (the interceptor adds the token). */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private cart = inject(Cart);
  private api = inject(API_URL);

  /** Sends the cart items + shipping info. Emits the new order id and empties the cart. */
  placeOrder(form: CheckoutForm): Observable<number> {
    const items = this.cart.items().map(i => ({ productId: i.productId, quantity: i.quantity }));

    // only ids + quantities are sent: the server looks up the real prices
    return this.http.post<{ orderId: number }>(`${this.api}/orders`, { ...form, items }).pipe(
      map(res => {
        this.cart.clear();
        return res.orderId;
      })
    );
  }
}
