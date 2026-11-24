import { Component, inject, signal } from '@angular/core';
import { Auth } from '../../services/auth';
import { AdminOverview } from './admin-overview';
import { AdminProducts } from './admin-products';
import { AdminLookup } from './admin-lookup';
import { AdminOrders } from './admin-orders';

type Tab = 'overview' | 'products' | 'categories' | 'brands' | 'orders';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [AdminOverview, AdminProducts, AdminLookup, AdminOrders],
  template: `
    <section class="section section-first">
      <div class="container">
        <div class="section-header">
          <div>
            <h1 class="section-title">Admin Dashboard</h1>
            <p class="section-subtitle">Signed in as {{ auth.username() }}</p>
          </div>
        </div>

        <div class="admin-nav-tabs" role="tablist">
          @for (t of tabs; track t.id) {
            <button type="button" role="tab" class="admin-tab-btn"
                    [class.active]="tab() === t.id" [attr.aria-selected]="tab() === t.id"
                    (click)="tab.set(t.id)">{{ t.label }}</button>
          }
        </div>

        @switch (tab()) {
          @case ('overview')   { <app-admin-overview /> }
          @case ('products')   { <app-admin-products /> }
          @case ('categories') { <app-admin-lookup kind="category" /> }
          @case ('brands')     { <app-admin-lookup kind="brand" /> }
          @case ('orders')     { <app-admin-orders /> }
        }
      </div>
    </section>
  `
})
export class AdminDashboard {
  auth = inject(Auth);

  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'categories', label: 'Categories' },
    { id: 'brands', label: 'Brands' },
    { id: 'orders', label: 'Orders' }
  ];

  tab = signal<Tab>('overview');
}
