import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, DashboardMetrics, Address, Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private orderApiUrl = `${environment.apiUrl}/orders`;
  private adminApiUrl = `${environment.apiUrl}/admin`;

  // Customer Order Operations
  createOrder(data: { shippingAddress: Address; paymentMethod?: 'COD' | 'ONLINE' }): Observable<{ success: boolean; message: string; order: Order }> {
    return this.http.post<{ success: boolean; message: string; order: Order }>(
      this.orderApiUrl,
      data,
      { withCredentials: true }
    );
  }

  getMyOrders(): Observable<{ success: boolean; count: number; orders: Order[] }> {
    return this.http.get<{ success: boolean; count: number; orders: Order[] }>(
      `${this.orderApiUrl}/my`,
      { withCredentials: true }
    );
  }

  getOrderById(id: string): Observable<{ success: boolean; order: Order }> {
    return this.http.get<{ success: boolean; order: Order }>(
      `${this.orderApiUrl}/${id}`,
      { withCredentials: true }
    );
  }

  cancelOrder(id: string, reason?: string): Observable<{ success: boolean; message: string; order: Order }> {
    return this.http.patch<{ success: boolean; message: string; order: Order }>(
      `${this.orderApiUrl}/${id}/cancel`,
      { reason },
      { withCredentials: true }
    );
  }

  // Admin Dashboard & Management Operations
  getDashboardMetrics(): Observable<{ success: boolean; data: DashboardMetrics }> {
    return this.http.get<{ success: boolean; data: DashboardMetrics }>(
      `${this.adminApiUrl}/dashboard`,
      { withCredentials: true }
    );
  }

  getAllOrders(status?: string, page: number = 1, limit: number = 10): Observable<{
    success: boolean;
    orders: Order[];
    total: number;
    pages: number;
    currentPage: number;
  }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status && status !== 'All') {
      params = params.set('status', status);
    }

    return this.http.get<any>(`${this.adminApiUrl}/orders`, {
      params,
      withCredentials: true
    });
  }

  updateOrderStatus(orderId: string, status: string, comment?: string): Observable<{
    success: boolean;
    message: string;
    order: Order;
  }> {
    return this.http.patch<{ success: boolean; message: string; order: Order }>(
      `${this.adminApiUrl}/orders/${orderId}/status`,
      { status, comment },
      { withCredentials: true }
    );
  }

  createProduct(productData: Partial<Product>): Observable<{ success: boolean; message: string; product: Product }> {
    return this.http.post<{ success: boolean; message: string; product: Product }>(
      `${this.adminApiUrl}/products`,
      productData,
      { withCredentials: true }
    );
  }

  updateProduct(id: string, productData: Partial<Product>): Observable<{ success: boolean; message: string; product: Product }> {
    return this.http.put<{ success: boolean; message: string; product: Product }>(
      `${this.adminApiUrl}/products/${id}`,
      productData,
      { withCredentials: true }
    );
  }

  deleteProduct(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.adminApiUrl}/products/${id}`,
      { withCredentials: true }
    );
  }
}
