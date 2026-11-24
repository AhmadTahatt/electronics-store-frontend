import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../services/admin';
import { BestSellingBrand, DashboardStats, LowStockProduct } from '../../models/admin.model';
import { getErrorMessage } from '../../utils/http-error';
import { onImageError } from '../../utils/image';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    @if (loading()) {
      <div class="state-box"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading statistics...</div>
    } @else if (errorMessage()) {
      <div class="state-box state-error">
        <p><i class="fa-solid fa-circle-exclamation"></i> {{ errorMessage() }}</p>
        <button type="button" class="btn btn-primary btn-sm" (click)="load()">Try again</button>
      </div>
    } @else if (stats(); as s) {
      <div class="metrics-grid">
        <div class="metric-card"><div class="metric-label">Total Sales</div><div class="metric-value">{{ s.totalSales | currency:'USD':'symbol':'1.0-0' }}</div></div>
        <div class="metric-card"><div class="metric-label">Total Orders</div><div class="metric-value">{{ s.totalOrders }}</div></div>
        <div class="metric-card"><div class="metric-label">Pending Orders</div><div class="metric-value">{{ s.pendingOrders }}</div></div>
        <div class="metric-card"><div class="metric-label">Delivered Orders</div><div class="metric-value">{{ s.deliveredOrders }}</div></div>
        <div class="metric-card"><div class="metric-label">Total Products</div><div class="metric-value">{{ s.totalProducts }}</div></div>
        <div class="metric-card"><div class="metric-label">Out of Stock</div><div class="metric-value">{{ s.outOfStockProducts }}</div></div>
        <div class="metric-card"><div class="metric-label">Categories</div><div class="metric-value">{{ s.totalCategories }}</div></div>
        <div class="metric-card"><div class="metric-label">Cancelled Orders</div><div class="metric-value">{{ s.cancelledOrders }}</div></div>
      </div>

      <div class="admin-two-col">
        <div>
          <h3 class="admin-subtitle">Low Stock Products</h3>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead><tr><th>Product</th><th>Stock</th><th>Price</th><th>Status</th></tr></thead>
              <tbody>
                @for (p of lowStock(); track p.productId) {
                  <tr>
                    <td>
                      <div class="cell-product">
                        <img class="admin-thumb" [src]="p.productImgUrl" (error)="onImageError($event)" [alt]="p.name">
                        <span>{{ p.name }}</span>
                      </div>
                    </td>
                    <td><strong>{{ p.stock }}</strong></td>
                    <td>{{ p.price | currency:'USD' }}</td>
                    <td><span class="status-pill" [class.pill-bad]="p.status === 'OutOfStock'" [class.pill-good]="p.status === 'Available'">{{ p.status === 'OutOfStock' ? 'Out of stock' : 'Available' }}</span></td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="empty-cell">All products have enough stock.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 class="admin-subtitle">Best Selling Brands</h3>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead><tr><th>Brand</th><th>Units sold</th></tr></thead>
              <tbody>
                @for (b of bestBrands(); track b.brandId) {
                  <tr><td>{{ b.brandName }}</td><td><strong>{{ b.totalSold }}</strong></td></tr>
                } @empty {
                  <tr><td colspan="2" class="empty-cell">No delivered orders yet.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminOverview implements OnInit {
  private admin = inject(AdminService);

  stats = signal<DashboardStats | null>(null);
  lowStock = signal<LowStockProduct[]>([]);
  bestBrands = signal<BestSellingBrand[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  onImageError = onImageError;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    forkJoin({
      stats: this.admin.getStatistics(),
      low: this.admin.getLowStock(),
      brands: this.admin.getBestSellingBrands()
    }).subscribe({
      next: r => {
        this.stats.set(r.stats);
        this.lowStock.set(r.low);
        this.bestBrands.set(r.brands);
        this.loading.set(false);
      },
      error: err => {
        this.errorMessage.set(getErrorMessage(err, 'Could not load the dashboard.'));
        this.loading.set(false);
      }
    });
  }
}
