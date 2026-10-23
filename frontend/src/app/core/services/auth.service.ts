import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Address } from '../models/product.model';

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  // Reactive state signals
  readonly currentUser = signal<User | null>(null);
  readonly isAuthChecking = signal<boolean>(true);

  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor() {
    this.checkAuth().subscribe();
  }

  // Restore session via HttpOnly cookie
  checkAuth(): Observable<User | null> {
    this.isAuthChecking.set(true);
    return this.http.get<{ success: boolean; user: User }>(`${this.apiUrl}/me`, {
      withCredentials: true
    }).pipe(
      map(res => {
        if (res && res.success && res.user) {
          this.currentUser.set(res.user);
          return res.user;
        }
        this.currentUser.set(null);
        return null;
      }),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      }),
      tap(() => this.isAuthChecking.set(false))
    );
  }

  register(userData: { name: string; email: string; password: string; phone?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData, {
      withCredentials: true
    }).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
        }
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials, {
      withCredentials: true
    }).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
        }
      })
    );
  }

  logout(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/logout`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this.currentUser.set(null);
      }),
      catchError(() => {
        this.currentUser.set(null);
        return of({ success: true });
      })
    );
  }

  addAddress(address: Partial<Address>): Observable<{ success: boolean; addresses: Address[] }> {
    return this.http.post<{ success: boolean; addresses: Address[] }>(
      `${this.apiUrl}/addresses`,
      address,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        if (res.success && res.addresses && this.currentUser()) {
          this.currentUser.update(u => u ? { ...u, addresses: res.addresses } : null);
        }
      })
    );
  }

  deleteAddress(addressId: string): Observable<{ success: boolean; addresses: Address[] }> {
    return this.http.delete<{ success: boolean; addresses: Address[] }>(
      `${this.apiUrl}/addresses/${addressId}`,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        if (res.success && res.addresses && this.currentUser()) {
          this.currentUser.update(u => u ? { ...u, addresses: res.addresses } : null);
        }
      })
    );
  }
}
