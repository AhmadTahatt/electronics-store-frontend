import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin';
import { ToastService } from '../../services/toast';
import { LookupItem, LookupKind } from '../../models/admin.model';
import { getErrorMessage } from '../../utils/http-error';

/** One component for both Categories and Brands (they have the same fields). */
@Component({
  selector: 'app-admin-lookup',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="admin-toolbar">
      <form class="inline-form" (ngSubmit)="add()">
        <input class="form-control" name="newName" [(ngModel)]="newName" [placeholder]="'New ' + label() + ' name'" maxlength="100">
        <button type="submit" class="btn btn-primary btn-sm" [disabled]="saving()">
          <i class="fa-solid fa-plus"></i> Add {{ label() }}
        </button>
      </form>
    </div>

    @if (loading()) {
      <div class="state-box"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</div>
    } @else if (errorMessage()) {
      <div class="state-box state-error">
        <p><i class="fa-solid fa-circle-exclamation"></i> {{ errorMessage() }}</p>
        <button type="button" class="btn btn-primary btn-sm" (click)="load()">Try again</button>
      </div>
    } @else {
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th style="width:80px">ID</th><th>Name</th><th style="width:220px">Actions</th></tr></thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td>{{ item.id }}</td>
                <td>
                  @if (editingId() === item.id) {
                    <input class="form-control" name="editName" [(ngModel)]="editName" maxlength="100" (keyup.enter)="saveEdit(item)">
                  } @else {
                    {{ item.name }}
                  }
                </td>
                <td>
                  <div class="row-actions">
                    @if (editingId() === item.id) {
                      <button type="button" class="btn btn-primary btn-sm" (click)="saveEdit(item)">Save</button>
                      <button type="button" class="btn btn-outline btn-sm" (click)="editingId.set(null)">Cancel</button>
                    } @else {
                      <button type="button" class="btn btn-outline btn-sm" (click)="startEdit(item)">Edit</button>
                      <button type="button" class="btn btn-outline btn-sm btn-danger" (click)="remove(item)">Delete</button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="3" class="empty-cell">Nothing here yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class AdminLookup implements OnInit {
  private admin = inject(AdminService);
  private toast = inject(ToastService);

  kind = input.required<LookupKind>();
  label = computed(() => (this.kind() === 'category' ? 'category' : 'brand'));

  items = signal<LookupItem[]>([]);
  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');

  newName = '';
  editingId = signal<number | null>(null);
  editName = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.admin.getLookups(this.kind()).subscribe({
      next: list => { this.items.set(list); this.loading.set(false); },
      error: err => {
        this.errorMessage.set(getErrorMessage(err, 'Could not load the list.'));
        this.loading.set(false);
      }
    });
  }

  add(): void {
    const name = this.newName.trim();
    if (!name) { this.toast.show(`Please enter a ${this.label()} name.`, 'error'); return; }
    this.saving.set(true);
    this.admin.createLookup(this.kind(), name).subscribe({
      next: () => {
        this.saving.set(false);
        this.newName = '';
        this.toast.show(`${this.label()} added`, 'success');
        this.load();
      },
      error: err => {
        this.saving.set(false);
        this.toast.show(getErrorMessage(err, 'Could not add it.'), 'error');
      }
    });
  }

  startEdit(item: LookupItem): void {
    this.editingId.set(item.id);
    this.editName = item.name;
  }

  saveEdit(item: LookupItem): void {
    const name = this.editName.trim();
    if (!name) { this.toast.show('Name cannot be empty.', 'error'); return; }
    this.admin.updateLookup(this.kind(), item.id, name).subscribe({
      next: () => {
        this.editingId.set(null);
        this.toast.show('Saved', 'success');
        this.load();
      },
      error: err => this.toast.show(getErrorMessage(err, 'Could not save.'), 'error')
    });
  }

  remove(item: LookupItem): void {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    this.admin.deleteLookup(this.kind(), item.id).subscribe({
      next: () => { this.toast.show('Deleted', 'success'); this.load(); },
      // the backend refuses to delete a category/brand that still has products
      error: err => this.toast.show(getErrorMessage(err, 'Could not delete it.'), 'error')
    });
  }
}
