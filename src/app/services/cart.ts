import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models/product.model';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  image: string;
  stock: number;
  quantity: number;
}

const STORAGE_KEY = 'galaxy_cart';

/** Cart lives in the browser (localStorage). It is sent to the API only at checkout. */
@Injectable({ providedIn: 'root' })
export class Cart {
  readonly items = signal<CartItem[]>(this.load());
  readonly count = computed(() => this.items().reduce((sum, i) => sum + i.quantity, 0));
  readonly total = computed(() => this.items().reduce((sum, i) => sum + i.price * i.quantity, 0));

  /** Returns an error message, or null when the product was added. */
  add(product: Product, quantity = 1): string | null {
    const stock = product.stock ?? 0;
    if (stock <= 0) return 'This product is out of stock.';

    const current = this.items().find(i => i.productId === product.id);
    const newQty = (current?.quantity ?? 0) + quantity;
    if (newQty > stock) return `Only ${stock} left in stock.`;

    if (current) {
      this.set(this.items().map(i => i.productId === product.id ? { ...i, quantity: newQty, stock } : i));
    } else {
      this.set([...this.items(), {
        productId: product.id, name: product.name, price: product.price,
        image: product.image, stock, quantity
      }]);
    }
    return null;
  }

  updateQuantity(productId: number, quantity: number): void {
    this.set(this.items()
      .map(i => i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i)
      .filter(i => i.quantity > 0));
  }

  remove(productId: number): void {
    this.set(this.items().filter(i => i.productId !== productId));
  }

  clear(): void {
    this.set([]);
  }

  private set(items: CartItem[]): void {
    this.items.set(items);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }

  private load(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }
}
