import { Injectable, computed, signal } from '@angular/core';

/** Holds the ids of the (max 2) products selected for comparison. */
@Injectable({ providedIn: 'root' })
export class Compare {
  static readonly MAX = 2;

  readonly ids = signal<number[]>([]);
  readonly count = computed(() => this.ids().length);

  has(id: number): boolean {
    return this.ids().includes(id);
  }

  /** Returns false when the list is already full. */
  toggle(id: number): boolean {
    if (this.has(id)) {
      this.ids.update(list => list.filter(x => x !== id));
      return true;
    }
    if (this.ids().length >= Compare.MAX) return false;
    this.ids.update(list => [...list, id]);
    return true;
  }

  clear(): void {
    this.ids.set([]);
  }
}
