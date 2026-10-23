import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, CartItem } from '../models/product.model';
import { AuthService } from './auth.service';

export interface BackendCartResponse {
  success: boolean;
  message?: string;
  cart: {
    _id: string;
    items: CartItem[];
    itemCount: number;
    subtotal: number;
    originalTotal: number;
    discountTotal: number;
    deliveryFee: number;
    grandTotal: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/cart`;

  private cartItemsSignal = signal<CartItem[]>(this.loadFromStorage());
  readonly isLoading = signal<boolean>(false);

  // Readonly reactive state signals
  readonly items = this.cartItemsSignal.asReadonly();

  readonly count = computed(() =>
    this.cartItemsSignal().reduce((acc, item) => acc + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this.cartItemsSignal().reduce((acc, item) => acc + item.price * item.quantity, 0)
  );

  readonly originalTotal = computed(() =>
    this.cartItemsSignal().reduce((acc, item) => {
      const orig = item.product?.originalPrice || item.price;
      return acc + orig * item.quantity;
    }, 0)
  );

  readonly totalDiscount = computed(() =>
    Math.max(0, this.originalTotal() - this.subtotal())
  );

  readonly deliveryFee = computed(() => {
    const sub = this.subtotal();
    if (sub === 0) return 0;
    return sub >= 999 ? 0 : 99; // Free delivery over ₹999
  });

  readonly grandTotal = computed(() => this.subtotal() + this.deliveryFee());

  constructor() {
    // If logged in, sync with backend
    if (this.authService.isLoggedIn()) {
      this.fetchBackendCart();
    }
  }

  private loadFromStorage(): CartItem[] {
    try {
      const data = localStorage.getItem('trendora_cart');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: CartItem[]) {
    try {
      localStorage.setItem('trendora_cart', JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save cart to storage', e);
    }
  }

  fetchBackendCart() {
    this.isLoading.set(true);
    this.http.get<BackendCartResponse>(this.apiUrl, { withCredentials: true }).pipe(
      catchError(() => of(null)),
      tap(() => this.isLoading.set(false))
    ).subscribe(res => {
      if (res && res.success && res.cart) {
        this.cartItemsSignal.set(res.cart.items || []);
        this.saveToStorage(res.cart.items || []);
      }
    });
  }

  addToCart(product: Product, size: string, quantity = 1): boolean {
    if (this.authService.isLoggedIn()) {
      this.http.post<BackendCartResponse>(`${this.apiUrl}/items`, {
        productId: product._id,
        size,
        quantity,
        color: product.colors?.[0] || 'Default'
      }, { withCredentials: true }).subscribe({
        next: (res) => {
          if (res.success && res.cart) {
            this.cartItemsSignal.set(res.cart.items);
            this.saveToStorage(res.cart.items);
          }
        },
        error: () => {
          this.addToLocalStorage(product, size, quantity);
        }
      });
      return true;
    } else {
      return this.addToLocalStorage(product, size, quantity);
    }
  }

  private addToLocalStorage(product: Product, size: string, quantity: number): boolean {
    const current = this.cartItemsSignal();
    const existingIndex = current.findIndex(
      (item) => item.product._id === product._id && item.size === size
    );

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = current.map((item, idx) => {
        if (idx === existingIndex) {
          return { ...item, quantity: item.quantity + quantity };
        }
        return item;
      });
    } else {
      const newItem: CartItem = {
        _id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        product,
        size,
        color: product.colors?.[0] || 'Default',
        quantity,
        price: product.price
      };
      updated = [...current, newItem];
    }

    this.cartItemsSignal.set(updated);
    this.saveToStorage(updated);
    return true;
  }

  updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    if (this.authService.isLoggedIn()) {
      this.http.patch<BackendCartResponse>(`${this.apiUrl}/items/${itemId}`, { quantity }, {
        withCredentials: true
      }).subscribe({
        next: (res) => {
          if (res.success && res.cart) {
            this.cartItemsSignal.set(res.cart.items);
            this.saveToStorage(res.cart.items);
          }
        },
        error: () => {
          this.updateLocalStorageQuantity(itemId, quantity);
        }
      });
    } else {
      this.updateLocalStorageQuantity(itemId, quantity);
    }
  }

  private updateLocalStorageQuantity(itemId: string, quantity: number) {
    const updated = this.cartItemsSignal().map((item) => {
      if (item._id === itemId) {
        return { ...item, quantity };
      }
      return item;
    });
    this.cartItemsSignal.set(updated);
    this.saveToStorage(updated);
  }

  removeFromCart(itemId: string) {
    if (this.authService.isLoggedIn()) {
      this.http.delete<BackendCartResponse>(`${this.apiUrl}/items/${itemId}`, {
        withCredentials: true
      }).subscribe({
        next: (res) => {
          if (res.success && res.cart) {
            this.cartItemsSignal.set(res.cart.items);
            this.saveToStorage(res.cart.items);
          }
        },
        error: () => {
          this.removeLocalStorageItem(itemId);
        }
      });
    } else {
      this.removeLocalStorageItem(itemId);
    }
  }

  private removeLocalStorageItem(itemId: string) {
    const updated = this.cartItemsSignal().filter((item) => item._id !== itemId);
    this.cartItemsSignal.set(updated);
    this.saveToStorage(updated);
  }

  clearCart() {
    if (this.authService.isLoggedIn()) {
      this.http.delete(`${this.apiUrl}`, { withCredentials: true }).subscribe();
    }
    this.cartItemsSignal.set([]);
    this.saveToStorage([]);
  }
}
