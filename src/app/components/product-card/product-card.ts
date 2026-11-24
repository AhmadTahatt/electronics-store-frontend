import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { Cart } from '../../services/cart';
import { ProductService } from '../../services/product';
import { ToastService } from '../../services/toast';
import { onImageError } from '../../utils/image';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-card.html',
  styles: [':host { display: flex; } .samsung-card { width: 100%; }']
})
export class ProductCard {
  product = input.required<Product>();

  private cart = inject(Cart);
  private toast = inject(ToastService);
  private productService = inject(ProductService);
  onImageError = onImageError;

  /** Home-page lists don't include stock, so unknown stock counts as available. */
  outOfStock(): boolean {
    const stock = this.product().stock;
    return stock !== undefined && stock <= 0;
  }

  addToCart(): void {
    const p = this.product();
    if (p.stock === undefined) {
      // load the real stock first so the cart never exceeds it
      this.productService.getProduct(p.id).subscribe({
        next: full => this.addToCartChecked({ ...p, stock: full.stock }),
        error: () => this.toast.show('Could not check stock. Please try again.', 'error')
      });
      return;
    }
    this.addToCartChecked(p);
  }

  private addToCartChecked(p: Product): void {
    const error = this.cart.add(p);
    if (error) {
      this.toast.show(error, 'error');
    } else {
      this.toast.show(`${p.name} added to cart`, 'success');
    }
  }
}
