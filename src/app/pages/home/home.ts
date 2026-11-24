import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Brand, Category, Product } from '../../models/product.model';
import { ProductService } from '../../services/product';
import { ProductCard } from '../../components/product-card/product-card';
import { onImageError } from '../../utils/image';
import { getErrorMessage } from '../../utils/http-error';

/** Icons for the category cards (any other category gets the default icon). */
const CATEGORY_ICONS: Record<string, string> = {
  Smartphones: 'fa-mobile-screen-button',
  Laptops: 'fa-laptop',
  Tablets: 'fa-tablet-screen-button',
  Accessories: 'fa-headphones',
  Headphones: 'fa-headphones'
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ProductCard],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  private router = inject(Router);
  private productService = inject(ProductService);

  featuredProducts = signal<Product[]>([]);
  newArrivals = signal<Product[]>([]);
  bestSellers = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);

  loading = signal(true);
  errorMessage = signal('');

  /** A real laptop from the store, shown in the promo banner (the banner is hidden if there is none) */
  promo = signal<Product | null>(null);

  /** First featured product is shown in the hero banner */
  hero = computed(() => this.featuredProducts()[0] ?? null);

  onImageError = onImageError;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      featured: this.productService.getFeatured(),
      newArrivals: this.productService.getNewArrivals(),
      bestSellers: this.productService.getBestSellers(),
      categories: this.productService.getCategories(),
      brands: this.productService.getBrands()
    }).subscribe({
      next: r => {
        this.featuredProducts.set(r.featured);
        this.newArrivals.set(r.newArrivals);
        this.bestSellers.set(r.bestSellers);
        this.categories.set(r.categories);
        this.brands.set(r.brands);
        this.loading.set(false);
        this.loadPromo();
      },
      error: err => {
        this.errorMessage.set(getErrorMessage(err, 'Could not load the store. Please try again.'));
        this.loading.set(false);
      }
    });
  }

  private loadPromo(): void {
    this.productService.getProducts({ category: 'Laptops', sort: 'price_desc' }).subscribe({
      next: list => this.promo.set(list.find(p => !!p.image) ?? null),
      error: () => this.promo.set(null)    // the banner is optional
    });
  }

  iconFor(category: string): string {
    return CATEGORY_ICONS[category] ?? 'fa-microchip';
  }

  navigateToCategory(category: string): void {
    this.router.navigate(['/products'], { queryParams: { category } });
  }

  navigateToBrand(brand: string): void {
    this.router.navigate(['/products'], { queryParams: { brand } });
  }
}
