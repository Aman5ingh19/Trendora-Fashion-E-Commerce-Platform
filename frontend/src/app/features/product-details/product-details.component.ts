import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductService } from '../../core/services/product.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  readonly wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  product = signal<Product | null>(null);
  relatedProducts = signal<Product[]>([]);
  isLoading = signal<boolean>(true);

  // Gallery state
  activeImageIndex = signal<number>(0);

  // Selection state
  selectedSize = signal<string>('');
  selectedColor = signal<string>('');
  sizeError = signal<boolean>(false);

  // Pincode delivery check state
  pincodeInput = signal<string>('');
  pincodeChecked = signal<boolean>(false);
  deliveryEstimate = signal<string>('');

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: string) {
    this.isLoading.set(true);
    this.selectedSize.set('');
    this.sizeError.set(false);
    this.activeImageIndex.set(0);

    this.productService.getProductById(id).subscribe(res => {
      if (res.success && res.data) {
        this.product.set(res.data);
        if (res.data.colors && res.data.colors.length > 0) {
          this.selectedColor.set(res.data.colors[0]);
        }
        this.loadRelatedProducts(id);
      } else {
        this.product.set(null);
      }
      this.isLoading.set(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  loadRelatedProducts(id: string) {
    this.productService.getRelatedProducts(id).subscribe(res => {
      if (res.success && res.data) {
        this.relatedProducts.set(res.data);
      }
    });
  }

  selectImage(index: number) {
    this.activeImageIndex.set(index);
  }

  selectSize(size: string, stock: number) {
    if (stock > 0) {
      this.selectedSize.set(size);
      this.sizeError.set(false);
    }
  }

  get isWishlisted(): boolean {
    const prod = this.product();
    return prod ? this.wishlistService.isInWishlist(prod._id) : false;
  }

  toggleWishlist() {
    const prod = this.product();
    if (!prod) return;

    const added = this.wishlistService.toggleWishlist(prod);
    if (added) {
      this.toastService.show(`Saved "${prod.name}" to your Wishlist`, 'success');
    } else {
      this.toastService.show(`Removed from Wishlist`, 'info');
    }
  }

  addToCart() {
    const prod = this.product();
    if (!prod) return;

    if (!this.selectedSize()) {
      this.sizeError.set(true);
      this.toastService.show('Please select a size to continue', 'error');
      return;
    }

    this.cartService.addToCart(prod, this.selectedSize(), 1);
    this.toastService.show(`Added to Bag (Size: ${this.selectedSize()})`, 'success');
  }

  checkPincode() {
    const pin = this.pincodeInput().trim();
    if (pin.length === 6 && /^\d+$/.test(pin)) {
      this.pincodeChecked.set(true);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 4);
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
      this.deliveryEstimate.set(`Get it by ${deliveryDate.toLocaleDateString('en-IN', options)}`);
    } else {
      this.toastService.show('Please enter a valid 6-digit pincode', 'error');
    }
  }

  getSelectedSizeStock(): number {
    const prod = this.product();
    if (!prod || !this.selectedSize()) return 0;
    const found = prod.sizes.find(s => s.size === this.selectedSize());
    return found ? found.stock : 0;
  }

  get categoryName(): string {
    const prod = this.product();
    if (!prod) return '';
    if (prod.category && typeof prod.category === 'object' && 'name' in prod.category) {
      return (prod.category as any).name || prod.gender || '';
    }
    return (prod.category as string) || prod.gender || '';
  }
}
