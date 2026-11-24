import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Cart } from '../../services/cart';
import { Compare } from '../../services/compare';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  authService = inject(Auth);
  cart = inject(Cart);
  compare = inject(Compare);
  private router = inject(Router);
  private productService = inject(ProductService);

  searchQuery = '';
  isMobileMenuOpen = signal(false);

  /** Shown until the API answers (and kept if it fails), so the menu is never empty. */
  categories = signal<string[]>(['Smartphones', 'Laptops', 'Tablets', 'Accessories']);

  constructor() {
    this.productService.getCategories().subscribe({
      next: list => { if (list.length) this.categories.set(list.map(c => c.name)); },
      error: () => { /* keep the default menu */ }
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  triggerSearch(): void {
    const term = this.searchQuery.trim();
    this.router.navigate(['/products'], { queryParams: term ? { search: term } : {} });
    this.closeMenu();
  }

  logout(): void {
    this.authService.logout();   // clears the session and redirects to /login
    this.closeMenu();
  }
}
