import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AdminService } from '../../services/admin';
import { ToastService } from '../../services/toast';
import { OrderApi, OrderDetailsApi, OrderStatus } from '../../models/admin.model';
import { getErrorMessage } from '../../utils/http-error';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    @if (loading()) {
      <div class="state-box"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading orders...</div>
    } @else if (errorMessage()) {
      <div class="state-box state-error">
        <p><i class="fa-solid fa-circle-exclamation"></i> {{ errorMessage() }}</p>
        <button type="button" class="btn btn-primary btn-sm" (click)="load()">Try again</button>
      </div>
    } @else {
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>#</th><th>Customer</th><th>Phone</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            @for (o of orders(); track o.orderId) {
              <tr>
                <td>{{ o.orderId }}</td>
                <td>{{ o.customerFullName }}</td>
                <td>{{ o.customerPhoneNumber }}</td>
                <td>{{ o.createdAt | date:'mediumDate' }}</td>
                <td>{{ o.totalAmount | currency:'USD' }}</td>
                <td>
                  <select class="form-control status-select" [value]="o.orderStatus" (change)="changeStatus(o, $event)">
                    @for (s of statuses; track s) {
                      <option [value]="s" [selected]="s === o.orderStatus">{{ s }}</option>
                    }
                  </select>
                </td>
                <td><button type="button" class="btn btn-outline btn-sm" (click)="view(o)">View</button></td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="empty-cell">No orders yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    }

    <div class="modal-overlay" [class.active]="details() !== null" (click)="details.set(null)">
      @if (details(); as d) {
        <div class="modal-box" (click)="$event.stopPropagation()">
          <h3 class="modal-title">Order #{{ d.orderId }}</h3>
          <p class="modal-line"><strong>{{ d.customerFullName }}</strong> &middot; {{ d.customerPhoneNumber }}</p>
          <p class="modal-line">{{ d.shippingAddress }}</p>
          <p class="modal-line">{{ d.createdAt | date:'medium' }} &middot; {{ d.orderStatus }} &middot; Cash on delivery</p>

          <div class="admin-table-wrap modal-table">
            <table class="admin-table">
              <thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Subtotal</th></tr></thead>
              <tbody>
                @for (i of d.items; track i.orderItemId) {
                  <tr>
                    <td>{{ i.productName }}</td>
                    <td>{{ i.quantity }}</td>
                    <td>{{ i.unitPrice | currency:'USD' }}</td>
                    <td>{{ i.unitPrice * i.quantity | currency:'USD' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <p class="modal-total">Total: {{ d.totalAmount | currency:'USD' }}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-dark btn-sm" (click)="details.set(null)">Close</button>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminOrders implements OnInit {
  private admin = inject(AdminService);
  private toast = inject(ToastService);

  readonly statuses: OrderStatus[] = ['Pending', 'Delivered', 'Cancelled'];

  orders = signal<OrderApi[]>([]);
  details = signal<OrderDetailsApi | null>(null);
  loading = signal(true);
  errorMessage = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.admin.getOrders().subscribe({
      next: list => {
        // newest first
        this.orders.set([...list].sort((a, b) => b.orderId - a.orderId));
        this.loading.set(false);
      },
      error: err => {
        this.errorMessage.set(getErrorMessage(err, 'Could not load orders.'));
        this.loading.set(false);
      }
    });
  }

  view(o: OrderApi): void {
    this.admin.getOrder(o.orderId).subscribe({
      next: d => this.details.set(d),
      error: err => this.toast.show(getErrorMessage(err, 'Could not load the order.'), 'error')
    });
  }

  changeStatus(o: OrderApi, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const status = select.value as OrderStatus;
    if (status === o.orderStatus) return;

    this.admin.updateOrderStatus(o.orderId, status).subscribe({
      next: () => {
        this.orders.update(list => list.map(x => (x.orderId === o.orderId ? { ...x, orderStatus: status } : x)));
        this.toast.show(`Order #${o.orderId} marked ${status}`, 'success');
      },
      error: err => {
        select.value = o.orderStatus;   // put the old value back
        this.toast.show(getErrorMessage(err, 'Could not update the order.'), 'error');
      }
    });
  }
}
