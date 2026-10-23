import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductService, ProductFilterFacets } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);

  products = signal<Product[]>([]);
  isLoading = signal<boolean>(true);
  totalProducts = signal<number>(0);
  totalPages = signal<number>(1);
  currentPage = signal<number>(1);
  mobileFilterOpen = signal<boolean>(false);

  // Active filter state
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('');
  selectedGender = signal<string>('');
  selectedBrands = signal<string[]>([]);
  selectedSizes = signal<string[]>([]);
  selectedPriceRange = signal<string>('');
  selectedDiscount = signal<number>(0);
  selectedSort = signal<string>('featured');

  // Available filter options
  filterFacets = signal<ProductFilterFacets>({
    availableBrands: [],
    availableSizes: [],
    availableColors: [],
    priceRange: { min: 0, max: 10000 }
  });

  priceOptions = [
    { label: 'All Prices', min: 0, max: 100000 },
    { label: 'Under ₹999', min: 0, max: 999 },
    { label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
    { label: '₹2,000 - ₹3,999', min: 2000, max: 3999 },
    { label: '₹4,000 & Above', min: 4000, max: 100000 }
  ];

  discountOptions = [
    { label: 'All Discounts', value: 0 },
    { label: '10% and above', value: 10 },
    { label: '30% and above', value: 30 },
    { label: '50% and above', value: 50 },
    { label: '70% and above', value: 70 }
  ];

  sortOptions = [
    { label: 'Recommended', value: 'featured' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Newest Arrivals', value: 'newest' },
    { label: 'Better Discount', value: 'discount' },
    { label: 'Customer Rating', value: 'rating' }
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.searchQuery.set(params['search'] || '');
      this.selectedCategory.set(params['category'] || '');
      this.selectedGender.set(params['gender'] || '');
      this.selectedBrands.set(params['brand'] ? params['brand'].split(',') : []);
      this.selectedSizes.set(params['size'] ? params['size'].split(',') : []);
      this.selectedPriceRange.set(params['priceRange'] || '');
      this.selectedDiscount.set(params['minDiscount'] ? Number(params['minDiscount']) : 0);
      this.selectedSort.set(params['sort'] || 'featured');
      this.currentPage.set(params['page'] ? Number(params['page']) : 1);

      this.fetchProducts();
    });
  }

  fetchProducts() {
    this.isLoading.set(true);

    const priceRangeConfig = this.priceOptions.find(p => p.label === this.selectedPriceRange());

    this.productService.getProducts({
      search: this.searchQuery(),
      category: this.selectedCategory(),
      gender: this.selectedGender(),
      brand: this.selectedBrands().join(','),
      size: this.selectedSizes().join(','),
      minPrice: priceRangeConfig && priceRangeConfig.min > 0 ? priceRangeConfig.min : undefined,
      maxPrice: priceRangeConfig && priceRangeConfig.max < 100000 ? priceRangeConfig.max : undefined,
      minDiscount: this.selectedDiscount() > 0 ? this.selectedDiscount() : undefined,
      sort: this.selectedSort(),
      page: this.currentPage(),
      limit: 12
    }).subscribe(res => {
      this.products.set(res.data);
      this.totalProducts.set(res.total);
      this.totalPages.set(res.totalPages || 1);
      if (res.filters && res.filters.availableBrands.length) {
        this.filterFacets.set(res.filters);
      }
      this.isLoading.set(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Filter manipulation helpers
  toggleBrand(brand: string) {
    const current = this.selectedBrands();
    const updated = current.includes(brand)
      ? current.filter(b => b !== brand)
      : [...current, brand];
    this.updateQuery({ brand: updated.join(',') || null, page: 1 });
  }

  toggleSize(size: string) {
    const current = this.selectedSizes();
    const updated = current.includes(size)
      ? current.filter(s => s !== size)
      : [...current, size];
    this.updateQuery({ size: updated.join(',') || null, page: 1 });
  }

  setGender(gender: string) {
    this.updateQuery({ gender: gender || null, page: 1 });
  }

  setCategory(category: string) {
    this.updateQuery({ category: category || null, page: 1 });
  }

  setPriceRange(rangeLabel: string) {
    this.updateQuery({ priceRange: rangeLabel || null, page: 1 });
  }

  setDiscount(discount: number) {
    this.updateQuery({ minDiscount: discount > 0 ? discount : null, page: 1 });
  }

  onSortChange(sort: string) {
    this.updateQuery({ sort, page: 1 });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.updateQuery({ page });
    }
  }

  clearAllFilters() {
    this.router.navigate(['/products'], {
      queryParams: {
        search: this.searchQuery() || null
      }
    });
  }

  removeFilter(type: 'brand' | 'size' | 'category' | 'gender' | 'price' | 'discount', value?: string) {
    if (type === 'brand' && value) {
      this.toggleBrand(value);
    } else if (type === 'size' && value) {
      this.toggleSize(value);
    } else if (type === 'category') {
      this.setCategory('');
    } else if (type === 'gender') {
      this.setGender('');
    } else if (type === 'price') {
      this.setPriceRange('');
    } else if (type === 'discount') {
      this.setDiscount(0);
    }
  }

  private updateQuery(newParams: Record<string, any>) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: newParams,
      queryParamsHandling: 'merge'
    });
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.selectedCategory()) count++;
    if (this.selectedGender()) count++;
    if (this.selectedBrands().length) count += this.selectedBrands().length;
    if (this.selectedSizes().length) count += this.selectedSizes().length;
    if (this.selectedPriceRange()) count++;
    if (this.selectedDiscount() > 0) count++;
    return count;
  }
}
