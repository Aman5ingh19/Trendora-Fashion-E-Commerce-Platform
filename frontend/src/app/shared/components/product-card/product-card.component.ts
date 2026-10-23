import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  readonly wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  activeImageIndex = signal(0);
  selectedSize = signal<string | null>(null);
  showSizeSelector = signal(false);

  get isWishlisted(): boolean {
    return this.wishlistService.isInWishlist(this.product._id);
  }

  onMouseEnter() {
    if (this.product.images && this.product.images.length > 1) {
      this.activeImageIndex.set(1);
    }
  }

  onMouseLeave() {
    this.activeImageIndex.set(0);
    this.showSizeSelector.set(false);
  }

  toggleWishlist(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    const added = this.wishlistService.toggleWishlist(this.product);
    if (added) {
      this.toastService.show(`Added "${this.product.name}" to Wishlist`, 'success');
    } else {
      this.toastService.show(`Removed from Wishlist`, 'info');
    }
  }

  openSizeSelector(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (this.product.sizes && this.product.sizes.length > 0) {
      this.showSizeSelector.set(true);
    } else {
      this.quickAdd('OneSize');
    }
  }

  selectSizeAndAdd(size: string, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.quickAdd(size);
    this.showSizeSelector.set(false);
  }

  private quickAdd(size: string) {
    this.cartService.addToCart(this.product, size, 1);
    this.toastService.show(`Added to Bag (Size: ${size})`, 'success');
  }
}
