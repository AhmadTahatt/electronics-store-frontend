import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../services/admin';
import { ToastService } from '../../services/toast';
import { emptyProductForm, LookupItem, ProductForm } from '../../models/admin.model';
import { ProductApi } from '../../models/api.model';
import { getErrorMessage } from '../../utils/http-error';
import { onImageError } from '../../utils/image';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;   // same limit as the backend

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  template: `
    <div class="admin-toolbar">
      <input class="form-control toolbar-search" name="search" placeholder="Search products..."
             [ngModel]="search()" (ngModelChange)="search.set($event)">
      <button type="button" class="btn btn-primary btn-sm" (click)="openCreate()">
        <i class="fa-solid fa-plus"></i> Add Product
      </button>
    </div>

    @if (loading()) {
      <div class="state-box"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading products...</div>
    } @else if (errorMessage()) {
      <div class="state-box state-error">
        <p><i class="fa-solid fa-circle-exclamation"></i> {{ errorMessage() }}</p>
        <button type="button" class="btn btn-primary btn-sm" (click)="load()">Try again</button>
      </div>
    } @else {
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Product</th><th>Category</th><th>Brand</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            @for (p of filtered(); track p.productId) {
              <tr>
                <td>
                  <div class="cell-product">
                    <img class="admin-thumb" [src]="p.productImgUrl" (error)="onImageError($event)" [alt]="p.name">
                    <span>{{ p.name }}</span>
                  </div>
                </td>
                <td>{{ p.categoryName }}</td>
                <td>{{ p.brandName }}</td>
                <td>{{ p.price | currency:'USD' }}</td>
                <td><strong>{{ p.stock }}</strong></td>
                <td><span class="status-pill" [class.pill-bad]="p.status === 'OutOfStock'" [class.pill-good]="p.status === 'Available'">{{ p.status === 'OutOfStock' ? 'Out of stock' : 'Available' }}</span></td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="btn btn-outline btn-sm" (click)="openEdit(p)">Edit</button>
                    <button type="button" class="btn btn-outline btn-sm" (click)="adjustStock(p)">Stock</button>
                    <button type="button" class="btn btn-outline btn-sm btn-danger" (click)="remove(p)">Delete</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="empty-cell">No products found.</td></tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- Add / Edit modal -->
    <div class="modal-overlay" [class.active]="modalOpen()" (click)="closeModal()">
      @if (modalOpen()) {
        <div class="modal-box" (click)="$event.stopPropagation()">
          <h3 class="modal-title">{{ editingId() === null ? 'Add Product' : 'Edit Product' }}</h3>

          @if (formError()) {
            <div class="alert alert-error" role="alert"><i class="fa-solid fa-circle-exclamation"></i> {{ formError() }}</div>
          }

          <div class="form-stack">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input class="form-control" name="name" [(ngModel)]="form.name" maxlength="150">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-control" name="category" [(ngModel)]="form.categoryId">
                  <option [ngValue]="null">Select...</option>
                  @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Brand</label>
                <select class="form-control" name="brand" [(ngModel)]="form.brandId">
                  <option [ngValue]="null">Select...</option>
                  @for (b of brands(); track b.id) { <option [ngValue]="b.id">{{ b.name }}</option> }
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Price (USD)</label>
                <input class="form-control" type="number" min="0" step="0.01" name="price" [(ngModel)]="form.price">
              </div>
              @if (editingId() === null) {
                <div class="form-group">
                  <label class="form-label">Stock</label>
                  <input class="form-control" type="number" min="0" step="1" name="stock" [(ngModel)]="form.stock">
                </div>
              } @else {
                <div class="form-group">
                  <label class="form-label">Warranty</label>
                  <input class="form-control" name="warrantyEdit" [(ngModel)]="form.warranty" maxlength="100" placeholder="e.g. 1 Year">
                </div>
              }
            </div>

            @if (editingId() === null) {
              <div class="form-group">
                <label class="form-label">Warranty</label>
                <input class="form-control" name="warranty" [(ngModel)]="form.warranty" maxlength="100" placeholder="e.g. 1 Year">
              </div>
            }

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-control" rows="3" name="description" [(ngModel)]="form.description" maxlength="1000"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Image (JPG, PNG or WEBP, max 5 MB)</label>
              @if (currentImage && !imageFile) {
                <img class="admin-thumb admin-thumb-lg" [src]="currentImage" (error)="onImageError($event)" alt="Current image">
              }
              <input class="form-control" type="file" accept=".jpg,.jpeg,.png,.webp" (change)="onFile($event)">
            </div>

            <label class="check-row">
              <input type="checkbox" name="featured" [(ngModel)]="form.isFeatured"> Show on the home page as featured
            </label>

            <div class="form-group">
              <label class="form-label">Specifications</label>
              @for (s of form.specifications; track $index) {
                <div class="spec-row">
                  <input class="form-control" placeholder="Name (e.g. Storage)" maxlength="100"
                         [ngModelOptions]="{standalone: true}" [(ngModel)]="s.name">
                  <input class="form-control" placeholder="Value (e.g. 256GB)" maxlength="255"
                         [ngModelOptions]="{standalone: true}" [(ngModel)]="s.value">
                  <button type="button" class="btn btn-outline btn-sm" aria-label="Remove" (click)="removeSpec($index)">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              }
              <button type="button" class="btn btn-outline btn-sm spec-add" (click)="addSpec()">
                <i class="fa-solid fa-plus"></i> Add specification
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline btn-sm" (click)="closeModal()">Cancel</button>
            <button type="button" class="btn btn-primary btn-sm" [disabled]="saving()" [class.btn-disabled]="saving()" (click)="save()">
              {{ saving() ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminProducts implements OnInit {
  private admin = inject(AdminService);
  private toast = inject(ToastService);

  products = signal<ProductApi[]>([]);
  categories = signal<LookupItem[]>([]);
  brands = signal<LookupItem[]>([]);
  featuredIds = signal<number[]>([]);
  search = signal('');

  loading = signal(true);
  errorMessage = signal('');

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.products();
    return this.products().filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brandName ?? '').toLowerCase().includes(q) ||
      (p.categoryName ?? '').toLowerCase().includes(q));
  });

  // modal state
  modalOpen = signal(false);
  editingId = signal<number | null>(null);
  saving = signal(false);
  formError = signal('');
  form: ProductForm = emptyProductForm();
  imageFile: File | null = null;
  currentImage = '';

  onImageError = onImageError;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    forkJoin({
      products: this.admin.getProducts(),
      categories: this.admin.getLookups('category'),
      brands: this.admin.getLookups('brand'),
      featured: this.admin.getFeaturedIds()
    }).subscribe({
      next: r => {
        this.products.set(r.products);
        this.categories.set(r.categories);
        this.brands.set(r.brands);
        this.featuredIds.set(r.featured);
        this.loading.set(false);
      },
      error: err => {
        this.errorMessage.set(getErrorMessage(err, 'Could not load products.'));
        this.loading.set(false);
      }
    });
  }

  // ---------- modal ----------
  openCreate(): void {
    this.form = emptyProductForm();
    this.imageFile = null;
    this.currentImage = '';
    this.formError.set('');
    this.editingId.set(null);
    this.modalOpen.set(true);
  }

  openEdit(p: ProductApi): void {
    this.admin.getProductDetails(p.productId).subscribe({
      next: d => {
        this.form = {
          name: d.name,
          description: d.description ?? '',
          price: d.price,
          warranty: d.warrantyInformation ?? '',
          stock: null,
          isFeatured: this.featuredIds().includes(d.productId),
          // the details endpoint returns names, the update endpoint needs ids
          brandId: this.brands().find(b => b.name === d.brandName)?.id ?? null,
          categoryId: this.categories().find(c => c.name === d.categoryName)?.id ?? null,
          specifications: d.specifications.map(s => ({ name: s.name, value: s.value }))
        };
        this.imageFile = null;
        this.currentImage = d.productImgUrl ?? '';
        this.formError.set('');
        this.editingId.set(d.productId);
        this.modalOpen.set(true);
      },
      error: err => this.toast.show(getErrorMessage(err, 'Could not load the product.'), 'error')
    });
  }

  closeModal(): void {
    if (this.saving()) return;
    this.modalOpen.set(false);
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (file && file.size > MAX_IMAGE_BYTES) {
      this.formError.set('The image must not exceed 5 MB.');
      (event.target as HTMLInputElement).value = '';
      this.imageFile = null;
      return;
    }
    this.formError.set('');
    this.imageFile = file;
  }

  addSpec(): void { this.form.specifications.push({ name: '', value: '' }); }
  removeSpec(i: number): void { this.form.specifications.splice(i, 1); }

  save(): void {
    const f = this.form;
    if (!f.name.trim()) { this.formError.set('Please enter the product name.'); return; }
    if (!f.categoryId) { this.formError.set('Please choose a category.'); return; }
    if (!f.brandId) { this.formError.set('Please choose a brand.'); return; }
    if (f.price === null || f.price < 0) { this.formError.set('Please enter a valid price.'); return; }
    if (this.editingId() === null && (f.stock === null || f.stock < 0)) {
      this.formError.set('Please enter a valid stock quantity.');
      return;
    }

    this.formError.set('');
    this.saving.set(true);

    const id = this.editingId();
    const request$ = id === null
      ? this.admin.createProduct(f, this.imageFile)
      : this.admin.updateProduct(id, f, this.imageFile);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.toast.show(id === null ? 'Product added' : 'Product updated', 'success');
        this.load();
      },
      error: err => {
        this.saving.set(false);
        this.formError.set(getErrorMessage(err, 'Could not save the product.'));
      }
    });
  }

  // ---------- row actions ----------
  adjustStock(p: ProductApi): void {
    const answer = window.prompt(`Stock for "${p.name}" is ${p.stock}.\nEnter a number to add (e.g. 10) or remove (e.g. -3):`);
    if (answer === null) return;
    const delta = Number.parseInt(answer, 10);
    if (!Number.isInteger(delta) || delta === 0) {
      this.toast.show('Enter a whole number other than 0.', 'error');
      return;
    }
    this.admin.adjustStock(p.productId, delta).subscribe({
      next: () => { this.toast.show('Stock updated', 'success'); this.load(); },
      error: err => this.toast.show(getErrorMessage(err, 'Could not update the stock.'), 'error')
    });
  }

  remove(p: ProductApi): void {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    this.admin.deleteProduct(p.productId).subscribe({
      next: () => { this.toast.show('Product deleted', 'success'); this.load(); },
      error: err => this.toast.show(getErrorMessage(err, 'Could not delete the product.'), 'error')
    });
  }
}
