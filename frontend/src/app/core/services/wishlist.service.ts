import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';
import { AuthService } from './auth.service';

export interface WishlistResponse {
  success: boolean;
  message?: string;
  count: number;
  products: Product[];
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/wishlist`;

  private wishlistItemsSignal = signal<Product[]>(this.loadFromStorage());

  // Public readonly signals
  readonly items = this.wishlistItemsSignal.asReadonly();
  readonly count = computed(() => this.wishlistItemsSignal().length);

  constructor() {
    if (this.authService.isLoggedIn()) {
      this.fetchBackendWishlist();
    }
  }

  private loadFromStorage(): Product[] {
    try {
      const data = localStorage.getItem('trendora_wishlist');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: Product[]) {
    try {
      localStorage.setItem('trendora_wishlist', JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save wishlist to storage', e);
    }
  }

  fetchBackendWishlist() {
    this.http.get<WishlistResponse>(this.apiUrl, { withCredentials: true }).pipe(
      catchError(() => of(null))
    ).subscribe(res => {
      if (res && res.success && res.products) {
        this.wishlistItemsSignal.set(res.products);
        this.saveToStorage(res.products);
      }
    });
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistItemsSignal().some((item) => item._id === productId);
  }

  toggleWishlist(product: Product): boolean {
    const exists = this.isInWishlist(product._id);

    if (this.authService.isLoggedIn()) {
      if (exists) {
        this.http.delete<WishlistResponse>(`${this.apiUrl}/items/${product._id}`, { withCredentials: true })
          .subscribe(res => {
            if (res && res.products) {
              this.wishlistItemsSignal.set(res.products);
              this.saveToStorage(res.products);
            }
          });
      } else {
        this.http.post<WishlistResponse>(`${this.apiUrl}/items`, { productId: product._id }, { withCredentials: true })
          .subscribe(res => {
            if (res && res.products) {
              this.wishlistItemsSignal.set(res.products);
              this.saveToStorage(res.products);
            }
          });
      }
    }

    // Immediate optimistic local update
    let updated: Product[];
    if (exists) {
      updated = this.wishlistItemsSignal().filter((p) => p._id !== product._id);
    } else {
      updated = [...this.wishlistItemsSignal(), product];
    }
    this.wishlistItemsSignal.set(updated);
    this.saveToStorage(updated);
    return !exists;
  }

  removeFromWishlist(productId: string) {
    if (this.authService.isLoggedIn()) {
      this.http.delete<WishlistResponse>(`${this.apiUrl}/items/${productId}`, { withCredentials: true })
        .subscribe(res => {
          if (res && res.products) {
            this.wishlistItemsSignal.set(res.products);
            this.saveToStorage(res.products);
          }
        });
    }

    const updated = this.wishlistItemsSignal().filter((p) => p._id !== productId);
    this.wishlistItemsSignal.set(updated);
    this.saveToStorage(updated);
  }

  clearWishlist() {
    this.wishlistItemsSignal.set([]);
    this.saveToStorage([]);
  }
}
