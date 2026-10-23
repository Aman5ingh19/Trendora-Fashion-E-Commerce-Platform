import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, Category } from '../models/product.model';

export interface ProductQueryParams {
  search?: string;
  category?: string;
  subCategory?: string;
  gender?: string;
  brand?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  tag?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ProductFilterFacets {
  availableBrands: string[];
  availableSizes: string[];
  availableColors: string[];
  priceRange: {
    min: number;
    max: number;
  };
}

export interface ProductListResponse {
  success: boolean;
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  filters: ProductFilterFacets;
  data: Product[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getProducts(queryParams?: ProductQueryParams): Observable<ProductListResponse> {
    let params = new HttpParams();

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params = params.set(key, val.toString());
        }
      });
    }

    return this.http.get<ProductListResponse>(`${this.apiUrl}/products`, {
      params,
      withCredentials: true
    }).pipe(
      catchError((error) => {
        console.error('Error fetching products from API:', error);
        return of({
          success: false,
          count: 0,
          total: 0,
          totalPages: 1,
          currentPage: 1,
          filters: { availableBrands: [], availableSizes: [], availableColors: [], priceRange: { min: 0, max: 10000 } },
          data: []
        });
      })
    );
  }

  getProductById(id: string): Observable<{ success: boolean; data: Product | null }> {
    return this.http.get<{ success: boolean; data: Product }>(`${this.apiUrl}/products/${id}`, {
      withCredentials: true
    }).pipe(
      catchError((error) => {
        console.error(`Error fetching product ${id}:`, error);
        return of({ success: false, data: null });
      })
    );
  }

  getRelatedProducts(id: string): Observable<{ success: boolean; count: number; data: Product[] }> {
    return this.http.get<{ success: boolean; count: number; data: Product[] }>(
      `${this.apiUrl}/products/${id}/related`,
      { withCredentials: true }
    ).pipe(
      catchError((error) => {
        console.error('Error fetching related products:', error);
        return of({ success: false, count: 0, data: [] });
      })
    );
  }

  getCategories(): Observable<{ success: boolean; count: number; data: Category[] }> {
    return this.http.get<{ success: boolean; count: number; data: Category[] }>(
      `${this.apiUrl}/categories`,
      { withCredentials: true }
    ).pipe(
      catchError((error) => {
        console.error('Error fetching categories:', error);
        return of({ success: false, count: 0, data: [] });
      })
    );
  }
}
